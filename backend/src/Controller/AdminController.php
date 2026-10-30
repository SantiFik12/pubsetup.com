<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\ModuleImages;
use App\Service\ModuleSourceImporter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\InvalidCsrfTokenException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

final class AdminController extends AbstractController
{
    public function __construct(private readonly AdminCatalog $catalog, private readonly ModuleImages $images)
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

        return $this->render('admin/dashboard.html.twig', ['vendors' => $this->catalog->vendors(), 'modules' => $this->catalog->modules($vendor, $query), 'selected' => $selected, 'totals' => $this->catalog->totals(), 'query' => $query]);
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
                $this->addFlash('success', 'Вендор сохранён. Теперь можно добавить его модули.');

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
        $stored = $id ? $this->catalog->module($id) : null;
        if ($id && !$stored) {
            throw $this->createNotFoundException();
        }
        $module = array_replace(['name' => '', 'slug' => '', 'partner_id' => $request->query->getString('vendor'), 'category_id' => '', 'original_url' => '', 'affiliate_url' => '', 'user_guide_url' => '', 'short_description' => '', 'description' => '', 'price_from' => '0', 'price_type' => 'one-time', 'install_price' => '60', 'cover_image' => '', 'gallery' => [], 'tags' => [], 'features' => [], 'magento_versions' => [], 'published' => true, 'hyva_compatible' => false], $stored ?? []);
        foreach (['gallery', 'features'] as $key) {
            $module[$key] = implode("\n", $module[$key]);
        }
        foreach (['tags', 'magento_versions'] as $key) {
            $module[$key] = implode(', ', $module[$key]);
        }
        $error = null;
        if ($request->isMethod('POST')) {
            $this->checkCsrf($request, 'module_'.$id);
            $data = $request->request->all();
            $module = array_replace($module, $data, ['published' => isset($data['published']), 'hyva_compatible' => isset($data['hyva_compatible'])]);
            try {
                $cover = $request->files->get('cover_upload');
                if ($cover instanceof UploadedFile) {
                    $data['cover_image'] = $this->images->upload($cover);
                    $module['cover_image'] = $data['cover_image'];
                }
                $gallery = $request->files->all('gallery_uploads');
                if (count($gallery) > 8) {
                    throw new \InvalidArgumentException('За один раз можно загрузить до 8 скриншотов.');
                }
                foreach ($gallery as $file) {
                    if ($file instanceof UploadedFile) {
                        $data['gallery'] = trim(($data['gallery'] ?? '')."\n".$this->images->upload($file));
                    }
                }
                $module['gallery'] = $data['gallery'] ?? '';
                $saved = $this->catalog->saveModule($data, $id);
                $this->addFlash('success', 'Модуль сохранён. Изменения доступны в каталоге.');

                return $this->redirectToRoute('admin_module_edit', ['id' => $saved]);
            } catch (\InvalidArgumentException $e) {
                $error = $e->getMessage();
            }
        }

        return $this->render('admin/module.html.twig', ['module' => $module, 'module_id' => $id, 'vendors' => $this->catalog->vendors(), 'categories' => $this->catalog->categories(), 'error' => $error], new Response(status: $error ? 422 : 200));
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
            $fields = $source->fetch($module['original_url']);
            $this->catalog->updateFromSource($id, $fields);
            foreach ($fields['_warnings'] ?? [] as $warning) {
                $this->addFlash('warning', $warning);
            }
            $this->addFlash('success', 'Данные из источника обновлены. Affiliate-ссылка, slug и счётчики сохранены. Проверьте содержимое модуля.');

            return $this->redirectToRoute('admin_dashboard');
        } catch (\Throwable) {
            $this->addFlash('error', 'Источник не удалось прочитать. Сайт может блокировать автоматическую загрузку. Данные модуля сохранены; отредактируйте их вручную.');
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
                $this->addFlash('success', 'vendor' === $kind ? 'Вендор удалён.' : 'Модуль удалён.');

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
