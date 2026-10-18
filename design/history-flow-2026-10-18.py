"""Render flowchart PNG -> design/history-flow-2026-10-18.png (v3)
WHAT: Alur logic history Wikendo + rootcause /history kosong + jalur write + fix minimal.
WHY: Agesta minta flowchart alur logic; visual-first (SOP 10). v3 fix QA: header wrap,
     chip on-line opaque, callout connector, diamond captions, inner wrap width.
CITE: HistoryPage.vue:16-93, HistoryStore.ts:45-53, utils/history.ts:35-63, history.get.ts:1-44,
      place/recommend.post.ts:16-80, food/recommend.post.ts:18-118, PlaceResultPage.vue:66-76, FoodResultPage.vue:93-104
PROD 18 Okt 2026: /api/history=404, DB uid=0 rows, 40 row terbaru user_id=NULL, worktree history.get.ts syntax error.
ASCII-only; DejaVu; chips drawn LAST (opaque, cover rail lines).
"""
from PIL import Image, ImageDraw, ImageFont

W = 1200
M = 40
PAPER = (245, 245, 244)
INK = (12, 10, 9)
WHITE = (255, 255, 255)
GRAY = (87, 83, 78)
GRAY_L = (120, 113, 108)
GRAY_B = (214, 211, 209)
GRAY_BG = (244, 244, 245)
GRAY_MID = (107, 114, 128)
EMBER = (234, 88, 12)
EMBER_BG = (255, 247, 237)
RED_BG = (254, 242, 242)
RED_B = (239, 68, 68)
RED_T = (153, 27, 27)
GRN_BG = (240, 253, 244)
GRN_B = (34, 197, 94)
GRN_T = (22, 101, 52)
BLUE = (14, 165, 233)
BLUE_BG = (240, 249, 255)
BLUE_T = (3, 105, 161)
VIOLET = (109, 40, 217)
VIOLET_BG = (245, 243, 255)
AMBER = (217, 119, 6)
AMBER_BG = (255, 251, 235)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

f_title = ImageFont.truetype(FB, 30)
f_sub = ImageFont.truetype(FR, 14)
f_lane = ImageFont.truetype(FB, 12)
f_bold = ImageFont.truetype(FB, 16)
f_box = ImageFont.truetype(FR, 15)
f_small = ImageFont.truetype(FR, 13)
f_cite = ImageFont.truetype(FR, 12)
f_dsub = ImageFont.truetype(FR, 13)
f_edge = ImageFont.truetype(FB, 12)

BOX_X0, BOX_X1 = 250, 970
BW = BOX_X1 - BOX_X0
CX = (BOX_X0 + BOX_X1) // 2
CALL_X0, CALL_X1 = 986, 1160
R1, R2 = 160, 196

img = Image.new("RGB", (W, 3800), PAPER)
d = ImageDraw.Draw(img)

CHIPS = []  # draw last


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


def chip(x, cy, text, bg, border, tc, font=None):
    font = font or f_edge
    tw = d.textlength(text, font=font)
    pad = 10
    bw = tw + pad * 2
    CHIPS.append((x, cy, text, bg, border, tc, font, bw))
    return bw


def draw_chips():
    for x, cy, text, bg, border, tc, font, bw in CHIPS:
        d.rounded_rectangle([x, cy - 12, x + bw, cy + 12], radius=12, fill=bg, outline=border, width=2)
        d.text((x + 10, cy - 7), text, font=font, fill=tc)


def arrow_down(x, y1, y2, color=INK, w=3):
    d.line([x, y1, x, y2 - 11], fill=color, width=w)
    d.polygon([x, y2, x - 7, y2 - 12, x + 7, y2 - 12], fill=color)


def arrow_right(x1, y, x2, color=INK, w=3):
    d.line([x1, y, x2 - 11, y], fill=color, width=w)
    d.polygon([x2, y, x2 - 12, y - 7, x2 - 12, y + 7], fill=color)


