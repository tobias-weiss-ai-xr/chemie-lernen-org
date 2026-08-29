#!/usr/bin/env python3
"""
static-server.py — minimal static file server for the Hubs client dist/.

Replaces the webpack-dev-server in production. Serves /code/dist with the same
historyApiFallback rewrites Hubs' dev server used to apply:
  /link        -> /link.html
  /avatars     -> /avatar.html
  /scenes      -> /scene.html
  /signin      -> /signin.html
  /discord     -> /discord.html
  /cloud       -> /cloud.html
  /verify      -> /verify.html
  /tokens      -> /tokens.html
  /<7-char>    -> /hub.html        (room slugs)
Everything else without a file extension falls back to /index.html (SPA).
"""
import http.server
import socketserver
import os
import re
import sys

DIST = os.environ.get("HUBS_DIST", "/code/dist")

REWRITES = [
    (r"^/link", "/link.html"),
    (r"^/avatars", "/avatar.html"),
    (r"^/scenes", "/scene.html"),
    (r"^/signin", "/signin.html"),
    (r"^/discord", "/discord.html"),
    (r"^/cloud", "/cloud.html"),
    (r"^/verify", "/verify.html"),
    (r"^/tokens", "/tokens.html"),
    (r"^/[A-Za-z0-9]{7}/?$", "/hub.html"),
]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def guess_type(self, path):
        # Force correct MIME types (SimpleHTTPRequestHandler's mimetypes DB is
        # often missing these, which makes browsers reject the PWA manifest
        # and ES modules).
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".js"):
            return "application/javascript"
        if path.endswith(".json"):
            return "application/json"
        return super().guess_type(path)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        target = path
        for pat, rep in REWRITES:
            if re.match(pat, path):
                target = rep
                break
        fs_path = os.path.join(DIST, target.lstrip("/"))
        if os.path.isfile(fs_path):
            self.path = target
            return super().do_GET()
        # SPA fallback only for extensionless routes.
        if "." not in os.path.basename(path):
            self.path = "/index.html"
            return super().do_GET()
        self.send_error(404, "Not Found: " + path)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
        print(f"hubs static server on :{port} -> {DIST}", flush=True)
        httpd.serve_forever()
