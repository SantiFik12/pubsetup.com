<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\ModuleSourceImporter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\InvalidCsrfTokenException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

final class AdminController extends AbstractController
{
    public function __construct(private readonly AdminCatalog $catalog)
    {
    }

    #[Route('/admin_panel/login', name: 'admin_login', methods: ['GET', 'POST'])]
    public function login(AuthenticationUtils $auth): Response
    {
        if ($this->getUser()) {
            return $this->redirectToRoute('admin_dashboard');
        }
        $failure = $auth->getLastAuthenticationError();
        $error = match (true) {
            $failure instanceof InvalidCsrfTokenException => 'Сессия формы истекла. Введите пароль ещё раз и нажмите «Войти».',
            $failure instanceof TooManyLoginAttemptsAuthenticationException => 'Слишком много попыток входа. Подождите 15 минут после последней попытки и повторите вход.',
            null !== $failure => 'Не удалось войти. Проверьте email и пароль.',
            default => null,
        };

        return $this->render('admin/login.html.twig', ['error' => $error, 'email' => $auth->getLastUsername()]);
    }

    #[Route('/admin_panel/logout', name: 'admin_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Handled by the security firewall');
    }

    #[Route('/admin_panel/assets/admin.css', name: 'admin_css', methods: ['GET'])]
    public function stylesheet(): Response
    {
        return new Response(file_get_contents(dirname(__DIR__, 2).'/public/admin/admin.css'), 200, ['Content-Type' => 'text/css; charset=UTF-8']);
    }

    #[Route('/admin_panel', name: 'admin_dashboard', methods: ['GET'])]
    #[Route('/admin_panel/', methods: ['GET'])]
    public function dashboard(Request $request): Response
    {
        $vendor = $request->query->getString('vendor');
        $query = mb_substr($request->query->getString('q'), 0, 150);
        $selected = '' !== $vendor ? $this->catalog->vendor($vendor) : null;

        $data = $this->catalog->modulePage($vendor, $query, $request->query->getInt('page', 1));

        return $this->render('admin/dashboard.html.twig', $data + ['vendors' => $this->catalog->vendors(), 'selected' => $selected, 'vendor_filter' => $vendor, 'totals' => $this->catalog->totals(), 'query' => $query]);
    }

    #[Route('/admin_panel/vendors/new', name: 'admin_vendor_new', methods: ['GET', 'POST'])]
    #[Route('/admin_panel/vendors/{id}/edit', name: 'admin_vendor_edit', methods: ['GET', 'POST'])]
    public function vendorForm(Request $request, ?string $id = null): Response
    {
        $vendor = $id ? $this->catalog->vendor($id) : ['name' => '', 'slug' => '', 'website' => '', 'description' => ''];
        if (!$vendor) {
            throw $this->createNotFoundException();
        }
        $error = null;
        if ($request->isMethod('POST')) {
            $this->checkCsrf($request, 'vendor_'.($id ?? 'new'));
            $vendor = array_replace($vendor, $request->request->all());
            try {
                $saved = $this->catalog->saveVendor($request->request->all(), $id);
                $this->addFlash('success', 'Вендор сохранён. Affiliate-настройка применяется к его модулям без индивидуальной ссылки.');

                return $this->redirectToRoute('admin_dashboard', ['vendor' => $saved]);
            } catch (\InvalidArgumentException $e) {
                $error = $e->getMessage();
            }
        }

        return $this->render('admin/vendor.html.twig', ['vendor' => $vendor, 'vendor_id' => $id, 'error' => $error], new Response(status: $error ? 422 : 200));
    }

    #[Route('/admin_panel/modules/new', name: 'admin_module_new', methods: ['GET', 'POST'])]
    #[Route('/admin_panel/modules/{id}/edit', name: 'admin_module_edit', methods: ['GET', 'POST'])]
    public function moduleForm(Request $request, ModuleSourceImporter $source, ?string $id = null): Response
    {
        if (null === $id) {
            $vendor = $request->isMethod('POST') ? $request->request->getString('partner_id') : $request->query->getString('vendor');
            $url = $request->request->getString('original_url');
            $affiliate = $request->request->getString('affiliate_url');
            $error = null;
            if ($request->isMethod('POST')) {
                $this->checkCsrf($request, 'module_new');
                try {
                    AdminCatalog::url($url, true);
                    AdminCatalog::url($affiliate);
                    $fields = $source->fetch($url);
                    $this->catalog->importModule($url, $affiliate, $vendor, $fields);
                    $this->addFlash('success', sprintf('Модуль «%s» загружен по ссылке.', $fields['name']));
                    foreach ($fields['_warnings'] ?? [] as $warning) {
                        $this->addFlash('warning', $warning);
                    }

                    return $this->redirectToRoute('admin_dashboard');
                } catch (\InvalidArgumentException $e) {
                    $error = $e->getMessage();
                } catch (\Throwable) {
                    $error = 'Не удалось загрузить модуль. Проверьте ссылку на товар и повторите импорт: сайт вендора может быть временно недоступен.';
                }
            }

            return $this->render('admin/import.html.twig', ['selected' => '' !== $vendor ? $this->catalog->vendor($vendor) : null, 'vendor_id' => $vendor, 'original_url' => $url, 'affiliate_url' => $affiliate, 'error' => $error], new Response(status: $error ? 422 : 200));
        }
        $module = $this->catalog->module($id);
        if (!$module) {
            throw $this->createNotFoundException();
        }
        $error = null;
        if ($request->isMethod('POST')) {
            $this->checkCsrf($request, 'module_'.$id);
            $data = $request->request->all();
            try {
                $this->catalog->saveModuleSettings($id, $data);
                $this->addFlash('success', 'Настройки модуля сохранены.');

                return $this->redirectToRoute('admin_module_edit', ['id' => $id]);
            } catch (\InvalidArgumentException $e) {
                $error = $e->getMessage();
                foreach (['original_url', 'affiliate_url', 'partner_id'] as $key) {
                    $module[$key] = $request->request->getString($key);
                }
                $module['published'] = isset($data['published']);
            }
        }

        return $this->render('admin/module.html.twig', ['module' => $module, 'module_id' => $id, 'vendors' => $this->catalog->vendors(), 'error' => $error], new Response(status: $error ? 422 : 200));
    }

    #[Route('/admin_panel/modules/{id}/upload', name: 'admin_module_upload', methods: ['POST'])]
    public function upload(Request $request, string $id, ModuleSourceImporter $source): Response
    {
        $this->checkCsrf($request, 'upload_'.$id);
        $module = $this->catalog->module($id);
        if (!$module) {
            throw $this->createNotFoundException();
        }
        try {
            $fields = $source->materialize($source->inspect($module['original_url']), $this->catalog->sourceMedia($id));
            $this->catalog->updateFromSource($id, $fields);
            foreach ($fields['_warnings'] ?? [] as $warning) {
                $this->addFlash('warning', $warning);
            }
            $this->addFlash('success', 'Данные из источника обновлены. Affiliate-ссылка, slug и счётчики сохранены. Проверьте содержимое модуля.');

            return $this->redirectToRoute('admin_dashboard');
        } catch (\Throwable) {
            $this->addFlash('error', 'Источник не удалось прочитать. Сайт может блокировать автоматическую загрузку. Данные модуля сохранены; повторите Upload позже.');
        }

        return $this->redirectToRoute('admin_module_edit', ['id' => $id]);
    }

    #[Route('/admin_panel/modules/{id}/delete', name: 'admin_module_delete', defaults: ['kind' => 'module'], methods: ['GET', 'POST'])]
    #[Route('/admin_panel/vendors/{id}/delete', name: 'admin_vendor_delete', defaults: ['kind' => 'vendor'], methods: ['GET', 'POST'])]
    public function deleteForm(Request $request, string $id, string $kind): Response
    {
        $record = $this->catalog->deletionInfo($kind, $id);
        if (!$record) {
            throw $this->createNotFoundException();
        }
        $error = null;
        if ($request->isMethod('POST')) {
            $this->checkCsrf($request, 'delete_'.$kind.'_'.$id);
            try {
                if ('delete' !== $request->request->getString('confirm')) {
                    throw new \InvalidArgumentException('Подтвердите удаление записи.');
                }
                if (!$this->catalog->deleteRecord($kind, $id)) {
                    throw $this->createNotFoundException();
                }
                $this->addFlash('success', 'vendor' === $kind ? 'Вендор и все его модули удалены.' : 'Модуль удалён.');

                return $this->redirectToRoute('admin_dashboard');
            } catch (\InvalidArgumentException $e) {
                $error = $e->getMessage();
                $record = $this->catalog->deletionInfo($kind, $id) ?? $record;
            }
        }

        return $this->render('admin/delete.html.twig', ['record' => $record, 'kind' => $kind, 'error' => $error], new Response(status: $error ? 422 : 200));
    }

    private function checkCsrf(Request $request, string $id): void
    {
        if (!$this->isCsrfTokenValid($id, $request->request->getString('_token'))) {
            throw $this->createAccessDeniedException('Недействительный токен формы. Обновите страницу.');
        }
    }
}
