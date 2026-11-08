#!/usr/bin/env python3
"""Deterministic sitemap for indexed WRC content, without fabricated freshness.

Usage: python3 scripts/generate_sitemap.py [--check]
Update content-updated dates only when the article itself substantively changes.
"""
import argparse
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
HOST = "https://updates.wadadarunclub.com"


class HeadMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.noindex = False
        self.redirect = False
        self.content_updated = None

    def handle_starttag(self, tag, attrs):
        if tag != "meta":
            return
        attrs = dict(attrs)
        name = attrs.get("name", "").lower()
        if name == "robots" and "noindex" in attrs.get("content", "").lower():
            self.noindex = True
        if attrs.get("http-equiv", "").lower() == "refresh":
            self.redirect = True
        if name == "wrc:content-updated":
            value = attrs.get("content", "")
            if date.fromisoformat(value).isoformat() != value:
                raise ValueError("Invalid content-updated date: " + value)
            self.content_updated = value


def discover_routes():
    for page in sorted(ROOT.rglob("*.html")):
        rel = page.relative_to(ROOT).as_posix()
        if any(part.startswith(".") for part in page.relative_to(ROOT).parts):
            continue
        if rel.startswith("site/partials/"):
            continue
        metadata = HeadMetadata()
        metadata.feed(page.read_text(encoding="utf-8"))
        if metadata.noindex or metadata.redirect:
            continue
        if page.name != "index.html" and not rel.startswith("runlab/"):
            continue
        path = "/" + rel.removesuffix("index.html")
        # RUNLAB has two real leaf-page URLs, not directory index URLs.
        if page.name != "index.html":
            path = "/" + rel
        yield path, metadata.content_updated


def render():
    paths = dict(discover_routes())
    if "/" not in paths:
        raise ValueError("Home page missing from sitemap")
    ordered = sorted(paths, key=lambda p: (p != "/", p))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in ordered:
        lines.append("  <url><loc>" + escape(HOST + path) + "</loc>" +
                     ("<lastmod>" + paths[path] + "</lastmod>" if paths[path] else "") +
                     "</url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    opts = parser.parse_args()
    path = ROOT / "sitemap.xml"
    expected = render()
    if opts.check:
        if not path.exists() or path.read_text(encoding="utf-8") != expected:
            print("sitemap.xml is out of sync; run python3 scripts/generate_sitemap.py")
            return 1
        print("Sitemap verified.")
        return 0
    path.write_text(expected, encoding="utf-8")
    print("Sitemap generated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
