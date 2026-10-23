"""Montaj: scoate omul din stratul din față (Osmo l4) și pune omul pe scaun cu laptop.
Rulează cu: rb/Scripts/python -I compose.py comp/ <inaltime_om_px> <centru_x> <out.png>
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

d = sys.argv[1]
H = int(sys.argv[2]) if len(sys.argv) > 2 else 300
CX = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
OUT = sys.argv[4] if len(sys.argv) > 4 else d + "l4-scaun.png"
WARM = len(sys.argv) > 5 and sys.argv[5] == "cald"
TOP, BOT = ((255, 196, 140), (240, 110, 50)) if WARM else ((185, 205, 228), (120, 145, 175))
HALO = (255, 150, 80) if WARM else (190, 215, 245)

l4 = Image.open(d + "osmo-l4.png").convert("RGBA")
W, Hh = l4.size

# 1) scoate omul: coloanele 895..1075 copiate din dreapta (+260), rândurile 900..1400
x0, x1, y0, y1, dx = 895, 1075, 900, 1400, 260
patch = l4.crop((x0 + dx, y0, x1 + dx, y1))
l4.paste(patch, (x0, y0))
# netezește cusăturile
seam = l4.crop((x0 - 12, y0, x1 + 12, y1)).filter(ImageFilter.GaussianBlur(1.2))
mask = Image.new("L", seam.size, 0)
for xx in list(range(0, 24)) + list(range(seam.width - 24, seam.width)):
    for yy in range(seam.height):
        mask.putpixel((xx, yy), 255)
l4.paste(seam, (x0 - 12, y0), mask)

alpha = l4.split()[3]

def ridge(x):
    for y in range(850, Hh):
        if alpha.getpixel((x, y)) > 140:
            return y
    return Hh

# 2) omul: gradare spre siluetă rece, ecranul rămâne luminos
p = Image.open(d + "om-scaun-cut.png").convert("RGBA")
p = p.crop(p.split()[3].getbbox())
rgb = p.convert("RGB")
a = p.split()[3]
gray = rgb.convert("L")
# masca ecranului: pixeli foarte luminoși și neutri, în zona laptopului
sat = ImageEnhance.Color(rgb).enhance(0)
bright = gray.point(lambda v: 255 if v > 170 else 0)
w0, h0 = p.size
screen = Image.new("L", p.size, 0)
sx0, sy0, sx1, sy1 = int(w0 * .52), int(h0 * .22), int(w0 * .82), int(h0 * .62)
screen.paste(bright.crop((sx0, sy0, sx1, sy1)), (sx0, sy0))
# exclude hanoracul (stânga) — ecranul e doar în dreapta corpului
screen = ImageChops.multiply(screen, a)
# umple tot ecranul: colțurile măsurate pe decupaj (coordonate după crop-ul bbox)
from PIL import ImageDraw
bx, by = Image.open(d + "om-scaun-cut.png").split()[3].getbbox()[:2]
poly = [(768 - bx, 394 - by), (990 - bx, 434 - by), (952 - bx, 632 - by), (730 - bx, 586 - by)]
ImageDraw.Draw(screen).polygon(poly, fill=255)
screen = ImageChops.multiply(screen, a)

tint = Image.new("RGB", p.size, (52, 64, 78))
# comprimă luminile (hanoracul crem ar ieși prea deschis, cu logo vizibil)
sat = sat.point(lambda v: int(255 * (v / 255) ** 2.3 * 0.5 + 16)).filter(ImageFilter.GaussianBlur(2.2))
dark = ImageChops.multiply(sat, tint)
dark = ImageEnhance.Contrast(dark).enhance(1.15)
# lumină de contur rece, discretă (din cerul din spate)
rim = ImageEnhance.Brightness(sat).enhance(0.35)
dark = Image.blend(dark, ImageChops.multiply(rim, Image.new("RGB", p.size, (150, 170, 190))), 0.18)
glowcol = Image.new("RGB", p.size)
for yy in range(p.height):
    t = min(1, max(0, (yy - (poly[0][1])) / max(1, poly[2][1] - poly[0][1])))
    glowcol.paste(tuple(int(TOP[i] * (1 - t) + BOT[i] * t) for i in range(3)), (0, yy, p.width, yy + 1))
screen = screen.point(lambda v: int(v * .88))
MODE = sys.argv[5] if len(sys.argv) > 5 else "cald"
if MODE in ("logo", "cod"):
    import numpy as np
    cw, ch = 640, 400
    if MODE == "logo":
        content = Image.new("RGB", (cw, ch), (246, 239, 227))
        lg = Image.open(d + "logo.png").convert("RGB"); lg.thumbnail((330, 330))
        content.paste(lg, ((cw - lg.width) // 2, (ch - lg.height) // 2))
    else:
        content = Image.new("RGB", (cw, ch), (24, 18, 16))
        dr = ImageDraw.Draw(content)
        dr.rectangle((0, 0, cw, 34), fill=(36, 28, 24))
        for i, c in enumerate([(229, 50, 34), (255, 181, 46), (120, 200, 120)]):
            dr.ellipse((14 + i * 22, 11, 26 + i * 22, 23), fill=c)
        dr.rectangle((0, 34, 150, ch), fill=(30, 23, 20))
        import random; random.seed(4)
        for k in range(12):
            dr.rounded_rectangle((18, 52 + k * 26, 18 + random.randint(50, 110), 62 + k * 26), 4, fill=(90, 78, 70))
        cols = [(242, 106, 33), (255, 181, 46), (229, 50, 34), (230, 220, 205), (140, 128, 118)]
        y = 52
        while y < ch - 20:
            x = 172 + random.choice([0, 0, 22, 44])
            for _ in range(random.randint(1, 3)):
                w = random.randint(30, 140)
                dr.rounded_rectangle((x, y, x + w, y + 10), 4, fill=random.choice(cols)); x += w + 10
            y += 22
    src = [(0, 0), (cw, 0), (cw, ch), (0, ch)]
    A = []; B = []
    for (X, Y), (u, v) in zip(poly, src):
        A += [[X, Y, 1, 0, 0, 0, -u * X, -u * Y], [0, 0, 0, X, Y, 1, -v * X, -v * Y]]; B += [u, v]
    coef = np.linalg.solve(np.array(A, float), np.array(B, float))
    glowcol = content.transform(p.size, Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)
    m = Image.new("L", p.size, 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    screen = ImageChops.multiply(m, a)
    avg = content.resize((1, 1), Image.BOX).getpixel((0, 0))
    HALO = tuple(min(255, int(c * 1.1)) for c in avg) if MODE == "logo" else (255, 140, 70)
scr = Image.composite(glowcol, dark, screen.filter(ImageFilter.GaussianBlur(1.0)))
person = scr.convert("RGBA")
person.putalpha(a)

# scalare
s = H / person.height
person = person.resize((round(person.width * s), H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
screen_s = screen.resize(person.size, Image.LANCZOS)

# 3) așezare pe creastă
px = CX - person.width // 2
base = max(ridge(x) for x in range(px + person.width // 5, px + person.width * 4 // 5))
py = base - person.height + 10  # picioarele scaunului intră puțin în pământ

out = Image.new("RGBA", l4.size, (0, 0, 0, 0))
# strălucirea ecranului pe aer (halou)
halo = Image.new("RGBA", l4.size, (0, 0, 0, 0))
hm = screen_s.filter(ImageFilter.GaussianBlur(18)).point(lambda v: min(255, int(v * 1.6)))
halo_layer = Image.new("RGBA", person.size, HALO + (0,))
halo_layer.putalpha(hm.point(lambda v: int(v * .8)))
halo.alpha_composite(halo_layer, (px, py))
out.alpha_composite(halo)
out.alpha_composite(person, (px, py))
# tot pământul stă în fața omului: creasta/ridicătura îi acoperă natural picioarele scaunului
out.alpha_composite(l4)

out.save(OUT, optimize=True)
out.save(OUT.replace(".png", ".webp"), quality=88)
print("ok", OUT, "pos", px, py, "base", base, "size", person.size)
