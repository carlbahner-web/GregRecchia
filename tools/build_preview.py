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
# The hero video goes inside the page and plays from a blob: Safari plays a video only from a server that answers
# range requests, and the preview's file host may not, so a published video showed only its poster there.
mp4 = base64.b64encode((root / "video/console.mp4").read_bytes()).decode()
s = s.replace('src="video/console.mp4" ', '')
s = s.replace("</body>", "")
s += f"""<script type="text/plain" id="hero-mp4">{mp4}</script>
<script>
(() => {{
  const v = document.querySelector(".hero-video"), b64 = document.getElementById("hero-mp4").textContent;
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  v.muted = true;
  v.src = URL.createObjectURL(new Blob([bytes], {{ type: "video/mp4" }}));
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {{}});
}})();
</script>
"""
(out / "index.html").write_text(s)
for d in ("img", "audio", "video"):
    shutil.copytree(root / d, out / d, dirs_exist_ok=True)
print(out / "index.html")
