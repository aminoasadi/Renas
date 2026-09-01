import base64, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMBED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embed")

def read(path):
    with open(os.path.join(ROOT, path), "r", encoding="utf-8") as f:
        return f.read()

def b64(path, mime):
    with open(path, "rb") as f:
        data = f.read()
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"

html = read("index.html")

# ---- Fonts: build a @font-face block with embedded base64 woff2 ----
ibmplex_uri = b64(os.path.join(EMBED, "ibmplex.woff2"), "font/woff2")
jbmono_uri = b64(os.path.join(EMBED, "jbmono.woff2"), "font/woff2")

font_css = f"""
@font-face {{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url({ibmplex_uri}) format('woff2');
}}
@font-face {{
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400 500;
  font-display: swap;
  src: url({jbmono_uri}) format('woff2');
}}
"""

# ---- CSS files inlined in original order ----
css_files = ["css/tokens.css", "css/base.css", "css/components.css", "css/sections.css"]
css_combined = font_css + "\n" + "\n".join(read(p) for p in css_files)

# Remove the Google Fonts <link>/<preconnect> tags and the four stylesheet links,
# replace with a single inline <style> block.
html = re.sub(r'\s*<link rel="preconnect"[^>]*>\n', "\n", html)
html = re.sub(r'\s*<link href="https://fonts\.googleapis\.com[^"]*"[^>]*>\n', "\n", html)
for p in css_files:
    html = re.sub(rf'\s*<link rel="stylesheet" href="{re.escape(p)}">\n', "\n", html)

html = html.replace("</head>", f"<style>\n{css_combined}\n</style>\n</head>")

# ---- Images: embed as base64 ----
images = {
    "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1600&q=80":
        b64(os.path.join(EMBED, "hero.jpg"), "image/jpeg"),
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80":
        b64(os.path.join(EMBED, "ss.jpg"), "image/jpeg"),
    "https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?auto=format&fit=crop&w=1200&q=80":
        b64(os.path.join(EMBED, "cap.jpg"), "image/jpeg"),
}
for url, data_uri in images.items():
    html = html.replace(url, data_uri)

# ---- JS files inlined in original order, replacing the three <script src> tags ----
js_files = ["js/process-track.js", "js/corridor-map.js", "js/main.js"]
js_combined = "\n".join(read(p) for p in js_files)

script_block_re = re.compile(
    r'<script src="js/process-track\.js" defer></script>\s*'
    r'<script src="js/corridor-map\.js" defer></script>\s*'
    r'<script src="js/main\.js" defer></script>'
)
html = script_block_re.sub(f"<script>\n{js_combined}\n</script>", html)

out_path = os.path.join(ROOT, "renas-review.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

size_kb = os.path.getsize(out_path) / 1024
print(f"Wrote {out_path} ({size_kb:.0f} KB)")

# Sanity checks
remaining_external = re.findall(r'(?:href|src)="(https?://[^"]+)"', html)
remaining_external = [u for u in remaining_external if "wa.me" not in u and "linkedin.com" not in u and "mailto:" not in u]
print("Remaining external href/src (excluding contact links):", remaining_external)
