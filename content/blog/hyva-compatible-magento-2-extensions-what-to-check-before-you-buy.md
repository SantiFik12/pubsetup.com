# Hyvä-Compatible Magento 2 Extensions: What to Check Before You Buy

Check Hyvä Theme and Checkout support, compatibility packages, CSP limitations, and maintenance terms before buying a Magento 2 extension.

![Hyvä-Compatible Magento 2 Extensions: What to Check Before You Buy](/images/blog/pubsetup-hyva-compatible-magento-2-extensions.webp)

A “Hyvä compatible” badge is a useful starting point when choosing a Magento 2 extension. It is not a complete implementation plan. You still need to know which features are supported, which packages must be installed, and whether the integration matches your theme and checkout.

This guide explains how to turn a compatibility claim into a buying decision you can verify. We use three extensions from the Pubsetup catalog to illustrate different situations, then provide questions for vendors and a staging checklist. These are documentation-based examples, not a certification or a hands-on performance ranking.

Disclosure: Pubsetup may earn a commission when you purchase through partner links. Installation is available as a separate service. Compatibility statements below reflect vendor documentation reviewed on November 8, 2026; check the current release and integration instructions before purchase.

## What does Hyvä compatibility actually cover?

Extensions that change the storefront may need a Hyvä-specific implementation or an additional compatibility module. Hyvä’s official documentation provides a dedicated compatibility-module section. Installing the Magento extension alone should not be treated as proof that its storefront features are ready for your theme.

Think in terms of customer tasks. A review extension may display a review list but also provide a submission form, image upload, and account-area components. Ask which of those surfaces are covered. A screenshot of one working page does not establish that the entire journey works.

- Scope: which pages, components, and customer interactions are included?
- Delivery: is the integration part of the main extension or a separate package?
- Versions: which releases of Magento, Hyvä, the extension, and the compatibility package are supported together?
- Ownership: who maintains the integration and handles issues after an update?

For an extension that operates mainly in the admin area, the relevant questions may be different. Ask whether it changes storefront output, injects scripts, or affects checkout data before assuming either that an adapter is necessary or that no testing is needed.

## Separate Hyvä Theme support from Hyvä Checkout support

Treat the theme and checkout as separate items in your requirements. An integration may cover product and category pages while the checkout needs its own adapter. For payments, consult Hyvä’s checkout integration documentation and confirm the specific gateway module and maintainer involved.

Also distinguish Hyvä Checkout from a checkout running through a Luma fallback. The latter can be a deliberate architecture choice, but it does not establish that the extension integrates with Hyvä Checkout. Ask the vendor to name the actual checkout implementation and explain any effect on your planned purchase flow.

Questions to ask when a product is advertised as Hyvä compatible

| Claim or setup | What to confirm | Evidence to request |
| --- | --- | --- |
| Hyvä Theme support | The storefront features you need are included | A feature list and a demo using the supported theme |
| Hyvä Checkout support | The exact checkout integration and version range | Installation instructions and a checkout demo |
| Luma fallback | Which routes use the fallback and which checkout runs there | A route/configuration guide and a complete order flow |
| CSP support | The integration works with your enforced policy | Release notes, package requirements, and a working CSP demo |
| Separate compatibility module | Access, price, version constraints, and maintenance owner | Composer package name and support terms |

## Check the package and version combination before paying

Request a package list for your exact setup. Include the main extension, any Hyvä adapter, any checkout adapter, and optional dependencies required by the features you want. Confirm how your developer will obtain each package and whether access depends on a separate account, purchase, or support arrangement.

A working combination today also needs an update path. Ask whether the adapter follows the main module’s release cycle and who investigates a conflict when the two packages come from different maintainers. Keep the answer with the project’s installation notes.

- Send the vendor your Magento edition and version, PHP version, Hyvä package versions, and checkout implementation.
- List required features individually, including account pages and checkout interactions.
- Ask for supported version combinations and known limitations, rather than a general assurance.
- Confirm whether custom theme overrides or other extensions fall outside standard support.

## CSP compatibility deserves its own check

Content Security Policy, or CSP, controls which scripts the browser is allowed to execute. Hyvä documents a strict policy for its CSP-enabled theme and checkout. A component that works in a different configuration may therefore need a separate compatibility update.

Tell the vendor whether you use a CSP-enabled implementation and ask about the exact features you need. During staging tests, review both the visible behavior and browser policy errors. A page can look correct while a button, popup, or update action fails.

If the supported integration cannot meet a required interaction under your policy, account for that limitation in the purchase decision. Do not plan the project around an undocumented assumption that the full feature set will behave identically in every setup.

## Example 1: Amasty Improved Layered Navigation and feature-specific limits

Amasty Improved Layered Navigation offers advanced filters and advertises Hyvä support. However, its current product FAQ documents that AJAX functionality is not supported with the Hyvä Theme CSP compatibility package. This is an example of why a compatibility badge must be read alongside feature-level limitations.

If instant filter updates are a requirement, confirm the behavior in your exact configuration before buying. Test multiple selections, removing a selected value, changing sort order, and mobile filters. Decide whether the supported behavior meets your store’s needs.

