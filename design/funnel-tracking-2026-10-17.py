"""Render funnel-tracking explainer PNG -> design/funnel-tracking-2026-10-17.png
WHAT: tracking funnel Wikendo (share -> kunjungan -> quiz -> hasil -> klaim) + event GA4 mana yang mengukur tiap langkah.
WHY: Agesta asked "Tracking funnel itu apa?" - visual-first stakeholder, text-only fails (SOP 10).
Sumber: app/plugins/gtag.client.ts (plugin wired, no-op tanpa gaId) + docs/25 (event quiz_start/result_view/voucher_claim = P1 belum).
ASCII-only labels; tokens: paper #F5F5F4, ink #0C0A09, lime, ember, red/green branches."""
from PIL import Image, ImageDraw, ImageFont

W = 1200
M = 40
PAPER = (245, 245, 244)
INK = (12, 10, 9)
WHITE = (255, 255, 255)
GRAY = (87, 83, 78)
GRAY_L = (120, 113, 108)
GRAY_B = (214, 211, 209)
EMBER = (234, 88, 12)
EMBER_BG = (255, 247, 237)
RED_BG = (254, 242, 242)
RED_B = (239, 68, 68)
RED_T = (153, 27, 27)
GRN_BG = (240, 253, 244)
GRN_B = (34, 197, 94)
GRN_T = (22, 101, 52)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_title = ImageFont.truetype(FB, 31)
f_sub = ImageFont.truetype(FR, 20)
f_bold = ImageFont.truetype(FB, 23)
f_box = ImageFont.truetype(FR, 20)
f_small = ImageFont.truetype(FR, 17)
f_tiny = ImageFont.truetype(FB, 15)
f_lane = ImageFont.truetype(FB, 16)
f_ev = ImageFont.truetype(FB, 21)

img = Image.new("RGB", (W, 1800), PAPER)
d = ImageDraw.Draw(img)


def wrap(text, font, maxw):
    words, lines, cur = text.split(" "), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if d.textlength(t, font=font) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def badge(x, cy, text, bg, border, tc):
    tw = d.textlength(text, font=f_tiny)
    pad = 12
    bw = tw + pad * 2
    d.rounded_rectangle([x, cy - 13, x + bw, cy + 13], radius=13, fill=bg, outline=border, width=2)
    d.text((x + pad, cy - 8), text, font=f_tiny, fill=tc)
    return x + bw


def arrow_down(x, y1, y2, color=INK):
    d.line([x, y1, x, y2 - 10], fill=color, width=3)
    d.polygon([x, y2, x - 8, y2 - 12, x + 8, y2 - 12], fill=color)


# ---- Title bar ----
d.rectangle([0, 0, W, 128], fill=INK)
d.text((M, 20), "Tracking Funnel Wikendo", font=f_title, fill=WHITE)
d.text((M, 68), "share -> kunjungan -> quiz -> hasil -> klaim voucher  |  angka = ilustrasi  |  17 Okt 2026", font=f_sub, fill=(214, 211, 209))

y = 178
LU = 40            # left edge semua stage box
COL_X = 800        # kolom kanan GA4
COL_LINE = 782

stages = [
    dict(n="1. SHARE", lane="DI LUAR WEB", t="Link di-share: IG story/bio, TikTok, grup WA", s="contoh: 1.000 orang lihat postingan", w=720),
    dict(n="2. KUNJUNGAN", lane="DI WEB - TERUKUR", t="Klik link -> buka wikendo.id (home / /quiz / /mall/xxx)", s="contoh: 320 klik masuk (32%)", w=660),
    dict(n="3. QUIZ MULAI", lane="DI WEB - TERUKUR", t="Pilih Cari Tempat (/quiz) atau Cari Makan (/food)", s="contoh: 150 mulai quiz (47%)", w=600),
    dict(n="4. LIHAT HASIL", lane="DI WEB - TERUKUR", t="Rekomendasi tempat / makanan muncul", s="contoh: 90 lihat hasil (60%)", w=540),
    dict(n="5. KLAIM VOUCHER", lane="DI WEB - TERUKUR", t="Klaim voucher -> POST /api/voucher/claim", s="contoh: 25 klaim (28%)", w=480),
]

