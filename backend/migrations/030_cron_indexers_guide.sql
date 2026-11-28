-- Editorial guide reviewed 2026-11-28.
-- Source: content/blog/magento-2-cron-jobs-and-indexers-troubleshooting-checklist.md
-- Preserve an existing article with the same slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "570ccac7-e0ce-5955-bf66-fdb84ff04e32",
  "slug": "magento-2-cron-jobs-and-indexers-troubleshooting-checklist",
  "title": "Magento 2 Cron Jobs and Indexers: Troubleshooting Checklist",
  "excerpt": "Investigate delayed Magento 2 background jobs with read-only checks, a cron and indexer evidence worksheet, and a controlled recovery plan.",
  "cover": "/images/blog/pubsetup-magento-2-cron-indexers.webp",
  "category": "Implementation Guides",
  "tags": [
    "Magento 2",
    "Maintenance",
    "Cron"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-28",
  "read_minutes": 7,
  "toc": [
    {
      "id": "start-with-one-symptom-and-a-timeline",
      "label": "Start with one symptom and a timeline"
    },
    {
      "id": "verify-the-scheduler-identity-and-php-environment",
      "label": "Verify the scheduler identity and PHP environment"
    },
    {
      "id": "distinguish-scheduling-execution-and-delivery",
      "label": "Distinguish scheduling, execution and delivery"
    },
    {
      "id": "read-indexer-status-before-requesting-a-rebuild",
      "label": "Read indexer status before requesting a rebuild"
    },
    {
      "id": "build-an-evidence-worksheet",
      "label": "Build an evidence worksheet"
    },
    {
      "id": "plan-recovery-without-overlapping-executions",
      "label": "Plan recovery without overlapping executions"
    },
    {
      "id": "decide-whether-a-scheduler-interface-would-help",
      "label": "Decide whether a scheduler interface would help"
    },
    {
      "id": "finish-with-a-recurrence-check",
      "label": "Finish with a recurrence check"
    },
    {
      "id": "sources-and-disclosure",
      "label": "Sources and disclosure"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A delayed email, an outdated catalog value and an unsuccessful scheduled export can look like separate extension defects. Before reinstalling a module or repeatedly launching jobs, establish what was scheduled, whether it started and what evidence shows the expected result."
    },
    {
      "type": "p",
      "text": "This guide applies to self-managed Magento Open Source and applicable Adobe Commerce deployments with Magento CLI access. It is an investigation checklist, not a diagnosis of your store or a script to repair every background-job failure. Managed services may use a different operational interface."
    },
    {
      "type": "h2",
      "text": "Start with one symptom and a timeline"
    },
    {
      "type": "p",
      "text": "Choose a specific example: a product whose indexed value is outdated, a named background job or an expected message that did not arrive. Record when the triggering change happened, which environment and store were involved and what the team expected to observe next."
    },
    {
      "type": "p",
      "text": "Adobe's [cron configuration guide](https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cli/configure-cron-jobs) lists indexing, sitemap generation and transactional emails among the functions that depend on scheduled work. A shared scheduling problem is therefore worth investigating when several background features stop progressing together."
    },
    {
      "type": "p",
      "text": "Keep observations separate from explanations. “The order was created at 10:05 and its message has not arrived” is useful evidence. “Cron is broken” is a hypothesis that still needs a check. Include the relevant timezone so timestamps from different systems can be compared."
    },
    {
      "type": "h2",
      "text": "Verify the scheduler identity and PHP environment"
    },
    {
      "type": "p",
      "text": "Adobe instructs administrators to run Magento CLI commands as the file system owner and to align relevant CLI and web-server PHP settings. Record the actual user, installation path and PHP executable used by the scheduler before changing configuration."
    },
    {
      "type": "p",
      "text": "From the installation directory and under the intended account, the following commands inspect the current setup. They do not install cron, launch jobs or change indexer modes. Treat their output as operational information and review it before sharing."
    },
    {
      "type": "code",
      "language": "bash",
      "text": "crontab -l\nphp --version\nphp bin/magento indexer:status\nphp bin/magento indexer:show-mode"
    },
    {
      "type": "p",
      "text": "If the scheduler uses a different PHP binary, inspect that binary's version instead of assuming the interactive shell's `php` is equivalent. A correct command run under a different account or installation path does not verify the scheduled execution you are investigating."
    },
    {
      "type": "h2",
      "text": "Distinguish scheduling, execution and delivery"
    },
    {
      "type": "p",
      "text": "Investigate the stages separately. A scheduler entry can exist while a particular job fails to start; a job can start and then fail; a completed job can still produce an unexpected downstream result. Record the last stage for which you have evidence."
    },
    {
      "type": "p",
      "text": "Use the relevant application logs and scheduler history to identify the named job and time window. Capture the first useful failure message and the surrounding context. Do not treat a large number of old log entries as proof that they explain the current symptom."
    },
    {
      "type": "p",
      "text": "For an integration, also inspect its own operation result. A completed export job does not establish that the external system accepted every record. The [API integration guide](/blog/magento-2-api-integration-authentication-retries-and-testing) explains why request acceptance, individual completion and destination evidence should be checked separately."
    },
    {
      "type": "h2",
      "text": "Read indexer status before requesting a rebuild"
    },
    {
      "type": "p",
      "text": "Adobe's [indexer management guide](https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cli/manage-indexers) documents `indexer:status` and `indexer:show-mode` for inspecting status and update mode. Save the result for the affected indexer and compare it with the symptom you recorded."
    },
    {
      "type": "p",
      "text": "An indexer result and a storefront observation answer different questions. After identifying the relevant indexer, use the same product and store context to check whether the expected value is visible. Avoid declaring the incident resolved solely because one command finishes without an error."
    },
    {
      "type": "p",
      "text": "Reindexing or changing a mode is a state-changing operation. Plan it against the affected catalog size and deployment procedure rather than treating a full rebuild as the first diagnostic command. Keep the investigation evidence available so a successful manual operation does not hide a recurring scheduling problem."
    },
    {
      "type": "h2",
      "text": "Build an evidence worksheet"
    },
    {
      "type": "p",
      "text": "Use this worksheet to prepare a reproducible incident record. It defines questions to answer rather than prescribing the same recovery action for every installation."
    },
    {
      "type": "table",
      "columns": [
        "Stage",
        "Evidence to capture",
        "Question to resolve"
      ],
      "rows": [
        [
          "Trigger",
          "Record identifier, change time and expected result",
          "What exactly should have happened?"
        ],
        [
          "Scheduler",
          "Account, command, PHP binary and installation path",
          "Is the intended environment being invoked?"
        ],
        [
          "Job history",
          "Named job and recent scheduled or execution times",
          "Was it scheduled, started or left behind?"
        ],
        [
          "Failure",
          "Sanitized exception and surrounding log context",
          "Which operation failed, and where?"
        ],
        [
          "Indexer",
          "Relevant status and mode output",
          "Does the affected data depend on this indexer?"
        ],
        [
          "Resources",
          "Relevant runtime, worker and resource observations",
          "Is the job failing or unable to make progress?"
        ],
        [
          "Destination",
          "The specific email, catalog value or remote record",
          "Did the expected business outcome actually occur?"
        ],
        [
          "Recurrence",
          "Result of a later normal scheduled cycle",
          "Does the fix survive without a manual rerun?"
        ]
      ]
    },
    {
      "type": "p",
      "text": "Keep secrets and unrelated customer data out of the report. For a shared incident, a small sanitized example with precise timestamps is usually easier to investigate than an unrestricted database export."
    },
    {
      "type": "h2",
      "text": "Plan recovery without overlapping executions"
    },
    {
      "type": "p",
      "text": "Before rerunning a job, establish whether a previous execution is still active and whether repeating its work is safe. A reporting task, order export and external write can have different consequences when executed twice."
    },
    {
      "type": "p",
      "text": "Choose the narrowest supported recovery procedure after identifying the cause. Record the change, the person responsible and the observation that will demonstrate success. Avoid using direct edits to scheduler tables, arbitrary process termination or repeated full rebuilds as substitutes for an explained recovery plan."
    },
    {
      "type": "p",
      "text": "If the incident follows an update, include the relevant version and configuration changes in the timeline. Use a staging reproduction when possible, then apply the approved production procedure. The important outcome is restored normal execution, not merely one successful manual command."
    },
    {
      "type": "h2",
      "text": "Decide whether a scheduler interface would help"
    },
    {
      "type": "p",
      "text": "If staff need a more accessible view of jobs, investigate catalog products such as [Wyomind Cron Scheduler](/extension/cron-scheduler) or [Cron Scheduler Pro](/extension/cron-scheduler-pro). Compare their current documentation with the visibility and controls your team needs; this article does not assert feature parity or tested compatibility."
    },
    {
      "type": "p",
      "text": "A scheduler interface should support investigation, not replace the operating-system scheduler or an agreed maintenance process. Record who may trigger or change jobs and how that action is logged. A new interface cannot by itself correct a wrong PHP environment or a failing external service."
    },
    {
      "type": "h2",
      "text": "Finish with a recurrence check"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Record the original symptom and the last confirmed stage of execution.",
        "Identify and correct the demonstrated cause using the deployment procedure.",
        "Verify the specific business result with the original test record.",
        "Observe a later normal scheduled cycle without relying on a manual rerun.",
        "Save the evidence and assign an owner for monitoring and follow-up."
      ]
    },
    {
      "type": "p",
      "text": "For a broader investigation, [Performance Audit](/services/performance-audit) can help define the scope. For planned version and environment work, review [Magento & Server Updates](/services/magento-server-updates). Agree on the task and current service terms before scheduling changes."
    },
    {
      "type": "h2",
      "text": "Sources and disclosure"
    },
    {
      "type": "p",
      "text": "Reviewed November 28, 2026. Cron dependencies, execution identity and indexer commands follow the linked Adobe guides. The incident worksheet and recovery planning recommendations are Pubsetup editorial material, not a tested repair procedure for a particular store."
    },
    {
      "type": "p",
      "text": "Disclosure: Pubsetup may earn a commission from partner purchases. Check current module documentation before purchasing a scheduler extension."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
