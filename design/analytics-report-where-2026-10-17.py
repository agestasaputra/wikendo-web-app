"""Render PNG -> design/analytics-report-where-2026-10-17.png
WHAT: where to see Wikendo analytics reports: GA4 at analytics.google.com (the wired one) vs Vercel Web Analytics (separate, basic, not enabled) + 5-step GA4 activation.
WHY: Agesta asked "where do I see the report? Vercel dashboard?" - founder education, visual-first (SOP).
ASCII-only; paper #F5F5F4, ink #0C0A09, ember #EA580C, lime #84CC16."""
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
LIME = (132, 204, 22)
LIME_BG = (236, 253, 203)
LIME_T = (54, 83, 20)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_title = ImageFont.truetype(FB, 31)
f_sub = ImageFont.truetype(FR, 20)
f_head = ImageFont.truetype(FB, 24)
f_box = ImageFont.truetype(FR, 20)
f_bold = ImageFont.truetype(FB, 20)
f_tiny = ImageFont.truetype(FB, 15)
f_chip = ImageFont.truetype(FR, 16)
f_numb = ImageFont.truetype(FB, 22)
f_foot = ImageFont.truetype(FR, 19)

img = Image.new("RGB", (W, 1500), PAPER)
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
    pad = 12
    bw = d.textlength(text, font=f_tiny) + pad * 2
    d.rounded_rectangle([x, cy - 14, x + bw, cy + 14], radius=14, fill=bg, outline=border, width=2)
    d.text((x + pad, cy - 8), text, font=f_tiny, fill=tc)


def panel(y, title, badge_txt, lines, border, width=3, bg=WHITE):
    inner = W - 2 * M - 56
    wrapped = [wrap("".join(t for t, _ in segs), f_box, inner) for segs in lines]
    h = 66 + sum(len(wl) * 40 for wl in wrapped) + 18
    d.rounded_rectangle([M, y, W - M, y + h], radius=16, fill=bg, outline=border, width=width)
    cy = y + 18
    d.text((M + 24, cy), title, font=f_head, fill=INK)
    if badge_txt:
        bw = d.textlength(badge_txt, font=f_tiny) + 24
        badge(W - M - 24 - bw, cy + 15, badge_txt, LIME_BG, LIME, LIME_T)
    cy += 48
    for segs, wl in zip(lines, wrapped):
        if len(wl) == 1:
            x = M + 24
            for t, st in segs:
                f = f_bold if st == "b" else f_box
                col = INK if st == "b" else (EMBER if st == "e" else GRAY)
                d.text((x, cy), t, font=f, fill=col)
                x += d.textlength(t, font=f)
        else:
            for k, ln in enumerate(wl):
                d.text((M + 24, cy + k * 40), ln, font=f_box, fill=GRAY)
        cy += len(wl) * 40
    return y + h


# title bar
d.rectangle([0, 0, W, 128], fill=INK)
d.text((M, 20), "Report Analytics Wikendo - di mana lihat apa", font=f_title, fill=WHITE)
d.text((M, 68), "GA4 = yang kemarin di-wire  |  Vercel Web Analytics = tool beda, basic  |  17 Okt 2026", font=f_sub, fill=(214, 211, 209))

y = 170
y = panel(y, "A. Google Analytics 4 (GA4)", "UTAMA - YANG DI-WIRE", [
    [("Di mana: ", "b"), ("analytics.google.com", "e"), (" (buka di browser, login akun Google)", "r")],
    [("Biaya: ", "b"), ("GRATIS, tanpa limit praktis (produk standar Google)", "r")],
    [("Keliatan: ", "b"), ("user realtime, asal channel IG/TikTok/WA, halaman populer,", "r")],
    [("funnel quiz -> klaim (lengkap setelah event P1 dipasang)", "r")],
    [("Butuh: ", "b"), ("bikin property GA4 (5 menit) + set NUXT_PUBLIC_GA_ID di Vercel + redeploy", "r")],
], EMBER, width=4) + 26

y = panel(y, "B. Vercel Web Analytics (beda tool)", "OPSIONAL - BELUM AKTIF", [
    [("Di mana: ", "b"), ("dashboard.vercel.com", "e"), (" -> project wikendo -> tab Analytics", "r")],
    [("Status: ", "b"), ("belum aktif - perlu di-enable sendiri (1 klik) kalau mau", "r")],
    [("Keliatan: ", "b"), ("page view, visitor, asal referrer doang (tanpa funnel/event custom)", "r")],
    [("Catatan: ", "b"), ("bukan pengganti GA4; free tier kecil", "r")],
], GRAY_B, width=3) + 30

# section C - activation steps
d.text((M, y), "CARA AKTIFIN GA4 (5 LANGKAH)", font=f_head, fill=INK)
y += 46
texts = [
    "Buka analytics.google.com, login Google",
    "Bikin Property \"Wikendo\", isi URL www.wikendo.id",
    "Copy Measurement ID (format G-XXXXXXXXXX)",
    "Set di Vercel: Settings -> Env Var NUXT_PUBLIC_GA_ID",
    "Redeploy project -> report langsung live",
]
cw = 212
gap = 14
for i, t in enumerate(texts):
    x = M + i * (cw + gap)
    d.rounded_rectangle([x, y, x + cw, y + 152], radius=14, fill=WHITE, outline=INK, width=3)
    d.text((x + 16, y + 12), str(i + 1) + ".", font=f_numb, fill=EMBER)
    cy = y + 50
    for ln in wrap(t, f_chip, cw - 32):
        d.text((x + 16, cy), ln, font=f_chip, fill=GRAY)
        cy += 22
y += 152 + 30

# footer note
fh = 104
d.rounded_rectangle([M, y, W - M, y + fh], radius=16, fill=INK, outline=INK)
d.text((M + 24, y + 16), "Cara kerja: user buka wikendo.id -> aksi tercatat sebagai event -> terkirim ke Google (GA4) / Vercel", font=f_foot, fill=(230, 230, 228))
d.text((M + 24, y + 46), "lu baca report-nya di dashboard masing-masing. Aktifin GA4 dulu - itu yang punya funnel.", font=f_foot, fill=(230, 230, 228))

end = y + fh + 30
img = img.crop((0, 0, W, end))
img.save("/home/ubuntu/wikendo-web-app/design/analytics-report-where-2026-10-17.png")
print("saved", img.size)
