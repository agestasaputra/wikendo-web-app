"""Render PNG board v15 (U1 vs E1 vs E2). ASCII labels only."""
from PIL import Image, ImageDraw, ImageFont

INK = (12, 10, 9)
PAGE = (245, 245, 244)
WHITE = (255, 255, 255)
GRAY = (120, 113, 108)
GRAY2 = (214, 211, 209)
GRAY3 = (231, 229, 228)
LIME = (163, 230, 53)
ROSE = (225, 29, 72)
BG = (250, 250, 249)

f_t = ImageFont.load_default(size=30)
f_s = ImageFont.load_default(size=21)
f_m = ImageFont.load_default(size=19)
f_x = ImageFont.load_default(size=17)
f_n = ImageFont.load_default(size=15)

CARDS = [
    ("U1", "IDE AS-IS", "white", ["Home", "Hist", "Add", "Notif", "Akun"], "U1: 2 tab kosong P0 (History, Notif)", False),
    ("E1", "ADAPTASI REC", "ink", ["Home", "Mall", "Quiz+", "Riwayat", "Akun"], "E1: 0 tab mati, Mall 1-tap", True),
    ("E2", "FULL P1", "white", ["Home", "Hist", "Quiz+", "Notif", "Akun"], "E2: nanti + backend notif", False),
]
PW, PH = 300, 520
GX, GY0, GAP = 24, 150, 20
W = GX * 2 + 3 * PW + 2 * GAP
H = GY0 + PH + 24

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
d.text((GX, 16), "Ide Agesta vs adaptasi — U1 / E1 / E2 (v15 board)", font=f_t, fill=INK)
d.text((GX, 52), "U1 as-is = 2 tab kosong P0. E1 = ide lu, 1 slot digeser (Notif jadi Mall). E2 = P1.", font=f_s, fill=(225, 29, 72))
d.text((GX, 80), "Balas: Gua suka [U1/E1/E2]  (atau + feedback list). app/ untouched.", font=f_n, fill=GRAY)
d.text((GX, 104), "Anon Bell = login CTA. Login Bell = header. Riwayat = localStorage real.", font=f_n, fill=GRAY)

for i, (oid, name, style, names, note, rec) in enumerate(CARDS):
    x = GX + i * (PW + GAP)
    y = GY0
    d.rounded_rectangle([x, y, x + PW, y + PH], radius=16, fill=PAGE,
                        outline=(225, 29, 72) if rec else GRAY3, width=3 if rec else 2)
    d.text((x + 12, y + 8), oid + " " + name, font=f_x, fill=(225, 29, 72) if rec else INK)
    cx, cw = x + 14, PW - 28
    cy = y + 36
    d.text((cx, cy), "Halo, teman Wikendo", font=f_n, fill=INK)
    cy += 22
    d.rounded_rectangle([cx, cy, cx + cw, cy + 56], radius=8, fill=INK)
    d.text((cx + 8, cy + 5), "QUOTA HARI INI", font=f_n, fill=GRAY2)
    d.text((cx + 8, cy + 23), "1 . 2", font=f_m, fill=LIME)
    cy += 64
    if oid != "E2":
        d.rounded_rectangle([cx, cy, cx + cw, cy + 76], radius=8, fill=WHITE, outline=INK, width=2)
        d.text((cx + 8, cy + 4), "+ ADD/QUIZ -> sheet", font=f_n, fill=INK)
        d.rounded_rectangle([cx + 8, cy + 24, cx + cw - 8, cy + 48], radius=6, fill=INK)
        d.text((cx + 14, cy + 30), "Tempat (2/hari)", font=f_n, fill=WHITE)
        d.rounded_rectangle([cx + 8, cy + 50, cx + cw - 8, cy + 72], radius=6, fill=PAGE, outline=GRAY3, width=2)
        d.text((cx + 14, cy + 55), "Makan (5/hari)", font=f_n, fill=INK)
        cy += 84
    else:
        d.rounded_rectangle([cx, cy, cx + cw, cy + 40], radius=8, fill=WHITE, outline=GRAY3, width=2)
        d.text((cx + 8, cy + 6), "Notif: promo GI -20%", font=f_n, fill=GRAY)
        d.text((cx + 8, cy + 22), "(butuh tabel notif)", font=f_n, fill=GRAY)
        cy += 48
    d.rounded_rectangle([cx, cy, cx + cw, cy + 104], radius=8, fill=WHITE, outline=GRAY3, width=2)
    d.text((cx + 8, cy + 4), "ACCOUNT HUB", font=f_n, fill=GRAY)
    for j, a in enumerate(["Login/Daftar", "Riwayat/Wishlist", "Hubungi (WA)", "Tentang"]):
        d.text((cx + 8, cy + 22 + j * 20), a, font=f_n, fill=INK)
    cy += 112
    d.rounded_rectangle([cx, cy, cx + cw, cy + 36], radius=6, fill=(255, 241, 242) if oid == "U1" else ((240, 253, 244) if oid == "E1" else PAGE), outline=GRAY3, width=2)
    d.text((cx + 6, cy + 4), note, font=f_n, fill=(225, 29, 72) if oid == "U1" else ((21, 128, 61) if oid == "E1" else GRAY))
    # nav
    ny = y + PH - 78
    if style == "ink":
        d.rounded_rectangle([cx, ny, cx + cw, ny + 66], radius=10, fill=INK)
        tc, ac = GRAY2, LIME
    else:
        d.rounded_rectangle([cx, ny, cx + cw, ny + 66], radius=10, fill=WHITE, outline=GRAY3, width=2)
        tc, ac = GRAY, INK
    n = len(names)
    for k, nm in enumerate(names):
        px = cx + (k + 0.5) * cw / n
        if nm in ("Add", "Quiz+"):
            d.ellipse([px - 17, ny + 2, px + 17, ny + 36], fill=INK, outline=WHITE, width=3)
            d.text((px - 5, ny + 7), "+", font=f_m, fill=WHITE)
            d.text((px - 16, ny + 40), nm[:6], font=f_n, fill=tc)
        else:
            d.text((px - 16, ny + 22), nm[:6], font=f_n, fill=ac if k == 0 else tc)

img.save("/home/ubuntu/wikendo-web-app/design/revamp-options-v15-user-idea-compare.png")
print("saved", img.size)
