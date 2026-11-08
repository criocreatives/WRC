# Public-content review · 8 November 2026

This file describes the published security boundary. It is not a claim that no personal data ever appeared in the repository's history.

- The public Events landing page contains the *Stay tuned for what's next* notice and no active participant roster.
- A standalone training-analysis report remains intentionally accessible at its direct URL. It has `robots: noindex,nofollow,noarchive`; **this does not restrict access**. Anyone with the URL can see its content.
- Previous event data may remain reachable in the **public Git commit history**. Removing it from the current branch does not erase history or cached copies.
- The event-analysis report was kept intact: no exercise metrics, personal details or event registration entries were altered by this audit.
- The new public-content check requires noindex metadata for pages under `events/`, excludes those routes from the sitemap, and rejects obvious participant/payment export filenames from current published files.
- Do not store registration spreadsheets, participant responses, payment records or sensitive medical information in this public GitHub Pages repository.
- If any report must actually be private, remove it from public publishing and place it behind real access control. A `robots.txt` rule or noindex directive is insufficient; history and cache remediation require a separate, deliberate plan.

Scope: current public repository tree and source files, not external services or historical Git objects.
