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
    # Match 7-char hub IDs with optional slug (e.g. /raJ6mj3 or
    # /raJ6mj3/test-room).  The slug is restricted to [A-Za-z0-9_-] so that
    # file paths like /<hubId>/objects.gltf or /<hubId>/scene.glb do NOT
    # match and instead get a clean 404 (serving hub.html for a .gltf
    # request causes a SyntaxError when the glTF loader tries to parse
    # HTML as JSON).  An optional trailing slash is allowed so that
    # /raJ6mj3/test-room/ also serves hub.html (not index.html).
    (r"^/[A-Za-z0-9]{7}(/[A-Za-z0-9_-]*)?/?$", "/hub.html"),
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

    def _resolve_target(self):
        """Resolve self.path to the file to serve, applying REWRITES and SPA
        fallback.  Returns the target path, or None for 404."""
        path = self.path.split("?")[0].split("#")[0]
        target = path
        for pat, rep in REWRITES:
            if re.match(pat, path):
                target = rep
                break
        fs_path = os.path.join(DIST, target.lstrip("/"))
        if os.path.isfile(fs_path):
            return target
        # SPA fallback only for extensionless routes.
        if "." not in os.path.basename(path):
            return "/index.html"
        return None

    def do_GET(self):
        target = self._resolve_target()
        if target is None:
            self.send_error(404, "Not Found: " + self.path)
            return
        self.path = target
        return super().do_GET()

    def do_HEAD(self):
        # Mirror do_GET routing so HEAD requests to room URLs (e.g. from
        # phoenix-adapter.js pre-flight checks) return 200, not 404.
        target = self._resolve_target()
        if target is None:
            self.send_error(404, "Not Found: " + self.path)
            return
        self.path = target
        return super().do_HEAD()

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
