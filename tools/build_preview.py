"""Build a claude.ai preview of the site: python3 tools/build_preview.py <outdir>

The preview page is wrapped in its own <html>/<head> when published, so this strips them, inlines the fonts
(the preview only loads fonts from the page itself), and marks the page so its form says it is a preview.
Pictures, songs and the hero video are published beside the page as they are."""
import base64, pathlib, re, shutil, sys
root = pathlib.Path(__file__).resolve().parent.parent / "site"
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
s = (root / "index.html").read_text()
s = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", s, flags=re.I)
s = re.sub(r"</head>\s*<body>", "", s); s = re.sub(r"</body>\s*</html>\s*$", "", s)
s = re.sub(r'<link rel="preload"[^>]*>\n?', "", s)
s = re.sub(r'<meta charset[^>]*>\n?|<meta name="viewport"[^>]*>\n?', "", s)
def font(m):
    data = base64.b64encode((root / m.group(1)).read_bytes()).decode()
    return f"url(data:font/woff2;base64,{data})"
s = re.sub(r"url\((fonts/[^)]+\.woff2)\)", font, s)
s = s.replace("<script>", "<script>window.PREVIEW = true;", 1)
# The videos go inside the page and play from blobs: Safari plays a video only from a server that answers range
# requests, and the preview's file host may not, so a published video showed only its poster there.
clips = re.findall(r'<video[^>]*?src="(video/[^"]+\.mp4)"', s)
for n, clip in enumerate(clips):
    s = s.replace(f'src="{clip}" ', f'data-clip="{n}" ', 1)
    s += f'<script type="text/plain" id="clip-{n}">{base64.b64encode((root / clip).read_bytes()).decode()}</script>\n'
s += """<script>
document.querySelectorAll("video[data-clip]").forEach((v) => {
  const b64 = document.getElementById("clip-" + v.dataset.clip).textContent;
  v.muted = true;
  v.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "video/mp4" }));
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
});
</script>
"""
s = s.replace("</body>", "").replace("</html>", "")
(out / "index.html").write_text(s)
for d in ("img", "audio", "video", "vinyl"):
    shutil.copytree(root / d, out / d, dirs_exist_ok=True)
print(out / "index.html")
