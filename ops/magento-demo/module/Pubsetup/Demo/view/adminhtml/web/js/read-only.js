define([], function () {
    'use strict';
    return function () {
        document.body.classList.add('pubsetup-demo-viewer');
        var notice = document.querySelector('.pubsetup-demo-notice');
        var content = document.querySelector('.page-main-actions') || document.querySelector('.page-content');
        if (notice && content) {
            content.parentNode.insertBefore(notice, content);
        }
        var style = document.createElement('style');
        // Presentation only; AdminReadOnly enforces the same boundary on the server.
        style.textContent = '.pubsetup-demo-viewer .page-actions button:not(.back),'
            + '.pubsetup-demo-viewer .action-menu-item[data-action="delete"],'
            + '.pubsetup-demo-viewer .action-select-wrap[data-bind*="massaction"],'
            + '.pubsetup-demo-viewer [data-index="listing_massaction"],'
            + '.pubsetup-demo-viewer .order-comments .actions,'
            + '.pubsetup-demo-viewer .admin-user-account-text + .admin-user-account-links a:not([href*="auth/logout"])'
            + '{display:none!important}'
            + '.pubsetup-demo-viewer .pubsetup-demo-notice{margin:16px 30px}';
        document.head.appendChild(style);
        var lockFields = function () {
            document.querySelectorAll(
                '[data-form-part="product_form"] input, [data-form-part="product_form"] select,'
                + '[data-form-part="product_form"] textarea, [form="product_form"],'
                + '#category_edit_form input, #category_edit_form select, #category_edit_form textarea,'
                + '#history_form textarea, #history_form input'
            ).forEach(function (field) {
                if (field.type !== 'hidden' && !field.disabled) {
                    field.disabled = true;
                }
            });
        };
        lockFields();
        new MutationObserver(lockFields).observe(document.body, {childList: true, subtree: true});
    };
});
