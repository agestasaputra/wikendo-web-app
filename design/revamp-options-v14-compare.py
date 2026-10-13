"""Render PNG board v14 bottom-nav 20 opsi (BN1-BN20).
Grid 5 kolom x 4 baris. ASCII-only labels (PIL load_default tofu rule).
"""
from PIL import Image, ImageDraw, ImageFont

INK = (12, 10, 9)
PAGE = (245, 245, 244)
WHITE = (255, 255, 255)
GRAY = (120, 113, 108)
GRAY2 = (214, 211, 209)
GRAY3 = (231, 229, 228)
LIME = (163, 230, 53)
ROSE = (225, 29, 72)
EMBER = (234, 88, 12)
BG = (250, 250, 249)

f_title = ImageFont.load_default(size=30)
f_sub = ImageFont.load_default(size=21)
f_med = ImageFont.load_default(size=19)
f_sml = ImageFont.load_default(size=17)
f_tny = ImageFont.load_default(size=15)

# 20 opsi: (id, nama pendek, gaya bar, badge-center?)
OPTS = [
    ("BN1", "Ink 5-tab REC", "ink", None),
    ("BN2", "Float 5-tab", "float", None),
    ("BN3", "4-tab Cari", "white", None),
    ("BN4", "FAB Quiz", "white", "FAB"),
    ("BN5", "FAB Makan", "white", "FAB"),
    ("BN6", "Pill float", "pill", None),
    ("BN7", "Ikon saja", "white", None),
    ("BN8", "Pill lime", "white", "PILL"),
    ("BN9", "Badge quota", "ink", "BDG"),
    ("BN10", "Auth avatar", "white", "AV"),
    ("BN11", "Promo rose", "white", "FAB"),
    ("BN12", "Mall center", "white", None),
    ("BN13", "Blur ink", "ink", None),
    ("BN14", "Native iOS", "white", None),
    ("BN15", "Sheet FAB", "white", "FAB"),
    ("BN16", "Split kanan", "ink", None),
    ("BN17", "Wishlist P1", "white", None),
    ("BN18", "Riwayat", "white", None),
    ("BN19", "Mini 3-tab", "white", None),
    ("BN20", "AI center", "white", "FAB"),
]
NAMES5 = ["Home", "Tempat", "Makan", "Mall", "Akun"]
NAMES4 = ["Home", "Cari", "Mall", "Akun"]
NAMES3 = ["Home", "Cari", "Mall"]

PW, PH = 200, 400
GX, GY0, GAPX, GAPY = 24, 130, 16, 16
COLS = 5
ROWS = 4
W = GX * 2 + COLS * PW + (COLS - 1) * GAPX
H = GY0 + ROWS * PH + (ROWS - 1) * GAPY + 24

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

d.text((GX, 16), "Bottom nav 20 opsi — BN1 s/d BN20 (v14 board)", font=f_title, fill=INK)
d.text((GX, 52), "app/ untouched. Balas: Gua suka [BNx]  (atau + feedback list)", font=f_sub, fill=(225, 29, 72))
d.text((GX, 78), "REC = BN1 ink 5-tab. FAB tunggal kalah split. Badge quota = P1 tempel.", font=f_tny, fill=GRAY)
d.text((GX, 102), "Classic: BN1 BN2 BN8 BN12 BN16 | FAB: BN4 BN5 BN11 BN15 BN20 | Minimal: others", font=f_tny, fill=GRAY)


def hero(x, y, w):
    d.rounded_rectangle([x, y, x + w, y + 66], radius=8, fill=INK)
    d.text((x + 8, y + 6), "QUOTA HARI INI", font=f_tny, fill=GRAY2)
    d.text((x + 8, y + 24), "1 . 2", font=f_med, fill=LIME)
    d.text((x + 8, y + 46), "login buka 2 + 5", font=f_tny, fill=GRAY2)
    return y + 72


def cta2(x, y, w):
    d.rounded_rectangle([x, y, x + w // 2 - 2, y + 26], radius=6, fill=INK)
    d.rounded_rectangle([x + w // 2 + 2, y, x + w, y + 26], radius=6, fill=WHITE, outline=GRAY3, width=2)
    d.text((x + 6, y + 6), "Tempat", font=f_tny, fill=WHITE)
    d.text((x + w // 2 + 8, y + 6), "Makan", font=f_tny, fill=INK)
    return y + 32


def nav_bar(x, y, w, style, names, special):
    h = 62
    if style == "ink":
        d.rounded_rectangle([x, y, x + w, y + h], radius=10, fill=INK)
        tc, ac = GRAY2, LIME
    elif style == "float":
        d.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=WHITE, outline=INK, width=2)
        tc, ac = GRAY, INK
    elif style == "pill":
        d.rounded_rectangle([x + 20, y + 8, x + w - 20, y + h - 8], radius=20, fill=INK)
        tc, ac = GRAY2, LIME
    else:
        d.rounded_rectangle([x, y, x + w, y + h], radius=10, fill=WHITE, outline=GRAY3, width=2)
        tc, ac = GRAY, INK
    n = len(names)
    for i, nm in enumerate(names):
        cx = x + (i + 0.5) * w / n
        lbl = nm[:6]
        if special == "FAB" and i == 2:
            d.ellipse([cx - 16, y + 2, cx + 16, y + 34], fill=(225, 29, 72), outline=WHITE, width=3)
            d.text((cx - 4, y + 8), ">", font=f_med, fill=WHITE)
            d.text((cx - 12, y + 38), lbl, font=f_tny, fill=tc)
        elif special == "PILL" and i == 0:
            d.rounded_rectangle([cx - 26, y + 8, cx + 26, y + 44], radius=12, fill=LIME)
            d.text((cx - 20, y + 20), lbl, font=f_tny, fill=INK)
        elif special == "BDG" and nm == "Makan":
            d.text((cx - 14, y + 22), lbl, font=f_tny, fill=ac if i == 0 else tc)
            d.ellipse([cx + 8, y + 6, cx + 24, y + 22], fill=(225, 29, 72))
            d.text((cx + 13, y + 7), "2", font=f_tny, fill=WHITE)
        elif special == "AV" and nm == "Akun":
            d.ellipse([cx - 11, y + 6, cx + 11, y + 28], fill=INK)
            d.text((cx - 4, y + 8), "S", font=f_tny, fill=WHITE)
            d.text((cx - 12, y + 32), lbl, font=f_tny, fill=tc)
        else:
            d.text((cx - 14, y + 22), lbl, font=f_tny, fill=ac if i == 0 else tc)
    return y + h


for idx, (oid, name, style, special) in enumerate(OPTS):
    col, row = idx % COLS, idx // COLS
    x = GX + col * (PW + GAPX)
    y = GY0 + row * (PH + GAPY)
    rec = (oid == "BN1")
    d.rounded_rectangle([x, y, x + PW, y + PH], radius=16, fill=PAGE,
                        outline=(225, 29, 72) if rec else GRAY3, width=3 if rec else 2)
    d.text((x + 10, y + 6), oid + " " + name, font=f_sml, fill=(225, 29, 72) if rec else INK)
    cx, cw = x + 10, PW - 20
    cy = y + 30
    d.text((cx, cy), "Halo, teman", font=f_tny, fill=INK)
    cy += 20
    cy = hero(cx, cy, cw)
    cy = cta2(cx, cy, cw)
    names = NAMES3 if oid == "BN19" else (NAMES4 if oid in ("BN3",) else NAMES5)
    nav_bar(cx, cy, cw, style, names, special)

img.save("/home/ubuntu/wikendo-web-app/design/revamp-options-v14-compare.png")
print("saved", img.size)
