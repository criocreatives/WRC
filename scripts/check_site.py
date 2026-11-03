#!/usr/bin/env python3
"""No-dependency static checks for published WRC content pages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []
        self.h1_count = 0
        self.images_missing_alt = 0

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == "h1":
            self.h1_count += 1
        if tag == "img" and "alt" not in attrs:
            self.images_missing_alt += 1
        field = "href" if tag in ("a", "link") else "src" if tag in ("img", "script") else None
        if field and attrs.get(field):
            self.refs.append(attrs[field])


def check_reference(page, ref):
    if ref.startswith(("#", "//")):
        return None
    parsed = urlsplit(ref)
    if parsed.scheme or not parsed.path:
        return None
    path = unquote(parsed.path)
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (page.parent / path)
    if path.endswith("/"):
        target /= "index.html"
    if target.is_dir():
        target /= "index.html"
    return None if target.is_file() else str(target.relative_to(ROOT))


def main():
    errors = []
    checked = 0
    for page in sorted(ROOT.rglob("index.html")):
        rel = page.relative_to(ROOT).as_posix()
        if rel.startswith(("runlab/", "shoes/")):
            continue
        checked += 1
        source = page.read_text(encoding="utf-8")
        doc = PageParser()
        doc.feed(source)
        if doc.h1_count != 1:
            errors.append(rel + ": expected one H1, found " + str(doc.h1_count))
        if doc.images_missing_alt:
            errors.append(rel + ": " + str(doc.images_missing_alt) + " images missing alt")
        if "<!-- WRC_NAV_BEGIN -->" not in source or "<!-- WRC_LEGAL_BEGIN -->" not in source:
            errors.append(rel + ": generated shared components missing")
        if re.search(r"<style\b", source, re.I):
            errors.append(rel + ": inline CSS should live in assets/page-styles")
        for ref in doc.refs:
            missing = check_reference(page, ref)
            if missing:
                errors.append(rel + ": missing " + missing)
    events_html = (ROOT / "events/index.html").read_text(encoding="utf-8")
    if "STAY TUNED FOR " not in events_html or "WHAT'S NEXT." not in events_html:
        errors.append("events: missing default holding message")
    if re.search(r"<script\b|data-expires-at|roster-table|payments\.js|current-events", events_html, re.I):
        errors.append("events: legacy roster, payments or scripts must not be public")
    calendar = (ROOT / "calendar/index.html").read_text(encoding="utf-8")
    if "<span>Run Calendar</span> ⚡" not in calendar or "Updated monthly." not in calendar:
        errors.append("calendar: expected month-neutral header and update note")
    # Verify downloadable Apple/iPhone calendar assets, including older archives.
    for ics in sorted((ROOT / "calendar/events").glob("*.ics")):
        calendar_text = ics.read_text(encoding="utf-8")
        unfolded = re.sub(r"\r?\n[ \t]", "", calendar_text)
        rel = ics.relative_to(ROOT).as_posix()
        for required in ("BEGIN:VCALENDAR", "BEGIN:VEVENT", "END:VEVENT",
                         "END:VCALENDAR", "SUMMARY:", "UID:"):
            if required not in unfolded:
                errors.append(rel + ": missing " + required)
        for field in ("DTSTART", "DTEND"):
            if not re.search(r"(?m)^" + field + r"(?:;[^:\r\n]+)?:", unfolded):
                errors.append(rel + ": missing " + field)
    if not list((ROOT / "calendar/events").glob("*.ics")):
        errors.append("calendar: no iPhone calendar downloads found")

    if errors:
        print("\n".join(errors))
        return 1
    print("WRC check passed: " + str(checked) + " content pages; links and structure verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
