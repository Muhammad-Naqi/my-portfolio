#!/usr/bin/env python3
"""Local dev server with correct PDF headers (reduces browser download warnings)."""

import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", "8080"))
ROOT = os.path.dirname(os.path.abspath(__file__))


class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        path = self.path.split("?", 1)[0]
        if path.endswith("/resume.pdf") or path == "/resume.pdf":
            self.send_header("Content-Type", "application/pdf")
            self.send_header("X-Content-Type-Options", "nosniff")
            # Inline = open in browser tab (trusted). ?dl=1 = force download.
            if "dl=1" in self.path:
                self.send_header(
                    "Content-Disposition",
                    'attachment; filename="Muhammad-Naqi-Resume.pdf"',
                )
            else:
                self.send_header(
                    "Content-Disposition",
                    'inline; filename="Muhammad-Naqi-Resume.pdf"',
                )
        super().end_headers()


if __name__ == "__main__":
    os.chdir(ROOT)
    with socketserver.TCPServer(("", PORT), PortfolioHandler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}")
        print("Use: python3 serve.py  (instead of python3 -m http.server)")
        httpd.serve_forever()
