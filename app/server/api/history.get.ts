import { defineEventHandler, getQuery, createError, getCookie, getHeader } from 'h3';
import { supabaseAdmin } from '../utils/db';

export default defineEventHandler(async (event) => {
  // Auth: Bearer header (primary) + legacy sb-access-token cookie (fallback).
  // WHY both: Supabase browser client stores session in localStorage, not cookie;
  // the client sends Authorization: Bearer <access_token>. Cookie path is kept
  // for backward compat / SSR if ever set via setCookie.
  const authHeader = getHeader(event, 'authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const cookieToken = getCookie(event, 'sb-access-token') || '';
  const accessToken = bearerToken || cookieToken;
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'LOGIN_REQUIRED',
      data: { message: 'Login required to view history' },
    });
  }

  const { data: authData, error: authErr } = await supabaseAdmin().auth.getUser(accessToken);
  if (authErr || !authData?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'LOGIN_REQUIRED',
      data: { message: 'Invalid session. Please login again.' },
    });
  }
  const userId = authData.user.id;

  // Pagination – defaults 1 / 10, clamp pageSize 1..50
  const { page = '1', pageSize = '10' } = getQuery(event);
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.min(50, Math.max(1, Number(pageSize) || 10));
  const offset = (p - 1) * ps;

  const sessionId = getCookie(event, 'session_id') || '';
  const db = supabaseAdmin();
  // Logged-in: user_id match + anon rows on same browser (session_id) for claim
  const filters: string[] = [`user_id.eq.${userId}`];
  if (sessionId) filters.push(`session_id.eq.${sessionId}`);

  const { data, error: dbError, count } = await db
    .from('generations')
    .select('*', { count: 'exact' })
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .range(offset, offset + ps - 1);

  if (dbError) {
    throw createError({ statusCode: 500, statusMessage: 'DB_ERROR', data: { message: dbError.message } });
  }

  return { items: data ?? [], pagination: { page: p, pageSize: ps, total: count ?? 0 } };
});