- Question for the vendor: which filtering interactions work with our theme and CSP setup?
- Acceptance check: shoppers can narrow the results and remove filters without broken controls or unexpected state.

[Improved Layered Navigation for Magento 2](https://pubsetup.com/extension/improved-layered-navigation-for-magento-2) · [Vendor documentation](https://amasty.com/improved-layered-navigation-for-magento-2.html)

## Example 2: Mageplaza Reward Points and checkout integration

Mageplaza’s Reward Points FAQ explicitly states compatibility with both Hyvä Theme and Hyvä Checkout. That is more specific than a theme-only label, but you should still confirm package requirements and supported releases for your installation.

For a rewards program, follow the points through a complete order rather than checking only the balance display. Your acceptance criteria should cover redeeming points, recalculating totals, and what happens when an order is canceled or refunded. Those are tests for your proposed setup, not assumptions that every combination has already been verified.

- Question for the vendor: what packages and versions are required for points redemption with our checkout?
- Acceptance check: the displayed discount, paid amount, order records, and points history stay consistent.

[Magento 2 Reward Points Extension](https://pubsetup.com/extension/magento-2-reward-points-extension-2) · [Vendor documentation](https://www.mageplaza.com/magento-2-reward-points-extension/)

## Example 3: Swissup Fire Checkout and Luma fallback

Swissup documents Fire Checkout support for a Hyvä storefront through Hyvä Legacy Checkout Mode with a Luma fallback. The distinction matters: this describes a fallback arrangement, rather than establishing an integration with Hyvä Checkout.

Evaluate that architecture against your plans. If you intend to keep the fallback, test the transition into checkout and the complete payment journey. If the requirement is to use Hyvä Checkout, ask what should be retained or replaced before purchasing another checkout product.

- Question for the vendor: which checkout runs on our checkout route, and how is the fallback configured?
- Acceptance check: customers can move from the Hyvä storefront into checkout, correct mistakes, and complete an order.

[M2 Fire Checkout](https://pubsetup.com/extension/m2-fire-checkout) · [Vendor documentation](https://swissuplabs.com/magento-extensions/magento-2/one-step-checkout-extension-for-magento-2.html)

## Read reviews and demos as supporting evidence

A useful review describes a setup and a problem, not just a star rating. Look for context about the theme, the checkout, the required integration, and the support response. An older review may describe a different release or feature set.

Use demos to explore interaction quality, then request evidence that matches your requirements. A desktop demo with sample products cannot answer how your custom attributes, payment methods, translations, or third-party integrations will behave.

- Try the feature on mobile and with keyboard navigation.
- Look for the specific configuration or release described in the review.
- Ask whether the demo includes customization or optional packages.
- Treat customer experience as context alongside documentation and staging tests.

## Budget for installation, maintenance, and performance checks

Compare the total implementation effort, including adapters, configuration, styling adjustments, testing, and future support. Ask whether compatibility packages are included in the purchase and what renewal terms apply. Keep pricing tied to a current written offer rather than an old article or screenshot.

Treat performance as a measurement task. Record representative page behavior before adding the module, then compare the same journey afterward under similar conditions. Extra scripts, images, requests, and interaction delays are worth investigating even when the feature is technically compatible.

Define who owns the integration after launch. A small compatibility fix is easier to manage when the vendor, developer, and store owner agree on where support begins and what requires separate work.

## Your pre-launch compatibility checklist

Use staging with representative catalog data and the same integration packages planned for production. Configure the feature for real customer tasks and test it with related modules enabled.

- Record the exact installed versions and preserve the working package configuration.
- Verify every required feature on product, category, account, cart, and checkout pages where applicable.
- Check guest and signed-in behavior, relevant customer groups, languages, and store views.
- Test mobile layouts, keyboard access, validation messages, and recovery after errors.
- Review browser console and network errors, including CSP failures.
- Confirm that updates to totals, balances, and other order data remain correct across interacting modules.
- Compare relevant performance measurements before and after installation.
- Document configuration, known limitations, support contacts, and a rollback procedure.

Agree on acceptance criteria before deployment. “The module is installed” is less useful than a concrete result such as “a customer can apply reward points and complete payment with the correct total.” Retest the affected journey when the extension, theme, or checkout changes.

## Choose compatibility you can explain and verify

Use the Hyvä compatibility label to build a shortlist, then ask for the supported feature set, package requirements, checkout architecture, and maintenance terms. Choose the module whose documented integration matches the customer journey your store needs.

The catalog examples above show why the details matter: an advertised integration can have a feature limitation, support both the theme and checkout, or use a fallback architecture. Verify the current conditions and test your configuration before committing to a production rollout.

## Editorial sources

Reviewed November 8, 2026. Vendor claims are attributed in the article; test scenarios and buying criteria are editorial guidance.

- [Hyvä compatibility modules overview](https://docs.hyva.io/hyva-themes/compatibility-modules/index.html)
- [Hyvä Checkout payment integrations](https://docs.hyva.io/hyva-checkout/integrations/available-payment-methods.html)
- [Hyvä security compliance and CSP](https://docs.hyva.io/hyva-themes/faqs/security-compliance.html)
