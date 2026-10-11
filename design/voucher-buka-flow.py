"""Render flowchart PNG: alur klik Buka -> di voucher gift (result-makan).
Sumber kode: app/pages/result-makan.vue baris 32-39 (gift hero + note), 107-109 (claim()).
Token: paper #F5F5F4, ink #0C0A09, accent orange, red/green branches. ASCII-only labels."""
from PIL import Image, ImageDraw, ImageFont

W = 1200
M = 40
PAPER = (245, 245, 244)
INK = (12, 10, 9)
WHITE = (255, 255, 255)
GRAY_B = (214, 211, 209)
ACC_BG = (255, 247, 237)
ACC_B = (249, 115, 22)
RED_BG = (254, 242, 242)
RED_B = (239, 68, 68)
RED_T = (153, 27, 27)
GRN_BG = (240, 253, 244)
GRN_B = (34, 197, 94)
GRN_T = (22, 101, 52)
NOTE_T = (194, 65, 12)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_title = ImageFont.truetype(FB, 32)
f_sub = ImageFont.truetype(FR, 21)
f_box = ImageFont.truetype(FR, 24)
f_bold = ImageFont.truetype(FB, 24)
f_small = ImageFont.truetype(FR, 20)
f_lane = ImageFont.truetype(FB, 17)


def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(" "), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if draw.textlength(t, font=font) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


img = Image.new("RGB", (W, 2000), PAPER)
d = ImageDraw.Draw(img)
y = 0


def arrow(x1, y1, x2, y2, color=INK, width=3, label=""):
    d.line([x1, y1, x2, y2], fill=color, width=width)
    d.polygon([x2, y2, x2 - 11, y2 - 7, x2 - 11, y2 + 7], fill=color)
    if label:
        d.text((x2 + 12, (y1 + y2) / 2 - 14), label, font=f_small, fill=color)


def box(top, lane, lines_bold, lines, bg, border, text_color, bw=4):
    global y
    x0, x1 = M, W - M
    inner_w = x1 - x0 - 48
    all_lines = []
    if lane:
        all_lines.append(("lane", lane))
    for ln in lines_bold:
        for wl in wrap(d, ln, f_bold, inner_w):
            all_lines.append(("b", wl))
    for ln in lines:
        for wl in wrap(d, ln, f_box, inner_w):
            all_lines.append(("n", wl))
    lh = lambda k: 30 if k == "lane" else 36
    h = sum(lh(k) for k, _ in all_lines) + 40
    d.rounded_rectangle([x0, top, x1, top + h], radius=18, fill=bg, outline=border, width=bw)
    cy = top + 22
    for k, t in all_lines:
        if k == "lane":
            d.text((x0 + 24, cy), t, font=f_lane, fill=NOTE_T if bg == WHITE else text_color)
            cy += 30
        elif k == "b":
            d.text((x0 + 24, cy), t, font=f_bold, fill=text_color)
            cy += 36
        else:
            d.text((x0 + 24, cy), t, font=f_box, fill=text_color)
            cy += 36
    return top + h


# Title bar
d.rectangle([0, 0, W, 132], fill=INK)
d.text((M, 22), "Alur klik Buka di voucher gift (result-makan)", font=f_title, fill=WHITE)
d.text((M, 72), "claim() selalu wall login | NOL API call | 11 Okt 2026", font=f_sub, fill=(214, 211, 209))
y = 162

y = box(y, "", ["START: user tap Buka -> di gift hero"], ["Banner: Ada -20% buat lu (The Harvest / Kopi Kekinian dkk)."], INK, INK, WHITE) + 26
y_start_mid = y  # not needed
prev_bottom = y - 26
arrow(W // 2, prev_bottom, W // 2, prev_bottom + 26)
y = box(y, "[BROWSER]", ["claim() jalan (result-makan.vue:107-109)"], ["Murni client-side: NOL fetch, NOL API, NOL ubah quota, NOL redirect."], WHITE, GRAY_B, INK) + 26
arrow(W // 2, y - 26, W // 2, y)
y = box(y, "[BROWSER]", ["claimNote diset (wall anti-farming)"], ['Isi: "Login 10 detik untuk klaim voucher - anti-farming, gratis."'], WHITE, GRAY_B, INK) + 26
arrow(W // 2, y - 26, W // 2, y)
y = box(y, "[BROWSER]", ["Note orange tampil di bawah gift"], ["claimed tetap kosong = NOL kode voucher keluar. (baris 38-39)"], WHITE, GRAY_B, INK) + 26

# Diamond
dw, dh = 660, 210
cx = W // 2
arrow(cx, y - 26, cx, y)
d.polygon([cx, y, cx + dw // 2, y + dh // 2, cx, y + dh, cx - dw // 2, y + dh // 2],
          fill=ACC_BG, outline=ACC_B, width=4)
qlines = ["User login lalu", "tap Buka lagi?"]
qy = y + dh // 2 - len(qlines) * 18
for ql in qlines:
    tw = d.textlength(ql, font=f_bold)
    d.text((cx - tw / 2, qy), ql, font=f_bold, fill=INK)
    qy += 36
y = y + dh + 8

# BELUM branch (red) — arrow from diamond bottom-left area
arrow(cx - 120, y - 8, cx - 120, y + 18, color=RED_B, label="BELUM")
y = box(y + 18, "", ["BELUM login: stay di halaman"], ["Note orange tetap tampil. NOL API call, quota utuh, NOL redirect. Tap lagi kapan pun bisa (loop ke START)."], RED_BG, RED_B, RED_T) + 26
red_bottom = y - 26
# loop-back rail on left
rail_x = 18
d.line([rail_x, red_bottom - 20, rail_x, 190], fill=RED_B, width=3)
d.polygon([M, 190, M - 12, 190 - 7, M - 12, 190 + 7], fill=RED_B)
txt, tx, ty = "loop", rail_x + 8, (red_bottom + 190) / 2
bb = d.textbbox((tx, ty), txt, font=f_small)
d.rectangle([bb[0] - 4, bb[1] - 2, bb[2] + 4, bb[3] + 2], fill=PAPER)
d.text((tx, ty), txt, font=f_small, fill=RED_B)

# SUDAH branch (green)
arrow(cx + 120, red_bottom + 8, cx + 120, red_bottom + 34, color=GRN_B, label="SUDAH")
y = box(red_bottom + 34, "", ["SUDAH login + tap lagi: lanjut ke bawah"], [], GRN_BG, GRN_B, GRN_T) + 26
arrow(W // 2, y - 26, W // 2, y)
y = box(y, "[GAP JUJUR]", ["Kode belum cek session (isLoggedIn hardcode false)"], ["User login pun TETAP kena wall note. Belum ada: generate kode voucher, INSERT klaim, redirect. Menunggu auth slice."], WHITE, RED_B, INK) + 30

# Footer
foot = "Tidak dicover chart: tombol Save (pesan sendiri) | Maps tenant (link Google Maps eksternal) | klaim WAJIB login = anti-farming."
for wl in wrap(d, foot, f_small, W - 2 * M):
    d.text((M, y), wl, font=f_small, fill=(87, 83, 80))
    y += 28
y += 24

img = img.crop((0, 0, W, y + 10))
out = "/home/ubuntu/wikendo-web-app/design/voucher-buka-flow-2026-10-11.png"
img.save(out)
print("SAVED", out, img.size)
