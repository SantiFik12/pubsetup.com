<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\AdminCatalog;
use App\Service\CatalogRefresh;
use App\Service\Database;
use App\Service\ModuleImages;
use App\Service\ModuleSource;
use App\Service\ModuleSourceImporter;
use Symfony\Component\HttpClient\MockHttpClient;

$checks = 0;
$check = static function (bool $ok, string $message) use (&$checks): void {
    ++$checks;
    if (!$ok) {
        throw new RuntimeException($message);
    }
};
$check([] === AdminCatalog::sourceDiff(['price_from' => '169.00', 'rating' => '4.80', 'reviews' => 64], ['price_from' => 169, 'rating' => 4.8, 'reviews' => '64']), 'Numeric formatting must not cause updates');
$check(['reviews' => ['old' => 64, 'new' => 65]] === AdminCatalog::sourceDiff(['reviews' => 64], ['reviews' => 65]), 'Real review count change was lost');
$directory = sys_get_temp_dir().'/pubsetup-refresh-media-'.bin2hex(random_bytes(5));
$images = new ModuleImages($directory);
$path = $images->store(base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII='));
$importer = new ModuleSourceImporter(new MockHttpClient(static function (): never { throw new RuntimeException('Cached media must not issue HTTP requests'); }), $images);
$cached = ['image:https://vendor.example/a.png' => $path];
$materialized = $importer->materialize(['_images' => ['https://vendor.example/a.png']], $cached);
$check($path === $materialized['cover_image'] && [] === $materialized['gallery'] && $cached === $materialized['_media'], 'Known media was downloaded again or a one-image gallery was not cleared');
$check(1 === count(glob($directory.'/*')), 'Unchanged media created duplicate files');
$partial = $importer->materialize(['_images' => ['https://vendor.example/a.png', 'https://vendor.example/missing.png']], $cached);
$check(!isset($partial['cover_image']) && !isset($partial['gallery']) && [] !== $partial['_warnings'], 'Partial downloads must preserve existing gallery');
unlink($directory.'/'.basename($path));
rmdir($directory);
echo 'Catalog refresh unit checks: '.$checks." passed.\n";

$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$databaseUrl) {
    exit(0);
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$db->execute('SET ROLE pubsetup_app');
$catalog = new AdminCatalog($db);
$suffix = bin2hex(random_bytes(5));
$vendor = $catalog->saveVendor(['name' => 'Refresh QA', 'slug' => 'refresh-'.$suffix], null);
$urls = [];
$ids = [];
$fields = [];
foreach (['A' => '100', 'B' => '20', 'C' => '30'] as $name => $price) {
    $url = 'https://'.$name.'.example/'.$suffix;
    $urls[$name] = $url;
    $fields[$url] = ['name' => 'Refresh '.$name.' '.$suffix, 'description' => 'Original '.$name, 'price_from' => $price, 'reviews' => 10, 'rating' => 4.5];
    $ids[$name] = $catalog->importModule($url, 'https://affiliate.example/'.$name, $vendor, $fields[$url]);
}
$beforeB = $catalog->module($ids['B']);
$source = new class($fields) implements ModuleSource {
    public array $calls = [];
    public int $downloads = 0;
    public array $failures = [];

    public function __construct(public array $fields)
    {
    }

    public function inspect(string $url): array
    {
        $this->calls[$url] = ($this->calls[$url] ?? 0) + 1;
        if (isset($this->failures[$url])) {
            $failure = $this->failures[$url];
            if (is_array($failure)) {
                if ([] !== $failure) {
                    $code = array_shift($this->failures[$url]);
                    throw new RuntimeException('Transient HTTP '.$code, $code);
                }
            } else {
                throw new RuntimeException('Source HTTP '.$failure, $failure);
            }
        }

        return $this->fields[$url] ?? ['name' => 'Blocked', 'description' => 'Blocked'];
    }

    public function materialize(array $data, array $media = []): array
    {
        ++$this->downloads;
        $data['_media'] = $media;

        return $data;
    }
};
$source->fields[$urls['A']]['price_from'] = '150.00';
$source->failures[$urls['C']] = 403;
$worker = new CatalogRefresh($db, $catalog, $source);
$dry = $worker->run($vendor, true, 0);
$check(100.0 === (float) $catalog->module($ids['A'])['price_from'] && 0 === $source->downloads, 'Dry run mutated data or downloaded media');
$check(1 === (int) $db->fetchAll("SELECT count(*) AS n FROM catalog_refresh_items WHERE run_id=:run AND status='would_update'", ['run' => $dry])[0]['n'], 'Dry run planned incorrect number of updates');
$check('partial' === $db->fetchAll('SELECT status FROM catalog_refresh_runs WHERE id=:id', ['id' => $dry])[0]['status'], 'Partial failure incorrectly reported as success');
$first = $worker->run($vendor, false, 0);
$firstItems = $db->fetchAll('SELECT module_id,status FROM catalog_refresh_items WHERE run_id=:run', ['run' => $first]);
$statuses = array_column($firstItems, 'status', 'module_id');
$check('updated' === $statuses[$ids['A']] && 'unchanged' === $statuses[$ids['B']] && 'failed' === $statuses[$ids['C']], 'Updated/unchanged/failed distinction broken');
$check($beforeB['updated_at'] === $catalog->module($ids['B'])['updated_at'], 'Unchanged check changed sitemap modification time');
$check('https://affiliate.example/A' === $catalog->module($ids['A'])['affiliate_url'], 'Refresh changed affiliate URL');
$check([] !== $db->fetchAll('SELECT checked_at FROM catalog_source_state WHERE module_id=:id', ['id' => $ids['B']]), 'Successful unchanged check did not record check time');
$afterA = $catalog->module($ids['A']);
$repeat = $worker->run($vendor, false, 0);
$check(0 === (int) $db->fetchAll("SELECT count(*) AS n FROM catalog_refresh_items WHERE run_id=:run AND status='updated'", ['run' => $repeat])[0]['n'], 'Unchanged source caused a second update');
$check($afterA['updated_at'] === $catalog->module($ids['A'])['updated_at'], 'Repeated refresh changed module timestamp');
$source->failures[$urls['C']] = [503];
$retried = $worker->run($vendor, false, 0);
$check('success' === $db->fetchAll('SELECT status FROM catalog_refresh_runs WHERE id=:id', ['id' => $retried])[0]['status'], 'Transient error did not recover');
$check(2 === (int) $db->fetchAll('SELECT attempts FROM catalog_refresh_items WHERE run_id=:run AND module_id=:id', ['run' => $retried, 'id' => $ids['C']])[0]['attempts'], 'Retry attempts not recorded');
// Hold the same advisory lock from a separate session.
$otherDb = new Database($databaseUrl);
$otherDb->fetchAll('SELECT pg_advisory_lock(731729002)');
$check(null === $worker->run($vendor, false, 0), 'Overlapping refresh was not blocked');
$otherDb->fetchAll('SELECT pg_advisory_unlock(731729002)');
// Reconstruct a run interrupted after one committed item and during another.
$resuming = $db->fetchAll('INSERT INTO catalog_refresh_runs(vendor_id) VALUES (:vendor) RETURNING id', ['vendor' => $vendor])[0]['id'];
foreach (['A' => 'unchanged', 'B' => 'processing'] as $name => $status) {
    $db->execute('INSERT INTO catalog_refresh_items(run_id,module_id,module_name,vendor_name,source_url,status) VALUES (:run,:module,:name,\'QA\',:url,:status)', ['run' => $resuming, 'module' => $ids[$name], 'name' => $name, 'url' => $urls[$name], 'status' => $status]);
}
$callsA = $source->calls[$urls['A']];
$check($resuming === $worker->run($vendor, false, 0) && $callsA === $source->calls[$urls['A']], 'Resume repeated already committed modules');
$check('success' === $db->fetchAll('SELECT status FROM catalog_refresh_runs WHERE id=:id', ['id' => $resuming])[0]['status'], 'Resumed run did not complete');
// A broken host must not cause repeated requests to every module.
$blockedVendor = $catalog->saveVendor(['name' => 'Blocked QA', 'slug' => 'blocked-'.$suffix], null);
foreach (range(1, 5) as $number) {
    $url = 'https://blocked.example/'.$suffix.'/'.$number;
    $catalog->importModule($url, '', $blockedVendor, ['name' => 'Blocked '.$number.' '.$suffix, 'description' => 'Blocked']);
    $source->failures[$url] = 403;
}
$blockedRun = $worker->run($blockedVendor, false, 0);
$counts = array_column($db->fetchAll('SELECT status,count(*) AS n FROM catalog_refresh_items WHERE run_id=:id GROUP BY status', ['id' => $blockedRun]), 'n', 'status');
$check(3 === (int) $counts['failed'] && 2 === (int) $counts['skipped'], 'Host circuit breaker did not stop repeated failures');
echo 'Catalog refresh total checks: '.$checks." passed (runtime database role, dry run, updates, no-op timestamps, retries, lock, resume and circuit breaker).\n";
