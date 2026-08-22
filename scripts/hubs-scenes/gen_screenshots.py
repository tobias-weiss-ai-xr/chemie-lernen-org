#!/usr/bin/env python3
"""Generate on-brand screenshot thumbnails for each scene archetype.

These are used as the Hubs scene `screenshot_owned_file` (required).
Golden-ratio composition, chemie palette, human-scale warm signage.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT, exist_ok=True)

# sRGB palette
BLUE = (30, 99, 179)
GOLD = (224, 168, 46)
CREAM = (242, 239, 230)
INK = (20, 28, 40)
TEAL = (26, 166, 160)

ARCHES = ["ElementRoom", "PeriodicPavilion", "LabWing", "ExperimentalRoom", "Lobby"]
SUBTITLE = {
    "ElementRoom": "Elementraum",
    "PeriodicPavilion": "Periodensystem-Pavillon",
    "LabWing": "Labor-Trakt",
    "ExperimentalRoom": "Experimentalraum",
    "Lobby": "Empfang",
}

W, H = 640, 360


def font(size):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make(arche):
    img = Image.new("RGB", (W, H), BLUE)
    d = ImageDraw.Draw(img)
    # golden-ratio inner panel (cream) anchored to lower golden section
    phi = 1.618
    panel_w = W / phi
    panel_x = (W - panel_w) / 2
    panel_h = H / phi
    panel_y = H - panel_h - 24
    d.rectangle([panel_x, panel_y, panel_x + panel_w, panel_y + panel_h], fill=CREAM)
    # golden-section accent line (gold)
    gx = panel_x + panel_w / phi
    d.line([(gx, panel_y), (gx, panel_y + panel_h)], fill=GOLD, width=4)
    # title (gold) + subtitle (ink)
    d.text((panel_x + 18, panel_y + 22), arche, fill=GOLD, font=font(30))
    d.text((panel_x + 18, panel_y + 64), SUBTITLE[arche], fill=INK, font=font(20))
    # brand footer
    d.text((panel_x + 18, panel_y + panel_h - 30), "chemie-lernen.org", fill=TEAL, font=font(16))
    # top-left chemie mark
    d.ellipse([24, 24, 56, 56], fill=GOLD)
    d.text((30, 30), "Ch", fill=BLUE, font=font(22))
    out = os.path.join(OUT, f"{arche}_screenshot.png")
    img.save(out)
    print("wrote", out)


for a in ARCHES:
    make(a)
