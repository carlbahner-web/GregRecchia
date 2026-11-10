"""Makes Greg's versions of the record player's four drawings (site/vinyl/art/) from Carl's in studiolandmgmt-site:

    python3 tools/vinyl_art.py ../studiolandmgmt-site/portfolio-player-kit/art site/img/mark.svg

Carl's teal plinth goes to Greg's slate; the record label's orange squares and the tonearm's yellow go to his ochre,
each keeping the drawing's own shading; the platter becomes a deep slate disc with Greg's mark faint on it, where the
STUDIOLAND MGMT watermark was ("different images instead of my Slmgmt branded art", Carl, 10 Nov 2026).
Needs Pillow, numpy, and Node with Playwright (to draw the mark)."""
import json, pathlib, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw

src, mark_svg = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
out = pathlib.Path(__file__).resolve().parent.parent / "site/vinyl/art"; out.mkdir(parents=True, exist_ok=True)
L = lambda c: .299 * c[0] + .587 * c[1] + .114 * c[2]

def tint(name, test, target, from_colour):
    a = np.array(Image.open(src / f"{name}.webp").convert("RGBA")).astype(float)
    rgb = a[:, :, :3]; pick = test(rgb) & (a[:, :, 3] > 0)
    lum = (rgb * [.299, .587, .114]).sum(2, keepdims=True)
    rgb[pick] = np.clip(np.array(target, float) * lum / L(from_colour), 0, 255)[pick]
    Image.fromarray(a.astype("uint8"), "RGBA").save(out / f"{name}.webp", quality=90)

tint("plinth", lambda c: (c[:, :, 2] > c[:, :, 0] + 12) & (c[:, :, 1] > c[:, :, 0] + 8), (0x4a, 0x67, 0x77), (0x3a, 0x61, 0x68))
tint("record", lambda c: (c[:, :, 0] > 150) & (c[:, :, 0] > c[:, :, 2] + 80), (0xaf, 0x94, 0x5f), (210, 112, 40))
tint("tonearm", lambda c: (c[:, :, 0] > 180) & (c[:, :, 1] > 140) & (c[:, :, 2] < 150) & (c[:, :, 0] > c[:, :, 2] + 60),
     (0xc8, 0xae, 0x78), (236, 194, 98))

svg = mark_svg.read_text().replace('fill="currentColor"', 'fill="#fff"').replace("<svg", '<svg style="width:400px"', 1)
with tempfile.TemporaryDirectory() as tmp:
    html = f'<body style="margin:0"><div style="width:1024px;height:1024px;display:grid;place-items:center">{svg}</div></body>'
    js = ("const { chromium } = require('playwright'); (async () => { const b = await chromium.launch();"
          " const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });"
          f" await p.setContent({json.dumps(html)}); await p.screenshot({{ path: {json.dumps(tmp + '/mark.png')}, omitBackground: true }});"
          " await b.close(); })();")
    subprocess.run(["node", "-e", js], check=True)
    m = np.array(Image.open(f"{tmp}/mark.png").convert("RGBA"))
m[:, :, :3] = [0x92, 0xa6, 0xb1]; m[:, :, 3] = (m[:, :, 3] * .32).astype("uint8")
disc = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
ImageDraw.Draw(disc).ellipse((0, 0, 1023, 1023), fill=(0x36, 0x4e, 0x5b, 255))
disc.alpha_composite(Image.fromarray(m, "RGBA")); disc.save(out / "platter.webp", quality=90)
print("made", sorted(f.name for f in out.iterdir()))