def block(y, lane, lane_col, title, body, cite, fill=WHITE, stroke=INK, sw=3, title_col=INK):
    inner = BW - 60
    wb = []
    for l in body:
        wb.extend(wrap(l, f_box, inner))
    wc = []
    for l in cite or []:
        wc.extend(wrap(l, f_cite, inner))
    h = 12 + 20 + 24 + len(wb) * 21 + (len(wc) * 16 + 8 if wc else 0) + 14
    d.rounded_rectangle([BOX_X0, y, BOX_X1, y + h], radius=14, fill=fill, outline=stroke, width=sw)
    if lane:
        d.text((BOX_X0 + 18, y + 10), lane, font=f_lane, fill=lane_col)
    d.text((BOX_X0 + 18, y + 32), title, font=f_bold, fill=title_col)
    cy = y + 62
    for l in wb:
        d.text((BOX_X0 + 18, cy), l, font=f_box, fill=GRAY)
        cy += 21
    if wc:
        cy += 6
        for l in wc:
            d.text((BOX_X0 + 18, cy), l, font=f_cite, fill=GRAY_L)
            cy += 16
    return y + h


def diamond(y, w, h, label, sub, stroke=INK, sw=3, label_col=INK):
    cy = y + h // 2
    d.polygon([(CX, y), (CX + w // 2, cy), (CX, y + h), (CX - w // 2, cy)], fill=WHITE, outline=stroke, width=sw)
    tw = d.textlength(label, font=f_bold)
    d.text((CX - tw / 2, cy - 20), label, font=f_bold, fill=label_col)
    tw = d.textlength(sub, font=f_dsub)
    d.text((CX - tw / 2, cy + 2), sub, font=f_dsub, fill=GRAY)
    return y + h


def edge_chip(cy, halfw, side, text, bg, border, tc):
    """Place chip clear of the diamond edge; returns nothing. Drawn last (opaque)."""
    tw = d.textlength(text, font=f_edge)
    bw = tw + 20
    if side == "L":
        x = CX - halfw - 14 - bw
    else:
        x = CX + halfw + 14
    chip(x, cy, text, bg, border, tc)


# ===== HEADER =====
d.rectangle([0, 0, W, 178], fill=INK)
d.text((M, 14), "Flow History Wikendo - kenapa /history kosong", font=f_title, fill=WHITE)
sub1 = "Kasus: atsegasaputra@gmail.com sudah selesai quiz tapi /history kosong."
sub2 = "Bukti prod 18 Okt: /api/history = 404 | DB row untuk uid dia = 0 | 40 row terbaru semuanya user_id NULL (anon)."
for i, s in enumerate(wrap(sub1 + " " + sub2, f_sub, W - 2 * M)):
    d.text((M, 52 + i * 20), s, font=f_sub, fill=(214, 211, 209))
chip(M, 112, "BROWSER (Vue / Pinia / localStorage)", WHITE, INK, INK)
chip(M + 268, 112, "SERVER (Nuxt API / H3)", BLUE_BG, BLUE, BLUE_T)
chip(M + 460, 112, "DB (Supabase generations)", VIOLET_BG, VIOLET, VIOLET)
chip(M, 142, "HIJAU = jalur sukses", GRN_BG, GRN_B, GRN_T)
chip(M + 170, 142, "MERAH = fallback lokal", RED_BG, RED_B, RED_T)
chip(M + 378, 142, "ABU = anon skip server", GRAY_BG, GRAY_MID, INK)

y = 206

# ===== 1 START =====
h = 62
d.rounded_rectangle([BOX_X0, y, BOX_X1, y + h], radius=14, fill=INK, outline=INK, width=3)
d.text((BOX_X0 + 18, y + 10), "START: user buka /history", font=f_bold, fill=WHITE)
d.text((BOX_X0 + 18, y + 34), "pages/history.vue -> HistoryPage.vue onMounted (baris 16)", font=f_cite, fill=(214, 211, 209))
y += h
arrow_down(CX, y, y + 16)
y += 16

# ===== 2 load lokal =====
y = block(y, "STEP 1 - Baca lokal dulu (selalu)", EMBER,
          "history.load() -> localStorage 'wikendo_history'",
          ["parseHistory(): cap 20, dedupe title, normalize kind",
           "HP baru / incognito / clear storage -> list kosong []"],
          ["HistoryStore.ts:45-47 | utils/history.ts:35-45 | constants/storage.ts:6-7"])
arrow_down(CX, y, y + 16)
y += 16

# ===== 3 diamond session =====
y_d1 = y
y = diamond(y, 420, 96, "Ada session Supabase?", "auth.getSession() | HistoryPage.vue:20-21")
cy1 = y_d1 + 48
edge_chip(cy1, 210, "L", "TIDAK: anon, skip server", GRAY_BG, GRAY_MID, INK)
edge_chip(cy1, 210, "R", "YA: login, fetch server", GRN_BG, GRN_B, GRN_T)
arrow_down(CX, y, y + 16, color=GRN_B)
y += 16

# ===== 4 fetch =====
y = block(y, "STEP 2 - Login: ambil data server", BLUE,
          "$fetch GET /api/history?page=1&pageSize=10",
          ["credentials: 'include' -> kirim cookie + session_id",
           "try/catch: gagal -> diam, items lokal tetap tampil"],
          ["HistoryPage.vue:26-39 | PROD: route belum ada -> 404 (curl 18 Okt)"])
arrow_down(CX, y, y + 16)
y += 16

# ===== 5 server cek cookie =====
y = block(y, "SERVER - cek auth cookie", AMBER,
          "getCookie(event, 'sb-access-token')",
          ["kosong -> throw 401 LOGIN_REQUIRED",
           "cookie browser Supabase asli: sb-<ref>-auth-token (httpOnly) -> beda nama"],
          ["history.get.ts:7-14 | worktree: file malah syntax error (esbuild) -> belum bisa dipakai"])
arrow_down(CX, y, y + 16)
y += 16

# ===== 6 diamond token =====
y_d2 = y
y = diamond(y, 340, 84, "Ada token?", "history.get.ts:18")
cy2 = y_d2 + 42
edge_chip(cy2, 170, "L", "TIDAK: 401, fallback lokal", RED_BG, RED_B, RED_T)
edge_chip(cy2, 170, "R", "YA: lanjut ke DB", GRN_BG, GRN_B, GRN_T)
arrow_down(CX, y, y + 16, color=GRN_B)
y += 16

# ===== 7 getUser =====
y = block(y, "SERVER - verifikasi token", BLUE,
          "supabaseAdmin().auth.getUser(token) -> userId",
          ["OK -> uid 9250fa70... (atsegasaputra@gmail.com)",
           "token invalid -> userId = null"],
          ["history.get.ts:17-20"])
arrow_down(CX, y, y + 16)
y += 16

# ===== 8 filter =====
y = block(y, "SERVER - kumpulkan filter", BLUE,
          "getCookie('session_id') + query page/pageSize",
          ["offset = (p-1)*ps | filters: user_id.eq.X, session_id.eq.Y"],
          ["history.get.ts:22-32"])
arrow_down(CX, y, y + 16)
y += 16

# ===== 9 query DB =====
y_query = y
y = block(y, "DB - Supabase generations", VIOLET,
          "select * order created_at desc range(offset, end)",
          ["where user_id = uid OR session_id = sid",
           "return { items, pagination { total } }"],
          ["history.get.ts:33-44"])
cn_h = 218
d.rounded_rectangle([CALL_X0, y_query, CALL_X1, y_query + cn_h], radius=12, fill=AMBER_BG, outline=AMBER, width=3)
d.line([BOX_X1 + 1, y_query + cn_h // 2, CALL_X0 - 1, y_query + cn_h // 2], fill=AMBER, width=3)
d.text((CALL_X0 + 12, y_query + 12), "REAL DB", font=f_bold, fill=AMBER)
d.text((CALL_X0 + 12, y_query + 34), "18 Okt 2026", font=f_cite, fill=GRAY_L)
lines_call = ["uid atsegasaputra:", "= 0 rows", "", "40 row terbaru:", "semua user_id", "= NULL (anon)", "", "quiz tersimpan", "sebagai anon ->", "tidak terhubung", "ke akun dia"]
cyc = y_query + 58
for ln in lines_call:
    d.text((CALL_X0 + 12, cyc), ln, font=f_cite, fill=INK)
    cyc += 16
arrow_down(CX, y, y + 16)
y += 16

# ===== 10 diamond length =====
y_d3 = y
y = diamond(y, 380, 88, "items.length > 0 ?", "HistoryPage.vue:32")
cy3 = y_d3 + 44
edge_chip(cy3, 190, "L", "TIDAK: pakai lokal", RED_BG, RED_B, RED_T)
edge_chip(cy3, 190, "R", "YA: timpa items", GRN_BG, GRN_B, GRN_T)
arrow_down(CX, y, y + 16, color=GRN_B)
y += 16

# ===== 11 overwrite =====
y = block(y, "BROWSER - simpan ke store", GRN_T,
          "history.items = response.items",
          ["GAP: response masih raw generations { recommendations, quiz_input, ... }",
           "belum di-map ke { kind, title, sub, at } -> kartu blank / rusak"],
          ["HistoryPage.vue:33-34"], fill=GRN_BG, stroke=GRN_B)

# ===== rails + merge =====
y_render = y + 34
y_merge = y_render + 48
# gray anon rail R1: cy1 -> y_merge-24, then horizontal to R2
d.line([R1, cy1, R1, y_merge - 24], fill=GRAY_MID, width=3)
d.line([R1, y_merge - 24, R2, y_merge - 24], fill=GRAY_MID, width=3)
# red rail R2: cy2 -> y_merge (passes cy3 T-junction), then horizontal to render box
d.line([R2, cy2, R2, y_merge], fill=RED_B, width=3)
d.line([R2, y_merge, BOX_X0 - 12, y_merge], fill=RED_B, width=3)
d.polygon([BOX_X0, y_merge, BOX_X0 - 12, y_merge - 7, BOX_X0 - 12, y_merge + 7], fill=RED_B)
# diamond1 left branch: vertex -> R1
d.line([CX - 210, cy1, R1, cy1], fill=GRAY_MID, width=3)
# diamond2 left branch: vertex -> R2
d.line([CX - 170, cy2, R2, cy2], fill=RED_B, width=3)
# diamond3 left branch: vertex -> R2
d.line([CX - 190, cy3, R2, cy3], fill=RED_B, width=3)
# main green arrow: -> render top
arrow_down(CX, y, y_render, color=GRN_B)

# ===== 12 render =====
h = 128
d.rounded_rectangle([BOX_X0, y_render, BOX_X1, y_render + h], radius=14, fill=WHITE, outline=INK, width=3)
d.text((BOX_X0 + 18, y_render + 10), "BROWSER - render /history", font=f_lane, fill=EMBER)
d.text((BOX_X0 + 18, y_render + 32), "v-if items.length -> kartu, else empty state", font=f_bold, fill=INK)
d.text((BOX_X0 + 18, y_render + 60), "kartu: grid3 .card thumb/title/sub/timeAgo (max 20)", font=f_box, fill=GRAY)
d.text((BOX_X0 + 18, y_render + 82), "kosong: 'Belum ada riwayat' + CTA /quiz /food", font=f_box, fill=GRAY)
d.text((BOX_X0 + 18, y_render + 106), "CSS .grid3/.card/.thumb belum ada di app/ -> walau ada data, render rusak", font=f_cite, fill=GRAY_L)
y = y_render + h + 24
d.text((BOX_X0 - 210, y), "HistoryPage.vue:49-93 | utils/history.ts:57-63 (timeAgo) | empty state muncul karena items = [] dari semua jalur di atas", font=f_cite, fill=GRAY_L)
y += 34

# ===== WRITE SECTION =====
ws_h = 420
d.rounded_rectangle([M, y, W - M, y + ws_h], radius=16, fill=WHITE, outline=INK, width=2)
d.rectangle([M, y, W - M, y + 38], fill=INK)
d.text((M + 16, y + 10), "JALUR WRITE: dari quiz sampai localStorage (yang seharusnya mengisi history)", font=f_bold, fill=WHITE)
wy = y + 54
col_gap = 16
cw = (W - 2 * M - 32 - 2 * col_gap) // 3
c1 = M + 16
c2 = c1 + cw + col_gap
c3 = c2 + cw + col_gap
ch = 286

d.rounded_rectangle([c1, wy, c1 + cw, wy + ch], radius=12, fill=GRAY_BG, outline=GRAY_B, width=2)
d.text((c1 + 12, wy + 12), "1. QUIZ", font=f_lane, fill=INK)
d.text((c1 + 12, wy + 32), "User selesaikan quiz", font=f_bold, fill=INK)
col1 = ["place: mood, companion,", "budget, location", "food: mall, mission,", "budget, companion", "generatePlace() / rankTenants()", "LLM -> 5 rekomendasi"]
cy = wy + 58
for ln in col1:
    d.text((c1 + 12, cy), ln, font=f_small, fill=GRAY)
    cy += 20
d.text((c1 + 12, cy + 8), "quiz -> /result atau", font=f_cite, fill=GRAY_L)
d.text((c1 + 12, cy + 24), "/result-food", font=f_cite, fill=GRAY_L)

d.rounded_rectangle([c2, wy, c2 + cw, wy + ch], radius=12, fill=VIOLET_BG, outline=VIOLET, width=2)
d.text((c2 + 12, wy + 12), "2. POST API", font=f_lane, fill=VIOLET)
d.text((c2 + 12, wy + 32), "INSERT generations", font=f_bold, fill=INK)
col2 = ["POST /api/place/recommend", "POST /api/food/recommend", "quota check (cookie / DB)", "INSERT { session_id,", "user_id, quiz_input,", "recommendations }", "user_id = NULL kalau", "anon / token tak kebaca"]
cy = wy + 58
for ln in col2:
    d.text((c2 + 12, cy), ln, font=f_small, fill=GRAY)
    cy += 20
d.text((c2 + 12, cy + 8), "place.ts:49-77", font=f_cite, fill=GRAY_L)
d.text((c2 + 12, cy + 24), "food.ts:76-114", font=f_cite, fill=GRAY_L)

d.rounded_rectangle([c3, wy, c3 + cw, wy + ch], radius=12, fill=GRN_BG, outline=GRN_B, width=2)
d.text((c3 + 12, wy + 12), "3. RESULT -> HISTORY", font=f_lane, fill=GRN_T)
d.text((c3 + 12, wy + 32), "push ke localStorage", font=f_bold, fill=INK)
col3 = ["PlaceResultPage.vue", "FoodResultPage.vue", "list <- useFetch result", "watch list.length", "pushHistory() -> store", "HistoryStore.push(): cap 20", "+ dedupe title", "-> localStorage JSON"]
cy = wy + 58
for ln in col3:
    d.text((c3 + 12, cy), ln, font=f_small, fill=GRAY)
    cy += 20
d.text((c3 + 12, cy + 8), "HistoryStore.ts:49-53", font=f_cite, fill=GRAY_L)

arrow_right(c1 + cw, wy + ch // 2, c2, INK)
arrow_right(c2 + cw, wy + ch // 2, c3, INK)

note1 = "PROD HEAD: watch(() => list.length) TANPA { immediate: true } -> list sudah berisi saat mount -> pushHistory() tidak pernah fire -> localStorage tetap kosong."
note2 = "Worktree sudah fix (onMounted + immediate) TAPI belum di-commit/push -> Vercel masih versi lama."
cy = wy + ch + 20
for ln in wrap(note1, f_small, W - 2 * M - 32):
    d.text((M + 16, cy), ln, font=f_small, fill=RED_T)
    cy += 18
for ln in wrap(note2, f_small, W - 2 * M - 32):
    d.text((M + 16, cy), ln, font=f_small, fill=RED_T)
    cy += 18
y += ws_h + 22

# ===== ROOTCAUSE =====
rc_items = [
    "1. DB: uid 9250fa70... = 0 row. 40 row terbaru semua user_id = NULL (anon) -> quiz-mu kesimpan anon karena token tidak kebaca server.",
    "2. PROD /api/history = 404 (file belum di-deploy), padahal /api/quota = 200. Fetch remote pasti gagal -> fallback list lokal.",
    "3. Cookie mismatch: server baca 'sb-access-token' (history.get.ts:7) tapi browser Supabase pakai 'sb-<ref>-auth-token' (httpOnly) -> selalu 401.",
    "4. PROD result pages tanpa { immediate: true } -> HistoryStore.push tidak fire -> localStorage 'wikendo_history' tetap kosong.",
    "5. Shape mismatch: API return raw generations { recommendations, quiz_input } tapi HistoryPage mau { kind, title, sub, at } -> tanpa mapping, kartu rusak.",
    "6. CSS .grid3/.card/.thumb (commit afd7e02 option 9) tidak ada di app/ -> walau ada data, tampilan tidak sesuai.",
]
rc_lines = []
for it in rc_items:
    rc_lines.extend(wrap(it, f_box, W - 2 * M - 44))
rc_h = 46 + len(rc_lines) * 22 + 34
d.rounded_rectangle([M, y, W - M, y + rc_h], radius=16, fill=RED_BG, outline=RED_B, width=3)
d.text((M + 16, y + 14), "ROOTCAUSE untuk atsegasaputra@gmail.com  (verified 18 Okt 2026)", font=f_bold, fill=RED_T)
cy = y + 46
for ln in rc_lines:
    d.text((M + 16, cy), ln, font=f_box, fill=INK)
    cy += 22
d.text((M + 16, cy + 8), "Bukti: node check Supabase (list users + query generations) | curl prod /api/history + /api/quota | git show HEAD vs worktree | esbuild parse", font=f_cite, fill=GRAY_L)
y += rc_h + 22

# ===== FIX =====
fx_items = [
    "A. Restore handler: export default defineEventHandler(async (event) => { ... }) di history.get.ts + quota.get.ts (worktree sekarang syntax error).",
    "B. Auth: ganti baca cookie manual ke Supabase SSR helper (@supabase/ssr) atau baca 'sb-<ref>-auth-token' yang benar; set cookie saat login lewat server.",
    "C. Push history: pastikan { immediate: true } ikut ke prod + mapping generations -> { kind, title: recommendations[0], at: created_at }.",
    "D. Fallback jujur: kalau 401/404 jangan overwrite items (worktree sudah: if (response?.items?.length) baru assign).",
    "E. Merge anon -> login: saat login, update generations.user_id untuk session_id yang sama (atau migrasi 1x) supaya quiz lama ikut terbaca.",
    "F. Tambah CSS grid3/.card/.thumb atau ganti list ke flex sederhana yang sudah ada stylenya.",
]
fx_lines = []
for it in fx_items:
    fx_lines.extend(wrap(it, f_box, W - 2 * M - 44))
fx_h = 46 + len(fx_lines) * 22 + 30
d.rounded_rectangle([M, y, W - M, y + fx_h], radius=16, fill=GRN_BG, outline=GRN_B, width=3)
d.text((M + 16, y + 14), "FIX MINIMAL (urutan eksekusi):", font=f_bold, fill=GRN_T)
cy = y + 46
for ln in fx_lines:
    d.text((M + 16, cy), ln, font=f_box, fill=INK)
    cy += 22
y += fx_h + 22

# ===== FOOTER =====
ft_h = 118
d.rounded_rectangle([M, y, W - M, y + ft_h], radius=14, fill=WHITE, outline=GRAY_B, width=2)
d.text((M + 16, y + 12), "Catatan jalur lain (tidak digambar):", font=f_bold, fill=INK)
d.text((M + 16, y + 36), "- Login Google OAuth pakai handler terpisah (useGoogleSignIn + redirect) -> tetap berakhir di cookie Supabase yang sama.", font=f_small, fill=GRAY)
d.text((M + 16, y + 56), "- Wishlist / voucher tidak menyentuh history. Kuota ada di /api/quota, bukan /api/history.", font=f_small, fill=GRAY)
d.text((M + 16, y + 80), "Verifikasi setelah fix: pnpm test -> lint -> build hijau, git rev-parse HEAD == origin/main, curl prod /api/history = 200 + /history render kartu.", font=f_cite, fill=GRAY_L)
y += ft_h + 20

draw_chips()

img2 = img.crop((0, 0, W, y + 10))
img2.save("/home/ubuntu/wikendo-web-app/design/history-flow-2026-10-18.png")
print("saved", img2.size)
