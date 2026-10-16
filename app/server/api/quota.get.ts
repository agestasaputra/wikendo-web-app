/**
 * GET /api/quota — Status quota split tempat+makan (kontrak API §2, Addendum v1.3).
 *
 * APA: baca cookie anon (quota_used 1x tempat, makan_quota_used 2x makan)
 * → bangun response via buildQuotaStatus() (helper pure yang SAMA dipakai
 * halaman wallet — 1 interpretasi, bukan duplikat logic per caller).
 * KENAPA: wallet home static "2 • 5" = limit register → bohong buat anon.
 * Endpoint ini bikin wallet jujur ikut sisa beneran.
 * Auth (register 2+5) nyusul slice login: belum ada session infra, jadi
 * sekarang selalu jalur anon. Tanpa LLM/DB — gratis, cepat.
 * Contoh: cookie kosong → { tempat:{used:0,limit:1,remaining:1}, makan:{used:0,limit:2,remaining:2}, is_logged_in:false, ... }.
 */
import {
  buildQuotaStatus,
  parseAnonMakanUsed,
  parseAnonTempatUsed,
} from "../../common/utils/quota";

export default defineEventHandler((event) => {
  const tempatUsed = parseAnonTempatUsed(getCookie(event, "quota_used"));
  const makanUsed = parseAnonMakanUsed(getCookie(event, "makan_quota_used"));

  return buildQuotaStatus({ tempatUsed, makanUsed, isLoggedIn: false });
});
