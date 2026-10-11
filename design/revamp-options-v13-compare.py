"""Render PNG visual explainer v13 multi-voucher (best-1 + sheet + strip).
3 panels side-by-side. ASCII-only labels (PIL load_default tofu rule).
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
ROSEW = (255, 228, 230)
ROSEB = (254, 205, 211)
EMBER = (234, 88, 12)
GREEN = (22, 163, 74)
MINT = (236, 253, 245)
BG = (250, 250, 249)

f_title = ImageFont.load_default(size=28)
f_sub = ImageFont.load_default(size=20)
f_med = ImageFont.load_default(size=21)
f_sml = ImageFont.load_default(size=18)
f_tny = ImageFont.load_default(size=16)

PW, PH = 340, 720
GX, GY0, GAP = 30, 150, 20
COLS = 3
W = GX * 2 + COLS * PW + (COLS - 1) * GAP
H = GY0 + PH + 40

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

d.text((GX, 20), 'Multi-voucher P0: best-1 + sheet + strip (v13 visual)', font=f_title, fill=INK)
d.text((GX, 56), 'Hero 1 best + link +2 promo | Sheet pilih 1 dari 3 | Strip promo di mall page', font=f_sub, fill=GRAY)
d.text((GX, 84), 'Token lock paper/ink/rose/lime. app/ untouched. Balas: Gas v13', font=f_sub, fill=ROSE)
d.text((GX, 112), 'V13A hero-link | V13B bottom-sheet picker | V13C mall strip', font=f_tny, fill=GRAY)


def top_bar(x, y, left, right):
    d.rounded_rectangle([x, y, x + PW - 20, y + 30], radius=8, fill=WHITE)
    d.text((x + 8, y + 6), left, font=f_tny, fill=INK)
    d.text((x + PW - 130, y + 6), right, font=f_tny, fill=GRAY)
    return y + 36


def hero_head(x, y, w):
    d.rounded_rectangle([x, y, x + 92, y + 20], radius=10, fill=LIME)
    d.text((x + 6, y + 2), 'BEST MATCH', font=f_tny, fill=INK)
    d.rounded_rectangle([x + 98, y, x + 150, y + 20], radius=10, fill=MINT)
    d.text((x + 104, y + 2), 'Halal', font=f_tny, fill=GREEN)
    y += 26
    d.text((x, y), 'Kopi Kekinian GI L2', font=f_sml, fill=INK)
    y += 22
    d.text((x, y), 'kopi aren + kids corner', font=f_tny, fill=GRAY)
    y += 20
    d.text((x, y), '50-100rb kids L2', font=f_tny, fill=INK)
    y += 22
    return y


def gift_banner(x, y, w):
    d.rounded_rectangle([x, y, x + w, y + 64], radius=10, fill=ROSEW, outline=ROSEB, width=2)
    d.text((x + 10, y + 6), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
    d.text((x + 10, y + 28), 'Kopi Kekinian GI L2 hari ini', font=f_tny, fill=GRAY)
    d.rounded_rectangle([x + w - 76, y + 16, x + w - 10, y + 46], radius=13, fill=ROSE)
    d.text((x + w - 64, y + 22), 'Buka', font=f_tny, fill=WHITE)
    return y + 64


def bottom_cta(x, y, w):
    d.rounded_rectangle([x, y, x + w // 2 - 3, y + 32], radius=8, fill=INK)
    d.rounded_rectangle([x + w // 2 + 3, y, x + w, y + 32], radius=8, fill=WHITE, outline=GRAY3, width=2)
    d.text((x + 8, y + 8), 'Maps tenant', font=f_tny, fill=WHITE)
    d.text((x + w // 2 + 12, y + 8), 'Lainnya', font=f_tny, fill=INK)
    return y + 38


def panel_frame(col, oid, name):
    x = GX + col * (PW + GAP)
    y = GY0
    rec = True
    d.rounded_rectangle([x, y, x + PW, y + PH], radius=24, fill=PAGE,
                        outline=ROSE, width=3)
    d.text((x + 12, y + 8), oid + ' - ' + name, font=f_med, fill=ROSE)
    return x + 10, y + 54, PW - 20


# V13A
x, y, w = panel_frame(0, 'V13A', 'Hero best-1 + link')
y = top_bar(x, y, 'Hasil', '5 rekomendasi')
d.text((x, y), 'Quota makan 2/2 GI', font=f_tny, fill=GRAY)
y += 20
bx = x
bw = w
by = y
d.rounded_rectangle([bx, by, bx + bw, by + 480], radius=12, fill=WHITE, outline=GRAY3, width=2)
hx = bx + 10
hw = bw - 20
ht = by + 10
ht = hero_head(hx, ht, hw)
ht = gift_banner(hx, ht, hw) + 6
# more link
d.rounded_rectangle([hx, ht, hx + hw, ht + 32], radius=10, fill=LIME)
d.text((hx + 10, ht + 8), '+2 promo lain di sini lihat', font=f_tny, fill=INK)
ht += 38
d.text((hx, ht), 'best-1 depan sisa di sheet', font=f_tny, fill=GRAY)
ht += 22
ht = bottom_cta(hx, ht, hw)
d.text((hx, ht), '#1 Kopi -20% #2 Bakmi -15%', font=f_tny, fill=INK)

# V13B
x, y, w = panel_frame(1, 'V13B', 'Sheet pilih 1 dari 3')
y = top_bar(x, y, 'Hasil', '5 rekomendasi')
d.text((x, y), 'Quota makan 2/2 GI', font=f_tny, fill=GRAY)
y += 20
bx = x
bw = w
by = y
d.rounded_rectangle([bx, by, bx + bw, by + 560], radius=12, fill=WHITE, outline=GRAY3, width=2)
hx = bx + 10
hw = bw - 20
ht = by + 10
ht = hero_head(hx, ht, hw) + 4
# sheet
d.rounded_rectangle([hx, ht, hx + hw, ht + 300], radius=12, fill=WHITE, outline=INK, width=2)
d.text((hx + 70, ht + 6), '--- handle ---', font=f_tny, fill=GRAY)
d.text((hx + 10, ht + 26), '3 promo Kopi Kekinian', font=f_sml, fill=INK)
d.text((hx + 10, ht + 48), 'Pilih 1  1 transaksi 1 kode', font=f_tny, fill=GRAY)
ry = ht + 70
for i, (t, cap, sel) in enumerate([('-20% Weekday min 50rb', '7/20', True),
                                   ('Free large Weekend 30rb', '12/20', False),
                                   ('Dessert baru gratis 1', '3/10', False)]):
    d.rounded_rectangle([hx + 8, ry, hx + hw - 8, ry + 62], radius=10,
                        fill=(255, 251, 235) if sel else WHITE,
                        outline=INK if sel else GRAY3, width=2)
    # radio
    d.ellipse([hx + 16, ry + 20, hx + 32, ry + 36], outline=INK if sel else GRAY2, width=2)
    if sel:
        d.ellipse([hx + 20, ry + 24, hx + 28, ry + 32], fill=INK)
    d.text((hx + 38, ry + 6), t[:24], font=f_tny, fill=INK)
    d.text((hx + 38, ry + 24), 'sisa ' + cap + ' s/d 23:59', font=f_tny, fill=(154, 52, 18))
    d.rounded_rectangle([hx + hw - 78, ry + 30, hx + hw - 16, ry + 54], radius=10, fill=ROSE)
    d.text((hx + hw - 66, ry + 36), 'Klaim', font=f_tny, fill=WHITE)
    ry += 68
d.text((hx + 10, ry + 4), '1 tenant 1x/hari login wajib', font=f_tny, fill=GRAY)

# V13C
x, y, w = panel_frame(2, 'V13C', 'Strip promo di mall')
y = top_bar(x, y, 'Home / Mall / GI', '40 tenant')
d.text((x, y), 'Grand Indonesia curated', font=f_sml, fill=INK)
y += 24
d.text((x, y), 'Direktori tanpa login/quota', font=f_tny, fill=GRAY)
y += 22
bx = x
bw = w
by = y
d.rounded_rectangle([bx, by, bx + bw, by + 340], radius=12, fill=WHITE, outline=GRAY3, width=2)
hx = bx + 10
hw = bw - 20
ht = by + 10
d.text((hx, ht), 'Promo hari ini di GI (7)', font=f_sml, fill=INK)
ht += 24
d.text((hx, ht), 'Weekday filler s/d 23:59 tap tenant', font=f_tny, fill=GRAY)
ht += 22
for i, (em, nm, sub) in enumerate([('K', 'Kopi Kekinian -20%', 'L2 Halal sisa 7/20'),
                                   ('B', 'Bakmi GM -15%', 'L1 Halal sisa 11/20'),
                                   ('J', 'J.CO -10%', 'LG Halal sisa 5/15')]):
    d.rounded_rectangle([hx, ht, hx + 30, ht + 30], radius=8, fill=INK if i == 0 else (ROSE if i == 1 else EMBER))
    d.text((hx + 10, ht + 6), em, font=f_tny, fill=WHITE)
    d.text((hx + 38, ht + 2), nm, font=f_tny, fill=INK)
    d.text((hx + 38, ht + 18), sub, font=f_tny, fill=GRAY)
    d.text((hx + hw - 52, ht + 8), 'Lihat', font=f_tny, fill=INK)
    ht += 38
d.text((hx, ht + 6), 'Section bukan page SEO aman', font=f_tny, fill=GRAY)

img.save('/home/ubuntu/wikendo-web-app/design/revamp-options-v13-compare.png')
print('saved design/revamp-options-v13-compare.png', img.size)
