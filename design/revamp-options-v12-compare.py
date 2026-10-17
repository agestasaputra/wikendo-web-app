"""Render PNG perbandingan 20 opsi voucher-claim (result-food full page) untuk review Telegram.

Grid 4 kolom x 5 baris. Tiap panel = top bar + quota + hero + gift variant + Maps/Lainnya + rank.
CATATAN FONT: PIL load_default hanya aman ASCII — semua label ASCII-only.
"""
from PIL import Image, ImageDraw, ImageFont

INK = (12, 10, 9)
PAGE = (245, 245, 244)
WHITE = (255, 255, 255)
GRAY = (120, 113, 108)
GRAY2 = (214, 211, 209)
GRAY3 = (231, 229, 228)
LIME = (163, 230, 53)
LIMELIGHT = (217, 249, 157)
ROSE = (225, 29, 72)
ROSEW = (255, 228, 230)
ROSEB = (254, 205, 211)
EMBER = (234, 88, 12)
EMBERW = (255, 247, 237)
GREEN = (22, 163, 74)
GREENW = (240, 253, 244)
REDD = (220, 38, 38)
MINT = (236, 253, 245)
BG = (250, 250, 249)

f_title = ImageFont.load_default(size=28)
f_sub = ImageFont.load_default(size=20)
f_med = ImageFont.load_default(size=21)
f_sml = ImageFont.load_default(size=18)
f_tny = ImageFont.load_default(size=16)

# id, name, gift-kind, fam, effort
OPTS = [
 ('VC1', 'Gift-inline live+', 'banner', 'minimal', 'S 1h'),
 ('VC2', 'Gift-compact row', 'compact', 'minimal', 'S 1h'),
 ('VC3', 'Outline kalem', 'outline', 'minimal', 'S 1h'),
 ('VC4', 'Buka fullwidth 56px', 'fullbtn', 'minimal', 'S 1h'),
 ('VC5', 'Code-expand REC', 'code', 'code', 'S 1.5h'),
 ('VC6', 'Dashed-ticket', 'ticket', 'code', 'S 1.5h'),
 ('VC7', 'Code + Salin', 'copy', 'code', 'S 1.5h'),
 ('VC8', 'Sticky code bar', 'sticky', 'code', 'S 2h'),
 ('VC9', 'Countdown-hero', 'count', 'urgency', 'S 1.5h'),
 ('VC10', 'Slot-hari 3/3', 'slot', 'urgency', 'S 1.5h'),
 ('VC11', 'Already-claimed', 'done', 'urgency', 'S 1h'),
 ('VC12', 'Expired-safe', 'exp', 'urgency', 'S 1h'),
 ('VC13', 'Cara-pakai steps', 'steps', 'trust', 'S 1.5h'),
 ('VC14', 'Struk Mono', 'receipt', 'trust', 'S 2h'),
 ('VC15', 'Proof-row', 'proof', 'trust', 'S 2h'),
 ('VC16', 'Halal+promo lock', 'trust', 'trust', 'S 1h'),
 ('VC17', 'Bottom-sheet', 'sheet', 'convert', 'M 3h'),
 ('VC18', 'Login-blur', 'blur', 'convert', 'S 2h'),
 ('VC19', 'Save+klaim duo', 'duo', 'convert', 'S 2h'),
 ('VC20', 'Kasir-mode link', 'kasir', 'convert', 'S 1.5h'),
]

FAM_COLOR = {'minimal': GRAY, 'code': ROSE, 'urgency': EMBER, 'trust': GREEN, 'convert': (147, 51, 234)}

PW, PH = 320, 660
GX, GY0, GAP = 30, 150, 20
COLS = 4
W = GX * 2 + COLS * PW + (COLS - 1) * GAP
ROWS = 5
H = GY0 + ROWS * PH + ROWS * GAP + 30

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

