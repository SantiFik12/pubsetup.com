<?php

declare(strict_types=1);

namespace App\Service;

final readonly class CatalogRefresh
{
    private const int LOCK = 731729002;

    public function __construct(private Database $db, private AdminCatalog $catalog, private ModuleSource $source)
    {
    }

    public function run(string $vendor = '', bool $dryRun = false, int $delay = 3, bool $refreshMedia = false): ?string
    {
        $locked = $this->db->fetchAll('SELECT pg_try_advisory_lock(:key) AS locked', ['key' => self::LOCK])[0]['locked'];
        if (!$locked) {
            return null;
        }
        $run = null;
        try {
            if ('' !== $vendor && !$this->catalog->vendor($vendor)) {
                throw new \InvalidArgumentException('Вендор не найден.');
            }
            $scope = ['vendor' => $vendor, 'dry' => $dryRun ? 'true' : 'false', 'media' => $refreshMedia ? 'true' : 'false'];
            $run = $this->db->fetchAll("SELECT id FROM catalog_refresh_runs WHERE status='running' AND vendor_id=:vendor AND dry_run=CAST(:dry AS boolean) AND refresh_media=CAST(:media AS boolean) ORDER BY started_at LIMIT 1", $scope)[0]['id'] ?? null;
            if (!$run) {
                $this->db->connection()->beginTransaction();
                $run = $this->db->fetchAll('INSERT INTO catalog_refresh_runs(vendor_id,dry_run,refresh_media) VALUES (:vendor,CAST(:dry AS boolean),CAST(:media AS boolean)) RETURNING id', $scope)[0]['id'];
                $this->db->execute("INSERT INTO catalog_refresh_items(run_id,module_id,module_name,vendor_name,source_url) SELECT :run,e.id,e.name,p.name,e.original_url FROM extensions e JOIN partners p ON p.id=e.partner_id WHERE e.published=true AND e.original_url<>'' AND (:vendor='' OR e.partner_id::text=:selected) ORDER BY p.name,e.name", ['run' => $run, 'vendor' => $vendor, 'selected' => $vendor]);
                $this->db->connection()->commit();
            }
            // The session lock was released by the previous process if it died.
            // Only unfinished items are retried; committed results stay intact.
            $this->db->execute("UPDATE catalog_refresh_runs SET heartbeat_at=now(),error='' WHERE id=:id", ['id' => $run]);
            $this->db->execute("UPDATE catalog_refresh_items SET status='pending' WHERE run_id=:run AND status='processing'", ['run' => $run]);
            $failures = [];
            foreach ($this->db->fetchAll("SELECT source_url,status FROM catalog_refresh_items WHERE run_id=:run AND status NOT IN ('pending','processing') ORDER BY id", ['run' => $run]) as $finished) {
                $finishedHost = strtolower(parse_url($finished['source_url'], PHP_URL_HOST) ?? '');
                if ('failed' === $finished['status']) {
                    $failures[$finishedHost] = ($failures[$finishedHost] ?? 0) + 1;
                } elseif ('skipped' !== $finished['status']) {
                    $failures[$finishedHost] = 0;
                }
            }
            $lastHostRequest = [];
            foreach ($this->db->fetchAll("SELECT * FROM catalog_refresh_items WHERE run_id=:run AND status='pending' ORDER BY id", ['run' => $run]) as $item) {
                $host = strtolower(parse_url($item['source_url'], PHP_URL_HOST) ?? '');
                if (($failures[$host] ?? 0) >= 3) {
                    $this->finishItem($item['id'], 'skipped', [], [], 'Обход сайта приостановлен после трёх ошибок подряд.');
                    continue;
                }
                if (isset($lastHostRequest[$host]) && $delay > 0) {
                    $remaining = $delay - (microtime(true) - $lastHostRequest[$host]);
                    if ($remaining > 0) {
                        usleep((int) ($remaining * 1000000));
                    }
                }
                $this->db->execute("UPDATE catalog_refresh_items SET status='processing',started_at=now() WHERE id=:id", ['id' => $item['id']]);
                $this->db->execute('UPDATE catalog_refresh_runs SET heartbeat_at=now() WHERE id=:id', ['id' => $run]);
                try {
                    $module = $item['module_id'] ? $this->catalog->module($item['module_id']) : null;
                    if (!$module || !$module['published'] || $module['original_url'] !== $item['source_url'] || ('' !== $vendor && $module['partner_id'] !== $vendor)) {
                        $this->finishItem($item['id'], 'skipped', [], [], 'Модуль удалён, снят с публикации или его источник/вендор изменён.');
                        continue;
                    }
                    $fields = [];
                    foreach ([1, 2] as $attempt) {
                        $this->db->execute('UPDATE catalog_refresh_items SET attempts=attempts+1 WHERE id=:id', ['id' => $item['id']]);
                        $lastHostRequest[$host] = microtime(true);
                        try {
                            $fields = $this->source->inspect($module['original_url']);
                            break;
                        } catch (\Throwable $error) {
                            if (2 === $attempt || !in_array($error->getCode(), [0, 408, 429, 500, 502, 503, 504], true)) {
                                throw $error;
                            }
                            if ($delay > 0) {
                                sleep(min(30, max(5, $delay * 2)));
                            }
                        }
                    }
                    $media = $this->catalog->sourceMedia($module['id']);
                    if ($refreshMedia) {
                        $media = [];
                    }
                    if ($dryRun) {
                        $changes = $this->catalog->previewSourceChanges($module['id'], $fields);
                        $imageUrls = $fields['_images'] ?? [];
                        $cachedUrls = array_map(static fn (string $key): string => substr($key, 6), array_values(array_filter(array_keys($media), static fn (string $key): bool => str_starts_with($key, 'image:'))));
                        if ($imageUrls !== $cachedUrls) {
                            $changes['images'] = ['old' => $cachedUrls, 'new' => $imageUrls];
                        }
                        $this->finishItem($item['id'], $changes ? 'would_update' : 'unchanged', $changes, $fields['_warnings'] ?? []);
                    } else {
                        $fields = $this->source->materialize($fields, $media);
                        $connection = $this->db->connection();
                        $connection->beginTransaction();
                        $this->db->fetchAll('SELECT id FROM extensions WHERE id=:id FOR UPDATE', ['id' => $module['id']]);
                        $current = $this->catalog->module($module['id']);
                        if (!$current || !$current['published'] || $current['original_url'] !== $item['source_url'] || $current['partner_id'] !== $module['partner_id']) {
                            $this->finishItem($item['id'], 'skipped', [], [], 'Настройки модуля изменены во время загрузки.');
                        } else {
                            $changes = $this->catalog->updateFromSource($module['id'], $fields);
                            $this->finishItem($item['id'], $changes ? 'updated' : 'unchanged', $changes, $fields['_warnings'] ?? []);
                        }
                        $connection->commit();
                    }
                    $failures[$host] = 0;
                } catch (\Throwable $error) {
                    if ($this->db->connection()->inTransaction()) {
                        $this->db->connection()->rollBack();
                    }
                    $this->finishItem($item['id'], 'failed', [], [], mb_substr($error->getMessage(), 0, 2000));
                    $failures[$host] = ($failures[$host] ?? 0) + 1;
                }
            }
            $this->db->execute("UPDATE catalog_refresh_runs SET status=CASE WHEN EXISTS(SELECT 1 FROM catalog_refresh_items WHERE run_id=:run AND status IN ('failed','skipped')) THEN 'partial' ELSE 'success' END,finished_at=now(),heartbeat_at=now() WHERE id=:id", ['run' => $run, 'id' => $run]);

            return $run;
        } catch (\Throwable $error) {
            if ($this->db->connection()->inTransaction()) {
                $this->db->connection()->rollBack();
            }
            if ($run) {
                // Keep the run resumable. The admin UI detects a stale heartbeat.
                $this->db->execute('UPDATE catalog_refresh_runs SET error=:error WHERE id=:id', ['error' => mb_substr($error->getMessage(), 0, 2000), 'id' => $run]);
            }
            throw $error;
        } finally {
            $this->db->fetchAll('SELECT pg_advisory_unlock(:key)', ['key' => self::LOCK]);
        }
    }

    private function finishItem(int $id, string $status, array $changes, array $warnings, string $error = ''): void
    {
        $this->db->execute('UPDATE catalog_refresh_items SET status=:status,changes=CAST(:changes AS jsonb),warnings=CAST(:warnings AS jsonb),error=:error,finished_at=now() WHERE id=:id', ['id' => $id, 'status' => $status, 'changes' => json_encode((object) $changes, JSON_THROW_ON_ERROR), 'warnings' => json_encode(array_values(array_unique($warnings)), JSON_THROW_ON_ERROR), 'error' => $error]);
    }
}
