"""Render PNG -> design/analytics-tools-compare-2026-10-17.png
WHAT: GA4 vs Mixpanel vs PostHog vs Vercel Web Analytics - 2 families (marketing vs product analytics) + free tiers + recommendation buat Wikendo.
WHY: Agesta asked "best practice pakai GA? keunggulannya? Mixpanel sama kayak GA?" - visual-first stakeholder (SOP 10).
Data: riset 17 Okt 2026 (mixpanel.com/pricing, posthog.com/pricing, vercel docs, contentsquare comparison).
ASCII-only; tokens: paper #F5F5F4, ink #0C0A09, ember #EA580C, lime."""
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
LIME = (132, 204, 22)
LIME_BG = (236, 253, 203)
LIME_T = (54, 83, 20)
BLUE = (37, 99, 235)
BLUE_BG = (239, 246, 255)
RED_B = (239, 68, 68)
RED_T = (153, 27, 27)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_title = ImageFont.truetype(FB, 30)
f_sub = ImageFont.truetype(FR, 19)
f_head = ImageFont.truetype(FB, 23)
f_col = ImageFont.truetype(FB, 19)
f_box = ImageFont.truetype(FR, 18)
f_small = ImageFont.truetype(FR, 16)
f_tiny = ImageFont.truetype(FB, 14)

img = Image.new("RGB", (W, 1700), PAPER)
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


# ---- Title ----
d.rectangle([0, 0, W, 126], fill=INK)
d.text((M, 18), "User Analytics Tools: GA4 vs Mixpanel vs PostHog vs Vercel", font=f_title, fill=WHITE)
d.text((M, 66), "2 keluarga tool - jangan ketuker. Data free-tier resmi per 17 Okt 2026", font=f_sub, fill=(214, 211, 209))

y = 166

# ---- Section 1: two families ----
d.text((M, y), "2 KELUARGA BESAR (kenapa bingung milih)", font=f_head, fill=INK)
y += 44
fh = 178
d.rounded_rectangle([M, y, W // 2 - 13, y + fh], radius=16, fill=EMBER_BG, outline=EMBER, width=3)
d.text((M + 20, y + 14), "A. MARKETING / WEB ANALYTICS", font=f_col, fill=EMBER)
for k, t in enumerate([
    "Jawab: user DATANG DARI MANA?",
    "GA4, Vercel Web Analytics",
    "Fokus: channel IG/TikTok/WA, SEO,",
    "campaign, konversi halaman",
]):
    d.text((M + 20, y + 48 + k * 28), t, font=f_box, fill=GRAY)
d.rounded_rectangle([W // 2 + 13, y, W - M, y + fh], radius=16, fill=BLUE_BG, outline=BLUE, width=3)
d.text((W // 2 + 33, y + 14), "B. PRODUCT ANALYTICS", font=f_col, fill=BLUE)
for k, t in enumerate([
    "Jawab: user NGAPAIN DI DALAM app?",
    "Mixpanel, PostHog, Amplitude",
    "Fokus: funnel dalam, retensi, cohort,",
    "sesi replay, A/B test",
]):
    d.text((W // 2 + 33, y + 48 + k * 28), t, font=f_box, fill=GRAY)
y += fh + 30

# ---- Section 2: comparison table ----
d.text((M, y), "PERBANDINGAN (free tier - angka resmi)", font=f_head, fill=INK)
y += 44
cols = [240, 250, 280, 330]
rows = [
    ("Tool", "Gratis sampai", "Paling kuat buat", "Kelemahan"),
    ("Google Analytics 4", "Tanpa limit praktis", "Channel/SEO/campaign +\nkonversi web", "Dangkal buat perilaku\ndalam app; UI ribet"),
    ("Mixpanel", "1 juta event/bulan +\n10rb sesi replay", "Funnel, retensi, cohort\n(paling mateng)", "Butuh tracking manual;\nfree cuma 5 saved report"),
    ("PostHog", "1 juta event/bulan +\n5rb sesi replay", "Funnel + sesi replay +\nfeature flag 1 paket", "1 project, retensi data\n1 tahun di free"),
    ("Vercel Web Analytics", "50rb event/bulan\n(retensi 1 bulan)", "Cek cepat: pageview +\nvisitor + referrer", "Tanpa funnel, tanpa\nevent custom"),
]
rh = 86
x0 = M
# header
d.rectangle([M, y, W - M, y + 44], fill=INK)
cx = M + 16
for i, c in enumerate(rows[0]):
    d.text((cx, y + 11), c, font=f_col, fill=WHITE)
    cx += cols[i]
y += 44
for r in rows[1:]:
    hl = r[0].startswith("Google")
    d.rectangle([M, y, W - M, y + rh], fill=LIME_BG if hl else WHITE, outline=GRAY_B)
    cx = M + 16
    for i, c in enumerate(r):
        if i == 0:
            d.text((cx, y + 12), c, font=f_col, fill=INK)
        else:
            cy = y + 10
            for ln in c.split("\n"):
                d.text((cx, cy), ln, font=f_small, fill=GRAY)
                cy += 24
        cx += cols[i]
    y += rh
y += 30

# ---- Section 3: recommendation ----
boxes = [
    ("STAGE 1 - SEKARANG: GA4", EMBER, EMBER_BG, [
        "Udah ke-wire di Wikendo kemarin - tinggal aktifin (gratis, no limit).",
        "Ini yang jawab: share IG/TikTok/WA mana yang beneran datengin orang?",
        "Best practice industri: GA4 = standar default buat website. SEMUA mulai dari sini.",
    ]),
    ("STAGE 2 - PAS TRAKSI NAIK: tambah 1 product analytics", BLUE, BLUE_BG, [
        "Kalau udah ada ratusan user/minggu: mau tau KENAPA yang drop di quiz.",
        "PostHog (rekomendasi gua) - sesi replay = nonton video user kesulitan; free luas.",
        "Alternatif: Mixpanel kalau mau funnel/retensi paling mateng.",
    ]),
    ("ATURAN EMAS: 1 TOOL DULU, jangan fragmentasi data", LIME_T, LIME_BG, [
        "2 tool dari awal = 2x kerja pasang tracking, data kepecah, overkill.",
        "GA4 + Vercel Analytics aja dulu (dua-duanya sudah ada). Product analytics nanti.",
    ]),
]
for title, bc, bg, lines in boxes:
    h = 62 + len(lines) * 40
    d.rounded_rectangle([M, y, W - M, y + h], radius=16, fill=bg, outline=bc, width=3)
    d.text((M + 24, y + 14), title, font=f_head, fill=bc)
    cy = y + 50
    for ln in lines:
        for k, wl in enumerate(wrap("- " + ln if False else ln, f_box, W - 2 * M - 64)):
            d.text((M + 24, cy + k * 26), wl, font=f_box, fill=GRAY)
        cy += 40
    y += h + 22

end = y + 12
img = img.crop((0, 0, W, end))
img.save("/home/ubuntu/wikendo-web-app/design/analytics-tools-compare-2026-10-17.png")
print("saved", img.size)
