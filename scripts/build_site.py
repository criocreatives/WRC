#!/usr/bin/env python3
"""Regenerate the WRC shared navigation and footer in published static HTML.

WRC uses regular GitHub Pages HTML. This build step checks shared partials into
each page so navigation and policy links remain visible without JavaScript.
Run: python3 scripts/build_site.py
Validate: python3 scripts/build_site.py --check
Legacy /shoes/ redirects and explicitly marked standalone reports skip shared components.
"""
from pathlib import Path
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

# Independent reports can opt out of WRC navigation without disabling basic checks.
STANDALONE_MARKER = '<meta name="wrc:page-type" content="standalone">'


def is_standalone(page):
    return STANDALONE_MARKER in page.read_text(encoding="utf-8")

NAV_START, NAV_END = "<!-- WRC_NAV_BEGIN -->", "<!-- WRC_NAV_END -->"
LEGAL_START, LEGAL_END = "<!-- WRC_LEGAL_BEGIN -->", "<!-- WRC_LEGAL_END -->"


def published_pages():
    """Published pages, including standalones and RUNLAB's non-index tools."""
    pages = set(ROOT.rglob("index.html"))
    pages.update([
        ROOT / "runlab/fuel-calculator/daily-fuel.html",
        ROOT / "runlab/fuel-calculator/run-fuel.html",
    ])
    for path in sorted(pages):
        if not path.is_file():
            raise FileNotFoundError("Missing published page: " + str(path))
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith("shoes/") or any(
            part.startswith(".") for part in path.relative_to(ROOT).parts
        ):
            continue
        yield path, rel


def content_pages():
    """All pages governed by the WRC navigation and footer partials."""
    for path, rel in published_pages():
        if not is_standalone(path):
            yield path, rel


def active_href(rel):
    if rel == "index.html":
        return "/"
    for section in ("calendar", "gear", "race-day", "policies", "runlab"):
        if rel.startswith(section + "/"):
            return "/" + section + "/"
    return None


def navigation_for(rel, nav_source):
    if rel.startswith("runlab/"):
        nav_source = nav_source.replace(
            'class="wrc-global-nav"',
            'class="wrc-global-nav wrc-is-runlab"',
            1,
        )
    href = active_href(rel)
    if href is None:
        return nav_source
    key = '<a href="' + href + '"'
    if key not in nav_source:
        raise ValueError("Missing navigation destination " + href)
    current = "location" if rel.startswith("runlab/") and rel != "runlab/index.html" else "page"
    return nav_source.replace(key, key + ' aria-current="' + current + '"')


def replace_block(document, start, end, markup, path):
    pattern = re.compile(re.escape(start) + r"[\s\S]*?" + re.escape(end))
    matches = list(pattern.finditer(document))
    if len(matches) != 1:
        raise ValueError(str(path) + ": expected one block " + start)
    return pattern.sub(lambda _: start + markup + end, document)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="Fail if published HTML differs from the shared templates")
    args = parser.parse_args()
    nav = (ROOT / "site/partials/navigation.html").read_text(encoding="utf-8").strip()
    legal = (ROOT / "site/partials/legal-footer.html").read_text(encoding="utf-8").strip()
    if 'aria-current="page"' in nav:
        raise ValueError("The navigation template must not contain page-specific state")
    changed = []
    for page, rel in content_pages():
        original = page.read_text(encoding="utf-8")
        rebuilt = replace_block(original, NAV_START, NAV_END, navigation_for(rel, nav), rel)
        rebuilt = replace_block(rebuilt, LEGAL_START, LEGAL_END, legal, rel)
        if original != rebuilt:
            changed.append(rel)
            if not args.check:
                page.write_text(rebuilt, encoding="utf-8")
    if changed:
        print(("Outdated" if args.check else "Updated") + " WRC pages: " + ", ".join(changed))
    if args.check and changed:
        return 1
    print("WRC shared components: " + ("synchronized" if args.check else "generated"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
