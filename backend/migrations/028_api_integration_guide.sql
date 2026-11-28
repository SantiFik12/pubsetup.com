-- Editorial guide reviewed 2026-11-28.
-- Source: content/blog/magento-2-api-integration-authentication-retries-and-testing.md
-- Preserve an existing article with the same slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "c93377fc-a151-5ba2-bf97-935b82716a98",
  "slug": "magento-2-api-integration-authentication-retries-and-testing",
  "title": "Magento 2 API Integration: Authentication, Retries and Testing",
  "excerpt": "Plan a Magento 2 API connection with the right authentication model, limited permissions, clear retry decisions and a small acceptance test before rollout.",
  "cover": "/images/blog/pubsetup-magento-2-api-integration.webp",
  "category": "Implementation Guides",
  "tags": [
    "Magento 2",
    "API integration",
    "Implementation"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-28",
  "read_minutes": 6,
  "toc": [
    {
      "id": "identify-the-platform-and-the-direction-of-the-connection",
      "label": "Identify the platform and the direction of the connection"
    },
    {
      "id": "prepare-access-without-widening-permissions-to-hide-a-failure",
      "label": "Prepare access without widening permissions to hide a failure"
    },
    {
      "id": "start-with-the-smallest-useful-request",
      "label": "Start with the smallest useful request"
    },
    {
      "id": "decide-which-failures-should-be-retried",
      "label": "Decide which failures should be retried"
    },
    {
      "id": "reconcile-an-uncertain-write-before-repeating-it",
      "label": "Reconcile an uncertain write before repeating it"
    },
    {
      "id": "track-asynchronous-work-to-its-final-result",
      "label": "Track asynchronous work to its final result"
    },
    {
      "id": "use-a-limited-release-checklist",
      "label": "Use a limited release checklist"
    },
    {
      "id": "sources-and-editorial-review",
      "label": "Sources and editorial review"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A successful API request proves that one operation worked once. An integration also needs a defined permission scope, a way to recognize failed or uncertain operations, and a repeatable test showing that the intended record reached the intended system."
    },
    {
      "type": "p",
      "text": "This guide is an implementation planning checklist. It does not provide a universal authentication script or claim that a particular connector has been tested. Use the official documentation for the exact product, deployment and installed version before configuring credentials or endpoints."
    },
    {
      "type": "h2",
      "text": "Identify the platform and the direction of the connection"
    },
    {
      "type": "p",
      "text": "Write down which application calls which API. An external application reading Magento orders and Magento sending a request to an external service have different credentials and permission boundaries. A connection can include both directions, but each needs its own requirement and acceptance result."
    },
    {
      "type": "p",
      "text": "Also identify the deployment. Adobe's [integration administration guide](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/integrations) describes integration resources and authorization for its applicable deployments. Its separate [Cloud Service authentication guide](https://developer.adobe.com/commerce/webapi/rest/authentication/) specifies IMS-based authentication for Adobe Commerce as a Cloud Service. Do not transplant a Magento Open Source example into that environment without checking the differences."
    },
    {
      "type": "p",
      "text": "Record the environment, website or store context, operation and system responsible for each call. Keep the scope narrow enough that the team can explain what a first successful transfer should change."
    },
    {
      "type": "h2",
      "text": "Prepare access without widening permissions to hide a failure"
    },
    {
      "type": "p",
      "text": "List the API resources actually required for the first workflow. Begin with those permissions and check the denied case as well as the successful case. An integration that can perform its intended read should not automatically receive unrelated write permissions."
    },
    {
      "type": "p",
      "text": "Adobe's [token-based authentication documentation](https://developer.adobe.com/commerce/webapi/get-started/authentication/gs-authentication-token) explains that using an integration access token alone as a standalone bearer token is disabled by default. Confirm the supported authentication workflow instead of treating a failed bearer example as a reason to change that setting."
    },
    {
      "type": "p",
      "text": "Keep environment credentials separate, assign an owner and define how access will be replaced or revoked. Use a credential store appropriate to the application. Examples, screenshots and diagnostic exports should use placeholders rather than live tokens or customer records."
    },
    {
      "type": "h2",
      "text": "Start with the smallest useful request"
    },
    {
      "type": "p",
      "text": "For an initial read, choose one recognizable staging record and confirm its identifier, expected fields and store context. For a write, agree on the exact test record and cleanup procedure before sending it. A large historical transfer is a poor first test of whether the connection addresses the right system."
    },
    {
      "type": "p",
      "text": "Record the request method and endpoint, a sanitized input example, the expected response and the destination evidence. Do not define success only as an HTTP status: the returned record may be valid but belong to the wrong store or contain a different identifier than the business process expects."
    },
    {
      "type": "p",
      "text": "If the operation reads a collection, add a paging test with more than one page. Define how the integration identifies its last completed work and what happens when records change while it is running. Confirm the endpoint's actual filtering and ordering behaviour rather than assuming that page numbers alone provide a reliable incremental sync."
    },
    {
      "type": "h2",
      "text": "Decide which failures should be retried"
    },
    {
      "type": "p",
      "text": "Use the following worksheet to write recovery decisions for your connection. These are proposed handling categories, not a promise that every API returns the same status code, headers or error structure."
    },
    {
      "type": "table",
      "columns": [
        "Observed outcome",
        "First question",
        "Recovery decision to agree"
      ],
      "rows": [
        [
          "Authentication rejected",
          "Are the environment and authentication flow correct?",
          "Repair or renew access before repeating work"
        ],
        [
          "Permission denied",
          "Does the approved resource scope cover this operation?",
          "Review the required permission, without granting everything"
        ],
        [
          "Record validation failed",
          "Which identifier or field violates the contract?",
          "Correct the input and retain a useful failure reason"
        ],
        [
          "Request throttled",
          "What limits and retry instructions does this API document?",
          "Delay within the supported policy and limit attempts"
        ],
        [
          "Temporary service failure",
          "Is another attempt safe for this operation?",
          "Use a bounded retry policy and escalation point"
        ],
        [
          "Timeout after a write",
          "Could the destination already have accepted the record?",
          "Reconcile the result before sending another create"
        ],
        [
          "Accepted asynchronous request",
          "Has the individual operation actually completed?",
          "Track its result instead of treating acceptance as completion"
        ]
      ]
    },
    {
      "type": "p",
      "text": "Capture enough context to investigate without recording secrets. A useful incident record includes the operation name, internal correlation identifier, time, attempt number and sanitized error category. Limit who can access any customer data needed for diagnosis."
    },
    {
      "type": "h2",
      "text": "Reconcile an uncertain write before repeating it"
    },
    {
      "type": "p",
      "text": "A timeout does not establish that a destination rejected a request. Prepare a way to find the intended record using an agreed external identifier or another documented lookup. Then decide whether the next action should be a lookup, update, skip or new create."
    },
    {
      "type": "p",
      "text": "Ask what duplicate protection the destination actually supports. Do not invent an idempotency header or assume that sending the same payload twice is harmless. If the API lacks a suitable mechanism, the implementation still needs a documented recovery procedure for an uncertain result."
    },
    {
      "type": "p",
      "text": "Test this with controlled staging records. Write the expected number of destination records before starting, repeat the supported operation and compare the result. Keep the original source identifier stable throughout the test so that a renamed test record does not conceal a duplicate."
    },
    {
      "type": "h2",
      "text": "Track asynchronous work to its final result"
    },
    {
      "type": "p",
      "text": "Adobe's [bulk endpoint guide](https://developer.adobe.com/commerce/webapi/rest/use-rest/bulk-endpoints) explains that a bulk request is split into individual queue messages. It also distinguishes deployment-specific routes and queue management. Follow the applicable documentation instead of assuming that one bulk request is one completed transaction."
    },
    {
      "type": "p",
      "text": "For a batch, retain the operation identifiers needed to reconcile individual records. Define how a partially successful batch is reviewed and how only the unresolved scope will be retried. The [cron and indexer checklist](/blog/magento-2-cron-jobs-and-indexers-troubleshooting-checklist) can help prepare operational questions for a self-managed deployment, but it does not replace checking the integration's own queue and consumer setup."
    },
    {
      "type": "h2",
      "text": "Use a limited release checklist"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Record the platform, connection direction, operations and approved permissions.",
        "Demonstrate the smallest read or write against identifiable staging records.",
        "Test validation, expired or rejected access, and the agreed retry boundaries.",
        "Reconcile a repeated operation and an uncertain result without unexplained duplicates.",
        "Assign ownership for monitoring, credential changes and recovery before increasing scope."
      ]
    },
    {
      "type": "p",
      "text": "For a business-system connection, prepare the [ERP / CRM mapping worksheet](/blog/magento-2-erp-crm-integration-data-mapping-and-sync-ownership) as well. Authentication decisions and field ownership solve different problems and should both be accepted before release."
    },
    {
      "type": "p",
      "text": "If you need implementation help, [Third-Party API Integration](/services/third-party-api-integration) covers an agreed connection scope. Review the current hourly rate and minimum budget on the service page; the minimum is not a promise that every integration fits within that amount of work."
    },
    {
      "type": "h2",
      "text": "Sources and editorial review"
    },
    {
      "type": "p",
      "text": "Reviewed November 28, 2026. Platform and authentication statements follow the linked Adobe documentation. Retry decisions, staging checks and the release worksheet are Pubsetup editorial recommendations. No tested connector compatibility, reliability measurement or performance improvement is claimed."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
