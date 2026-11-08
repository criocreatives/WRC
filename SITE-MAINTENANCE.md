# WRC site maintenance

Current canonical host: https://updates.wadadarunclub.com

**Domain migration is paused.** Do not change CNAME, registrar settings, DNS, canonicals or sitemap host without a coordinated migration.

## Adding a new page
- Give it a unique, human-readable HTML title, a precise meta description, canonical URL, Open Graph tags, and an accessible primary heading.
- Link the page from appropriate site navigation or a parent section.
- Run `python3 scripts/generate_sitemap.py` to refresh indexed URLs. Include a `wrc:content-updated` date only for verified substantive changes.
- Use the shared navigation and footer partials through `scripts/build_site.py`; preserve accessibility and RUNLAB's existing visual accent.
- Give images useful alt descriptions when informative, or `alt=""` when decorative. Use actual asset dimensions when available, load offscreen photos lazily, and prefer WebP.
- Check at desktop and narrow-mobile widths and with keyboard only. Run Google PageSpeed Insights and Lighthouse before claiming performance improvements.
- Check the policy links and the RUNLAB result exports after adjusting JS or print CSS.

## Content checks
- Review the manually maintained run calendar at least monthly, updating dated events and archived information.
- Check external registration/shopping links, price changes, product availability, event details and gear comparisons.
- Keep captions, previews and internal links aligned with actual page content.
- Policy pages are separate: `/policies/`. Contact: wadadarunclub@gmail.com.

## Sitemap generation
- Run `python3 scripts/generate_sitemap.py` when publishing or removing a page. The quality workflow enforces `--check`.
- Routes come from actual published HTML. Redirects and pages with `robots: noindex` are excluded.
- Omit `lastmod` unless the page author explicitly adds `<meta name="wrc:content-updated" content="YYYY-MM-DD">` to certify a substantive edit. Stale hardcoded dates are worse than omitting this optional sitemap field.
- Keep the current `updates.wadadarunclub.com` canonical domain until migration is approved.

## Indexing
- Current host: https://updates.wadadarunclub.com; do not use the apex in metadata until migration is approved.
- Submit `/sitemap.xml` using Search Console after verifying site ownership.
- Legacy paths under `/shoes/` are client-side redirects and intentionally excluded from the sitemap.
- The Open Graph image currently uses the WRC logo; replacing it with a 1200x630 share card is a future enhancement.

## Events holding page
- `/events/` displays a static "Stay tuned" message between events; it does not embed participant or payment data.
- Update the shared page navigation/footer through `site/partials/` and run `python3 scripts/build_site.py` when changing them.
- Event registrant and payment data belong in a private system; never publish them as JavaScript/HTML in the public GitHub Pages repository.
- Old event snapshots may remain accessible in Git commit history; deleting current files is not a history purge.

## Standalone pages
- Independent reports may opt out of generated WRC navigation by declaring `<meta name="wrc:page-type" content="standalone">` in the page head.
- These pages are exempt from shared-component and external-style requirements but still receive H1, image-description and local-link validation.
- Do not mark an ordinary WRC page as standalone to bypass a failed template check; repair the shared component instead.
