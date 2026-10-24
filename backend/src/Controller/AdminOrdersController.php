<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\AdminOrders;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
final class AdminOrdersController extends AbstractController
{
    public function __construct(private readonly AdminOrders $orders, private readonly AdminCatalog $catalog)
    {
    }

    #[Route('/admin_panel/orders', name: 'admin_orders', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $data = $this->orders->search($request->query->getString('q'), $request->query->getString('status'), $request->query->getInt('page', 1));

        return $this->render('admin/orders.html.twig', $data + ['vendors' => $this->catalog->vendors()]);
    }

    #[Route('/admin_panel/orders/{id}', name: 'admin_order_show', methods: ['GET'])]
    public function show(string $id): Response
    {
        $data = $this->orders->details($id);
        if (null === $data) {
            throw $this->createNotFoundException('Заказ не найден.');
        }

        return $this->render('admin/order.html.twig', $data + ['vendors' => $this->catalog->vendors()]);
    }
}
