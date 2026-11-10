"""Makes Greg's versions of the record player's four drawings (site/vinyl/art/) from Carl's:

    python3 tools/vinyl_art.py ../studiolandmgmt-site/portfolio-player-kit/art <carlbahner deck-plinth.webp> site/img/mark.svg

Every colour in them is Greg's (Carl, 10 Nov 2026: "we need to change the colors of any illustrations"), each pixel
keeping the drawing's own shading: Carl's cream becomes Greg's off-white (#f2eee5), his ink and the black of the record
become Greg's charcoal (#2c3739, lighter or darker as drawn), the deck becomes slate (#4a6777), the label's squares and
the tonearm's yellow ochre (#af945f), each part's middle tone exactly the page's colour.

The deck comes from carlbahner.com's (its assets/deck-plinth.webp, in its wood): the kit's drawing with the thick charcoal
shadow along its bottom and right edges taken off and a thinner outline ("The removal of the weird shadow?", Carl,
10 Nov 2026). The platter is a deep slate disc with Greg's mark faint on it, where the STUDIOLAND MGMT watermark was.
Needs Pillow, numpy, and Node with Playwright (to draw the mark)."""
import colorsys, json, pathlib, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw

kit, cb_plinth, mark_svg = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
out = pathlib.Path(__file__).resolve().parent.parent / "site/vinyl/art"; out.mkdir(parents=True, exist_ok=True)
PAPER, CHAR, SLATE, OCHRE = (0xf2, 0xee, 0xe5), (0x2c, 0x37, 0x39), (0x4a, 0x67, 0x77), (0xaf, 0x94, 0x5f)
lum = lambda c: .299 * c[..., 0] + .587 * c[..., 1] + .114 * c[..., 2]

def recolour(src, dst, warm, warm_from):
    """Neutral light pixels to paper, neutral dark ones to charcoal, warm ones (orange, wood, yellow) to `warm`; each
    scaled by its brightness against the colour it was drawn in, so the drawing's shading and grain stay."""
    a = np.array(Image.open(src).convert("RGBA")).astype(float)
    rgb = a[..., :3]; L = lum(rgb)
    mx, mn = rgb.max(-1), rgb.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    cream = (sat < .22) & (L > 165)
    dark = (sat < .22) & ~cream
    hot = sat >= .22
    # EXACTLY THE PAGE'S COLOURS (the officers' round, 10 Nov 2026: "Use the DRAFT set"): each part's most common
    # brightness, its middle, lands on the page's own colour, so the record is the page's charcoal (it was #1d2527), the
    # arm the page's ochre (#d2b67d) and the deck's line the page's off-white (#fffcf1); lighter and darker stay as drawn.
    def paint(mask, to, floor=0):
        sel = mask & (a[..., 3] > 200) & (L > floor)   # the warm parts' dark edging isn't their colour: leave it out
        ref = np.median(L[sel]) if sel.any() else 1
        rgb[mask] = np.clip(np.array(to, float) * (L[mask] / ref)[:, None], 0, 255)
    paint(cream, PAPER)
    paint(dark, CHAR)
    paint(hot, warm, 90)
    a[..., :3] = rgb
    Image.fromarray(a.astype("uint8"), "RGBA").save(out / dst, quality=90)

recolour(cb_plinth, "plinth.webp", SLATE, (178, 104, 46))          # carlbahner's wood deck, no shadow
recolour(kit / "record.webp", "record.webp", OCHRE, (210, 112, 40))  # the label's orange squares
recolour(kit / "tonearm.webp", "tonearm.webp", OCHRE, (236, 194, 98))  # the yellow

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
