# WRC site maintenance

Current canonical host: https://updates.wadadarunclub.com

**Domain migration is paused.** Do not change CNAME, registrar settings, DNS, canonicals or sitemap host without a coordinated migration.

## Adding a new page
- Give it a unique, human-readable HTML title, a precise meta description, canonical URL, Open Graph tags, and an accessible primary heading.
- Link the page from appropriate site navigation or a parent section.
- Add the URL to `sitemap.xml` and set the last-modified date when its substantive content changes.
- Preserve header navigation and skip link patterns from the existing pages; shared nav CSS is in `assets/wrc-shared.css`.
- Give images useful alt descriptions when informative, or `alt=""` when decorative. Use actual asset dimensions when available, load offscreen photos lazily, and prefer WebP.
- Check at desktop and narrow-mobile widths and with keyboard only. Run Google PageSpeed Insights and Lighthouse before claiming performance improvements.
- Check the policy links and the RUNLAB result exports after adjusting JS or print CSS.

## Content checks
- Review the manually maintained run calendar at least monthly, updating dated events and archived information.
- Check external registration/shopping links, price changes, product availability, event details and gear comparisons.
- Keep captions, previews and internal links aligned with actual page content.
- Policy pages are separate: `/policies/`. Contact: wadadarunclub@gmail.com.

## Indexing
- Current host: https://updates.wadadarunclub.com; do not use the apex in metadata until migration is approved.
- Submit `/sitemap.xml` using Search Console after verifying site ownership.
- Legacy paths under `/shoes/` are client-side redirects and intentionally excluded from the sitemap.
- The Open Graph image currently uses the WRC logo; replacing it with a 1200x630 share card is a future enhancement.
