<?php

declare(strict_types=1);
namespace App\Controller;
use App\Service\CatalogService;
use App\Service\Database;
use App\Service\OrderService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
final class ApiController
{
    #[Route('/health', methods: ['GET'])]
    public function health(Database $db): JsonResponse
    {
        try { $db->fetchAll('SELECT 1'); return new JsonResponse(['status' => 'ok']); }
        catch (\Throwable) { return new JsonResponse(['status' => 'unavailable'], 503); }
    }
    #[Route('/api/catalog', methods: ['GET'])]
    public function catalog(CatalogService $catalog): JsonResponse
    {
        $response = new JsonResponse($catalog->all());
        $response->headers->set('Cache-Control', 'public, max-age=0, must-revalidate');
        return $response;
    }
    #[Route('/api/settings', methods: ['GET'])]
    public function settings(Database $db): JsonResponse
    {
        return new JsonResponse($db->fetchAll('SELECT paddle_token_live,paddle_token_sandbox,paddle_mode FROM app_settings WHERE id = true')[0] ?? []);
    }
    #[Route('/api/orders', methods: ['POST'])]
    public function order(Request $request, OrderService $orders): JsonResponse
    {
        if (!str_starts_with(strtolower($request->headers->get('Content-Type', '')), 'application/json')) {
            return new JsonResponse(['error' => 'Expected application/json'], 415);
        }
        if (strlen($request->getContent()) > 20000) { return new JsonResponse(['error' => 'Request too large'], 413); }
        // Same-origin browser requests; clients without Origin may call the public API.
        $origin = $request->headers->get('Origin');
        if ($origin !== null && parse_url($origin, PHP_URL_HOST) !== $request->getHost()) {
            return new JsonResponse(['error' => 'Invalid origin'], 403);
        }
        try {
            $input = json_decode($request->getContent(), true, 32, JSON_THROW_ON_ERROR);
            if (!is_array($input) || array_is_list($input)) { throw new \InvalidArgumentException('Expected a JSON object'); }
            return new JsonResponse($orders->create($input, $request->server->get('REMOTE_ADDR', 'unknown')), 201, ['Cache-Control' => 'no-store']);
        } catch (\JsonException|\InvalidArgumentException $e) { return new JsonResponse(['error' => $e->getMessage()], 422); }
        catch (\OverflowException $e) { return new JsonResponse(['error' => $e->getMessage()], 429, ['Retry-After' => '3600']); }
    }
}
