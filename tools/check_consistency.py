"""Lists any text size, text colour or faded text in site/index.html outside the set Carl picked on the
consistency quiz (10 Nov 2026; the rules are in .officers/consistency-rules.md). Run before every change:

    python3 tools/check_consistency.py

Prints nothing and exits 0 when everything uses the set."""
import pathlib, re, sys
css = re.search(r"<style>(.*?)</style>", (pathlib.Path(__file__).parent.parent / "site/index.html").read_text(), re.S).group(1)
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
root, _, rest = css.partition(":root {")[2].partition("}")
problems = []
for line_no, line in enumerate(rest.splitlines(), 1):
    for m in re.finditer(r"(?:font-size|font)\s*:\s*([^;}]+)", line):
        v = m.group(1)
        if "font-family" in line[:m.start()+11] or m.group(0).startswith("font-family"): continue
        sizes = re.findall(r"(?<![\w-])(\d+(?:\.\d+)?px)", v.split("/")[0] if m.group(0).startswith("font:") else v)
        # The phone's hero buttons wait on the phone question of the quiz.
        if sizes == ["16px"] and ".hero-ctas .btn" in line: continue
        if sizes: problems.append(f"text size {', '.join(sizes)} outside the set: {line.strip()[:110]}")
    for m in re.finditer(r"(?<![-\w])color\s*:\s*([^;}]+)", line):
        v = m.group(1).strip()
        if not re.fullmatch(r"var\(--(cream|butter|steel|black|white)\)|inherit|currentColor", v):
            problems.append(f"text colour {v} outside the set: {line.strip()[:110]}")
    if re.search(r"(?<![-\w])opacity\s*:\s*(?!1\b)", line) and not line.strip().startswith(("footer .mark", ".down")):
        problems.append(f"faded: {line.strip()[:110]}")
print("\n".join(problems)); sys.exit(1 if problems else 0)
