#!/usr/bin/env python3
"""Prevent accidentally publishing event registrations and private records.

This does not remove any information already held in public Git history.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "events"
BLOCKED_FILE = re.compile(
    r"(registrant|registration-data|attendee|participant|roster|payment|"
    r"response-export|checkin|financial-record)",
    re.I,
)
PRIVATE_SUFFIXES = {".js", ".json", ".csv", ".tsv", ".xlsx", ".pdf"}


def main():
    errors = []
    checked = 0
    for path in sorted(EVENTS.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if BLOCKED_FILE.search(path.name) and path.suffix.lower() in PRIVATE_SUFFIXES:
            errors.append(rel + ": possible private registration or payment record")
        if path.suffix.lower() in {".html", ".htm"}:
            checked += 1
            source = path.read_text(encoding="utf-8")
            head = source.split("</head>", 1)[0]
            if not re.search(
                r'<meta\b[^>]*name=["\x27]robots["\x27][^>]*'
                r'content=["\x27][^"\x27]*\bnoindex\b',
                head, re.I,
            ):
                errors.append(rel + ": event/report pages require noindex metadata")
    xml = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    if "updates.wadadarunclub.com/events/" in xml:
        errors.append("sitemap.xml: noindexed event/report URLs must not be listed")
    if errors:
        print("\n".join(errors))
        return 1
    print("Public content check passed: " + str(checked)
          + " event/report HTML pages have noindex; no obvious record exports")
    return 0


if __name__ == "__main__":
    sys.exit(main())
