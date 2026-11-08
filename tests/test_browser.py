"""WRC browser-level regression tests: real DOM, JS and responsive navigation."""
from datetime import date, timedelta
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class WRCBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))
        )
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_address[1])
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def setUp(self):
        self.context = self.browser.new_context(
            viewport={"width": 390, "height": 844}, device_scale_factor=1
        )
        # Local functional tests must not need third-party images, analytics or CDNs.
        self.context.route("**/*", lambda route: route.continue_()
                           if route.request.url.startswith(self.base)
                           else route.abort())
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.assertEqual(self.errors, [], "Unexpected JavaScript page errors")
        self.context.close()

    def visit(self, path):
        response = self.page.goto(self.base + path, wait_until="domcontentloaded")
        self.assertEqual(response.status, 200, path)
        return self.page

    def test_navigation_mobile_and_sticky(self):
        page = self.visit("/calendar/")
        menu = page.locator(".wrc-nav-menu")
        self.assertTrue(menu.locator("summary").is_visible())
        menu.locator("summary").click()
        self.assertTrue(menu.evaluate("(node) => node.open"))
        self.assertTrue(page.locator(".wrc-nav-links--mobile a[href='/runlab/']").is_visible())
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(100)
        y = page.locator(".wrc-global-nav").bounding_box()["y"]
        self.assertLess(abs(y), 5, "Mobile header should remain sticky")

    def test_calendar_archives_and_ios_downloads(self):
        page = self.visit("/calendar/")
        self.assertEqual(page.locator(".section-head").count(), 3)
        self.assertEqual(page.locator("details.past-events").count(), 3)
        details = page.locator("details.past-events").first
        details.locator("summary").click()
        self.assertTrue(details.evaluate("(node) => node.open"))
        self.assertGreater(details.locator("article.card").count(), 0)
        # Archived events are still readable without re-enabling old signup links.
        self.assertTrue(details.locator(".date").first.is_visible())
        self.assertGreater(page.locator("a.cal-os").count(), 15)

    def test_runlab_shared_navigation_and_footer(self):
        paths = [
            "/runlab/",
            "/runlab/training-plan/",
            "/runlab/hr-zone-setup/",
            "/runlab/fuel-calculator/",
            "/runlab/fuel-calculator/daily-fuel.html",
            "/runlab/fuel-calculator/run-fuel.html",
        ]
        for path in paths:
            with self.subTest(path=path):
                page = self.visit(path)
                self.assertEqual(page.locator(".wrc-global-nav.wrc-is-runlab").count(), 1)
                self.assertEqual(page.locator(".wrc-legal-disclosure").count(), 1)
                self.assertTrue(page.locator(".wrc-legal-copy").is_visible())
                page.locator(".wrc-legal-disclosure summary").click()
                self.assertTrue(page.locator(".wrc-legal-links a[href='/policies/privacy/']").is_visible())

    def test_runlab_header_stays_at_top_on_desktop(self):
        self.page.set_viewport_size({"width": 1440, "height": 850})
        page = self.visit("/runlab/hr-zone-setup/")
        self.assertEqual(page.locator(".wrc-global-nav").evaluate(
            "(el) => getComputedStyle(el).position"), "sticky")
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(100)
        self.assertLess(abs(page.locator(".wrc-global-nav").bounding_box()["y"]), 5)

    def test_hr_zone_calculator(self):
        page = self.visit("/runlab/hr-zone-setup/")
        page.locator("#rest").fill("55")
        page.locator("#max").fill("195")
        page.locator("#calcZones").click()
        self.assertTrue(page.locator("#res").evaluate(
            "(el) => el.classList.contains('on')"))
        self.assertIn("ZONE", page.locator("#res").inner_text().upper())
        self.assertTrue(page.locator("#copyZones").is_visible())

    def test_daily_fuel_calculator(self):
        page = self.visit("/runlab/fuel-calculator/daily-fuel.html")
        page.get_by_role("button", name="CALCULATE DAILY FUEL").click()
        self.assertTrue(page.locator("#res").evaluate(
            "(el) => el.classList.contains('on')"))
        self.assertIn("DAILY TARGET", page.locator("#res").inner_text())

    def test_run_fuel_calculator(self):
        page = self.visit("/runlab/fuel-calculator/run-fuel.html")
        page.locator("#rh").select_option("1")
        page.locator("#rm").select_option("30")
        page.get_by_role("button", name="BUILD FUEL PLAN").click()
        self.assertTrue(page.locator("#res").evaluate(
            "(el) => el.classList.contains('on')"))
        self.assertIn("YOUR RUN FUEL TIMELINE", page.locator("#res").inner_text())

    def test_training_plan_and_export_controls(self):
        page = self.visit("/runlab/training-plan/")
        race_date = (date.today() + timedelta(days=140)).isoformat()
        page.locator("#date").fill(race_date)
        page.locator("#buildPlanBtn").click()
        self.assertGreater(len(page.locator("#res").inner_text()), 250)
        self.assertTrue(page.locator("#downloadPlanPdf").is_visible())
        self.assertTrue(page.locator("#printPlan").is_visible())

    def test_standalone_report_charts_render(self):
        page = self.visit("/events/2026-11-05-speedwork/")
        self.assertEqual(page.locator(".wrc-global-nav").count(), 0)
        self.assertGreaterEqual(page.locator("#repTable tr").count(), 9)
        self.assertGreater(len(page.locator("#hrChart").inner_html()), 50)
        self.assertGreater(len(page.locator("#zones").inner_html()), 50)


if __name__ == "__main__":
    unittest.main()
