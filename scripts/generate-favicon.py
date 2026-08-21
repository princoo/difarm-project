from pathlib import Path

from PIL import Image

src = Path("public/logo.png")
img = Image.open(src).convert("RGBA")

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

w, h = img.size
side = max(w, h)
pad = int(side * 0.08)
canvas_side = side + pad * 2
canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
canvas.paste(img, ((canvas_side - w) // 2, (canvas_side - h) // 2), img)

# Multi-size ICO — browsers and Google crawl /favicon.ico by default
canvas.save(
    "public/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)

canvas.resize((64, 64), Image.Resampling.LANCZOS).save(
    "public/favicon.png", format="PNG", optimize=True
)

for name, size in [
    ("apple-touch-icon.png", 180),
    ("logo192.png", 192),
    ("logo512.png", 512),
]:
    out = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    logo = canvas.resize((int(size * 0.82), int(size * 0.82)), Image.Resampling.LANCZOS)
    ox = (size - logo.width) // 2
    oy = (size - logo.height) // 2
    out.paste(logo, (ox, oy), logo)
    out.convert("RGB").save(f"public/{name}", format="PNG", optimize=True)

print("Wrote favicon.ico, favicon.png, apple-touch-icon.png, logo192.png, logo512.png")
print("favicon.ico size:", Path("public/favicon.ico").stat().st_size)