gaps = ["32% klik", "47% mulai quiz", "60% lanjut", "28% klaim"]
events = [
    ("Tidak terukur di web", None, "share terjadi di IG/TikTok, di luar jangkauan GA", GRAY_L),
    ("page_view", ("AKTIF OTOMATIS", GRN_BG, GRN_B, GRN_T), "plus asal channel (referrer / UTM)", INK),
    ("quiz_start", ("P1 - BELUM", RED_BG, RED_B, RED_T), "harus dipasang manual di kode", INK),
    ("result_view", ("P1 - BELUM", RED_BG, RED_B, RED_T), "harus dipasang manual di kode", INK),
    ("voucher_claim", ("P1 - BELUM", RED_BG, RED_B, RED_T), "harus dipasang manual di kode", INK),
]

centers = []
for i, st in enumerate(stages):
    h = 134
    x0, x1 = LU, LU + st["w"]
    d.rounded_rectangle([x0, y, x1, y + h], radius=16, fill=WHITE, outline=INK, width=3)
    d.text((x0 + 22, y + 14), st["lane"], font=f_lane, fill=EMBER)
    d.text((x0 + 22, y + 40), st["n"], font=f_bold, fill=INK)
    d.text((x0 + 22, y + 76), st["t"], font=f_box, fill=INK)
    d.text((x0 + 22, y + 104), st["s"], font=f_small, fill=GRAY_L)
    centers.append(y + h // 2)
    if i < len(gaps):
        arrow_down(LU + 55, y + h + 4, y + h + 50)
        d.text((LU + 75, y + h + 14), gaps[i], font=f_small, fill=GRAY)
    y += h + 54

# ---- Kolom kanan GA4 ----
d.text((COL_X, 176), "YANG KEUKUR DI GA4", font=f_lane, fill=INK)
d.line([COL_LINE, 200, COL_LINE, y - 54], fill=GRAY_B, width=2)
for i, (name, bdg, sub, tc) in enumerate(events):
    cy = centers[i]
    d.text((COL_X, cy - 30), name, font=f_ev, fill=tc)
    if bdg:
        badge(COL_X, cy + 4, bdg[0], bdg[1], bdg[2], bdg[3])
    for k, ln in enumerate(wrap(sub, f_small, W - M - COL_X)):
        d.text((COL_X, cy + 26 + k * 22), ln, font=f_small, fill=GRAY_L)
# ---- Kenapa penting ----
y += 26
h = 176
d.rounded_rectangle([M, y, W - M, y + h], radius=16, fill=WHITE, outline=INK, width=3)
d.text((M + 22, y + 16), "KENAPA PENTING (buat bisnis):", font=f_bold, fill=INK)
lines = [
    "1. Ketahuan step yang bocor paling parah -> fix step itu dulu, nggak nebak-nebak.",
    "2. Ketahuan channel juara (IG vs TikTok vs WA) -> double down yang paling banyak claim.",
    "3. CAC organik jadi angka nyata (biaya akuisisi per channel) -> dasar keputusan budget.",
]
for j, ln in enumerate(lines):
    d.text((M + 22, y + 54 + j * 36), ln, font=f_box, fill=INK)
y += h + 30

# ---- Status Wikendo (gap note) ----
h = 176
d.rounded_rectangle([M, y, W - M, y + h], radius=16, fill=EMBER_BG, outline=EMBER, width=3)
d.text((M + 22, y + 16), "STATUS WIKENDO HARI INI:", font=f_bold, fill=EMBER)
lines = [
    "Plugin GA4 sudah wired -- tapi no-op sampai NUXT_PUBLIC_GA_ID di-set di Vercel (2 menit).",
    "Begitu di-set: page_view + asal channel otomatis kerekam, tanpa ubah kode.",
    "quiz_start / result_view / voucher_claim BELUM diimplement (P1) -> funnel baru keukur separuh jalan.",
]
for j, ln in enumerate(lines):
    d.text((M + 22, y + 54 + j * 36), ln, font=f_box, fill=INK)

end_y = y + h + 36
img = img.crop((0, 0, W, end_y))
img.save("/home/ubuntu/wikendo-web-app/design/funnel-tracking-2026-10-17.png")
print("saved", img.size)
