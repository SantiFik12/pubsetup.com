<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Block;

use Magento\Backend\Block\Template;
use Magento\Backend\Block\Template\Context;
use Pubsetup\Demo\Model\ViewerSession;

class AdminNotice extends Template
{
    public function __construct(Context $context, private ViewerSession $viewer, array $data = [])
    {
        parent::__construct($context, $data);
    }

    protected function _toHtml()
    {
        return $this->viewer->isDemo() ? parent::_toHtml() : '';
    }
}
