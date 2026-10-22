<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\Data\Form\Element\AbstractElement;
use Pubsetup\Demo\Model\AdminPolicy;
use Pubsetup\Demo\Model\ViewerSession;

final class ConfigReadOnly
{
    public function __construct(private ViewerSession $viewer, private AdminPolicy $policy)
    {
    }

    public function beforeRender($subject, AbstractElement $element): void
    {
        if (!$this->viewer->isDemo()) {
            return;
        }
        $element->setDisabled(true)->setReadonly(true)->setIsDisableInheritance(true);
        if ($this->policy->redactsConfigField((string) $element->getType(), (string) $element->getHtmlId().' '.(string) $element->getName())) {
            // Remove the actual value before HTML/JS is generated, not just with CSS.
            $element->setValue('')->setComment(__('Hidden in the public demo.'));
        }
    }
}