d.text((GX, 20), 'Voucher-claim: 20 opsi UI klaim show-to-cashier (P0 S4)', font=f_title, fill=INK)
d.text((GX, 56), 'Hero: Kopi Kekinian GI L2 Halal. Kode WKD-7X2K9A s/d 23:59 WIB. Login wajib.', font=f_sub, fill=GRAY)
d.text((GX, 84), 'Rekomendasi: VC5 code-expand. Balas: Gua suka [ID]. Token lock, app/ untouched.', font=f_sub, fill=ROSE)
d.text((GX, 112), 'Minimal VC1-4 | Kode VC5-8 | Urgency VC9-12 | Trust VC13-16 | Convert VC17-20', font=f_tny, fill=GRAY)


def gift_box(x, top, w, kind):
    """Draw gift variant inside hero. Returns new top."""
    if kind == 'banner':
        d.rounded_rectangle([x, top, x + w, top + 64], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 6), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 28), 'Kopi Kekinian GI L2 hari ini', font=f_tny, fill=GRAY)
        d.rounded_rectangle([x + w - 76, top + 16, x + w - 10, top + 46], radius=13, fill=ROSE)
        d.text((x + w - 64, top + 22), 'Buka', font=f_tny, fill=WHITE)
        d.text((x + 10, top + 48), '', font=f_tny, fill=GRAY)
        return top + 64 + 18
    if kind == 'compact':
        d.rounded_rectangle([x, top, x + w, top + 44], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 12), '-20% Kopi Kekinian s/d 23:59', font=f_tny, fill=INK)
        d.rounded_rectangle([x + w - 66, top + 8, x + w - 10, top + 36], radius=13, fill=ROSE)
        d.text((x + w - 54, top + 14), 'Buka', font=f_tny, fill=WHITE)
        return top + 44 + 8
    if kind == 'outline':
        d.rounded_rectangle([x, top, x + w, top + 64], radius=10, fill=WHITE, outline=ROSEB, width=2)
        d.text((x + 10, top + 6), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 28), 'Kopi Kekinian GI L2 hari ini', font=f_tny, fill=GRAY)
        d.rounded_rectangle([x + w - 76, top + 16, x + w - 10, top + 46], radius=13, fill=ROSE)
        d.text((x + w - 64, top + 22), 'Buka', font=f_tny, fill=WHITE)
        return top + 64 + 8
    if kind == 'fullbtn':
        d.rounded_rectangle([x, top, x + w, top + 52], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2 hari ini', font=f_tny, fill=GRAY)
        top += 60
        d.rounded_rectangle([x, top, x + w, top + 44], radius=10, fill=ROSE)
        d.text((x + 14, top + 12), 'Buka voucher -20%', font=f_sml, fill=WHITE)
        return top + 44 + 8
    if kind == 'code':
        d.rounded_rectangle([x, top, x + w, top + 118], radius=10, fill=INK)
        d.text((x + 10, top + 6), 'KODE LU / TUNJUKIN KE KASIR', font=f_tny, fill=WHITE)
        f_code = ImageFont.load_default(size=30)
        d.text((x + 10, top + 26), 'WKD-7X2K9A', font=f_code, fill=LIME)
        d.text((x + 10, top + 62), 'berlaku s/d 23:59 WIB', font=f_tny, fill=WHITE)
        d.text((x + 10, top + 80), '1 kode = 1 transaksi', font=f_tny, fill=GRAY2)
        d.rounded_rectangle([x + 10, top + 96, x + 190, top + 112], radius=8, fill=ROSE)
        return top + 118 + 8
    if kind == 'ticket':
        for xx in range(int(x), int(x + w), 14):
            d.line([xx, top, xx + 7, top], fill=ROSE, width=2)
        d.rounded_rectangle([x, top + 4, x + w, top + 108], radius=10, fill=WHITE, outline=ROSEB, width=2)
        d.text((x + 10, top + 10), '-20% KOPI KEKINIAN GI L2', font=f_tny, fill=ROSE)
        f_code = ImageFont.load_default(size=26)
        d.text((x + 10, top + 30), 'WKD-7X2K9A', font=f_code, fill=INK)
        d.text((x + 10, top + 62), 's/d 23:59 tunjukin kasir', font=f_tny, fill=GRAY)
        d.rounded_rectangle([x + 10, top + 80, x + 90, top + 100], radius=10, fill=ROSE)
        d.text((x + 20, top + 84), 'Buka', font=f_tny, fill=WHITE)
        return top + 108 + 8
    if kind == 'copy':
        d.rounded_rectangle([x, top, x + w, top + 64], radius=10, fill=INK)
        f_code = ImageFont.load_default(size=24)
        d.text((x + 10, top + 12), 'WKD-7X2K9A', font=f_code, fill=LIME)
        d.rounded_rectangle([x + w - 70, top + 14, x + w - 10, top + 44], radius=8, fill=WHITE)
        d.text((x + w - 58, top + 20), 'Salin', font=f_tny, fill=INK)
        d.text((x, top + 68), 's/d 23:59 tempel WA / kasir', font=f_tny, fill=GRAY)
        return top + 64 + 22
    if kind == 'sticky':
        d.rounded_rectangle([x, top, x + w, top + 56], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 64
        d.rounded_rectangle([x, top, x + w, top + 44], radius=10, fill=INK)
        d.text((x + 10, top + 12), 'WKD-7X2K9A s/d 23:59', font=f_tny, fill=LIME)
        return top + 44 + 8
    if kind == 'count':
        d.rounded_rectangle([x, top, x + w, top + 108], radius=10, fill=EMBERW, outline=(253, 186, 116), width=2)
        d.text((x + 10, top + 6), 'BERAKHIR 23:59 WIB', font=f_tny, fill=(154, 52, 18))
        f_big = ImageFont.load_default(size=30)
        d.text((x + 10, top + 24), '5j 12m', font=f_big, fill=(194, 65, 12))
        d.text((x + 10, top + 60), 'WKD-7X2K9A tunjukin kasir', font=f_tny, fill=(154, 52, 18))
        d.rounded_rectangle([x + 10, top + 82, x + w - 10, top + 90], radius=4, fill=(254, 215, 170))
        d.rounded_rectangle([x + 10, top + 82, x + 10 + int((w - 20) * 0.64), top + 90], radius=4, fill=EMBER)
        return top + 108 + 8
    if kind == 'slot':
        d.rounded_rectangle([x, top, x + w, top + 96], radius=10, fill=WHITE, outline=GRAY3, width=2)
        d.text((x + 10, top + 8), 'Sisa klaim hari ini: 3', font=f_sml, fill=INK)
        bx = x + 10
        for i in range(5):
            d.rounded_rectangle([bx, top + 34, bx + 26, top + 42], radius=4, fill=LIME if i < 3 else GRAY3)
            bx += 32
        d.text((x + 10, top + 50), 'max 3/hari 1 tenant 1x login', font=f_tny, fill=GRAY)
        d.rounded_rectangle([x + 10, top + 68, x + 90, top + 88], radius=10, fill=ROSE)
        d.text((x + 22, top + 72), 'Buka', font=f_tny, fill=WHITE)
        return top + 96 + 8
    if kind == 'done':
        d.rounded_rectangle([x, top, x + w, top + 96], radius=10, fill=GREENW, outline=(134, 239, 172), width=2)
        d.text((x + 10, top + 8), 'LU UDAH KLAIM HARI INI', font=f_tny, fill=GREEN)
        f_code = ImageFont.load_default(size=24)
        d.text((x + 10, top + 28), 'WKD-7X2K9A', font=f_code, fill=INK)
        d.text((x + 10, top + 58), 'tunjukin kode ini s/d 23:59', font=f_tny, fill=GREEN)
        return top + 96 + 8
    if kind == 'exp':
        d.rounded_rectangle([x, top, x + w, top + 64], radius=10, fill=(244, 244, 245), outline=GRAY3, width=2)
        d.text((x + 10, top + 10), 'Voucher kemarin habis', font=f_sml, fill=GRAY)
        d.text((x + 10, top + 34), 'Besok lagi ya quiz lagi', font=f_tny, fill=GRAY)
        return top + 64 + 8
    if kind == 'steps':
        d.rounded_rectangle([x, top, x + w, top + 52], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 60
        d.rounded_rectangle([x, top, x + w, top + 92], radius=10, fill=WHITE, outline=GRAY3, width=2)
        d.text((x + 10, top + 6), '1 Klaim jadi WKD-XXXXXX', font=f_tny, fill=INK)
        d.text((x + 10, top + 28), '2 Tunjukin ke kasir GI L2', font=f_tny, fill=INK)
        d.text((x + 10, top + 50), '3 Kasir input cap lunas', font=f_tny, fill=INK)
        return top + 92 + 8
    if kind == 'receipt':
        d.rounded_rectangle([x, top, x + w, top + 104], radius=10, fill=WHITE, outline=GRAY3, width=2)
        d.text((x + 10, top + 6), 'WIKENDO * GI L2', font=f_tny, fill=INK)
        f_code = ImageFont.load_default(size=24)
        d.text((x + 10, top + 24), 'WKD-7X2K9A', font=f_code, fill=INK)
        d.text((x + 10, top + 54), '-20% KOPI KEKINIAN', font=f_tny, fill=INK)
        d.text((x + 10, top + 72), 'EXP 23:59 WIB', font=f_tny, fill=INK)
        return top + 104 + 8
    if kind == 'proof':
        d.rounded_rectangle([x, top, x + w, top + 56], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 64
        d.rounded_rectangle([x, top, x + w, top + 40], radius=10, fill=MINT, outline=(134, 239, 172), width=2)
        d.text((x + 10, top + 10), '127 diklaim minggu ini di GI', font=f_tny, fill=GREEN)
        return top + 40 + 8
    if kind == 'trust':
        d.rounded_rectangle([x, top, x + w, top + 84], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% Halal -20%', font=f_sml, fill=INK)
        d.text((x + 10, top + 32), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        d.rounded_rectangle([x + 10, top + 52, x + 90, top + 74], radius=11, fill=ROSE)
        d.text((x + 22, top + 56), 'Buka', font=f_tny, fill=WHITE)
        d.text((x + 100, top + 56), 's/d 23:59 1x pakai', font=f_tny, fill=GRAY)
        return top + 84 + 8
    if kind == 'sheet':
        d.rounded_rectangle([x, top, x + w, top + 52], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 60
        d.rounded_rectangle([x, top, x + w, top + 96], radius=12, fill=WHITE, outline=INK, width=2)
        d.line([x + 60, top + 8, x + w - 60, top + 8], fill=GRAY, width=3)
        d.text((x + 10, top + 16), 'GESER ATAS KODE LU', font=f_tny, fill=GRAY)
        f_code = ImageFont.load_default(size=24)
        d.text((x + 10, top + 34), 'WKD-7X2K9A', font=f_code, fill=INK)
        d.text((x + 10, top + 64), 's/d 23:59 Tunjukin kasir', font=f_tny, fill=INK)
        return top + 96 + 8
    if kind == 'blur':
        d.rounded_rectangle([x, top, x + w, top + 100], radius=10, fill=INK)
        d.text((x + 10, top + 8), 'KODE LU TERKUNCI', font=f_tny, fill=GRAY2)
        f_code = ImageFont.load_default(size=24)
        d.text((x + 10, top + 28), 'WKD-XXXXXX', font=f_code, fill=GRAY)
        d.rounded_rectangle([x + 10, top + 60, x + w - 10, top + 90], radius=10, fill=ROSE)
        d.text((x + 20, top + 68), 'Login 10 dtk untuk buka', font=f_tny, fill=WHITE)
        return top + 100 + 8
    if kind == 'duo':
        d.rounded_rectangle([x, top, x + w, top + 52], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 60
        d.rounded_rectangle([x, top, x + w // 2 - 3, top + 40], radius=10, fill=WHITE, outline=GRAY3, width=2)
        d.rounded_rectangle([x + w // 2 + 3, top, x + w, top + 40], radius=10, fill=ROSE)
        d.text((x + 14, top + 12), 'Simpan', font=f_tny, fill=INK)
        d.text((x + w // 2 + 20, top + 12), 'Buka', font=f_tny, fill=WHITE)
        return top + 40 + 8
    if kind == 'kasir':
        d.rounded_rectangle([x, top, x + w, top + 56], radius=10, fill=ROSEW, outline=ROSEB, width=2)
        d.text((x + 10, top + 8), 'Gift  Ada -20% buat lu', font=f_sml, fill=INK)
        d.text((x + 10, top + 30), 'Kopi Kekinian GI L2', font=f_tny, fill=GRAY)
        top += 64
        d.rounded_rectangle([x, top, x + w, top + 44], radius=10, fill=WHITE, outline=GRAY2, width=2)
        d.text((x + 10, top + 12), 'owner? /t/kopi demo kasir', font=f_tny, fill=GRAY)
        return top + 44 + 8
    return top + 8


def panel(col, row, opt):
    oid, name, gift, fam, effort = opt
    x = GX + col * (PW + GAP)
    y = GY0 + row * (PH + GAP)
    rec = (oid == 'VC5')
    d.rounded_rectangle([x, y, x + PW, y + PH], radius=24, fill=PAGE,
                        outline=ROSE if rec else GRAY3, width=3 if rec else 2)
    d.text((x + 12, y + 8), oid + ' - ' + name[:22], font=f_med, fill=ROSE if rec else INK)
    d.text((x + 12, y + 32), fam + ' / ' + effort, font=f_tny, fill=FAM_COLOR[fam])
    top = y + 54

    # top bar
    d.rounded_rectangle([x + 10, top, x + PW - 10, top + 30], radius=8, fill=WHITE)
    d.text((x + 16, top + 6), 'Hasil', font=f_tny, fill=INK)
    d.text((x + PW - 110, top + 6), '5 rekomendasi', font=f_tny, fill=GRAY)
    top += 36
    d.text((x + 10, top), 'Quota makan 2/2 GI', font=f_tny, fill=GRAY)
    top += 20

    # hero card
    d.rounded_rectangle([x + 10, top, x + PW - 10, top + 470], radius=12, fill=WHITE, outline=GRAY3, width=2)
    hx = x + 20
    hw = PW - 40
    ht = top + 10
    d.rounded_rectangle([hx, ht, hx + 92, ht + 20], radius=10, fill=LIME)
    d.text((hx + 6, ht + 2), 'BEST MATCH', font=f_tny, fill=INK)
    d.rounded_rectangle([hx + 98, ht, hx + 150, ht + 20], radius=10, fill=MINT)
    d.text((hx + 104, ht + 2), 'Halal', font=f_tny, fill=GREEN)
    ht += 26
    d.text((hx, ht), 'Kopi Kekinian GI L2', font=f_sml, fill=INK)
    ht += 22
    d.text((hx, ht), 'kopi aren + kids corner', font=f_tny, fill=GRAY)
    ht += 20
    d.text((hx, ht), '50-100rb kids L2', font=f_tny, fill=INK)
    ht += 22
    ht = gift_box(hx, ht, hw, gift)

    # Maps + Lainnya + rank (fixed bottom)
    by = top + 470 - 108
    d.rounded_rectangle([hx, by, hx + hw // 2 - 3, by + 32], radius=8, fill=INK)
    d.rounded_rectangle([hx + hw // 2 + 3, by, hx + hw, by + 32], radius=8, fill=WHITE, outline=GRAY3, width=2)
    d.text((hx + 8, by + 8), 'Maps tenant', font=f_tny, fill=WHITE)
    d.text((hx + hw // 2 + 12, by + 8), 'Lainnya', font=f_tny, fill=INK)
    by += 38
    d.rounded_rectangle([hx, by, hx + hw, by + 56], radius=8, fill=(244, 244, 245))
    d.text((hx + 8, by + 4), '#1 Kopi Kekinian Halal -20%', font=f_tny, fill=INK)
    d.text((hx + 8, by + 22), '#2 Bakmi GM  #3 J.CO', font=f_tny, fill=GRAY)


for i, opt in enumerate(OPTS):
    panel(i % COLS, i // COLS, opt)

img.save('/home/ubuntu/wikendo-web-app/design/revamp-options-v12-compare.png')
print('saved design/revamp-options-v12-compare.png', img.size)
