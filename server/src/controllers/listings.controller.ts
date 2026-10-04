import { Response } from 'express';
import db from '../db/database';
import { ListingSchema, ListingUpdateSchema } from '../schemas';
import { AuthRequest } from '../middleware/auth';
import { ok, created, badRequest, forbidden, notFound, conflict, parseZodError } from '../lib/response';

// ── Row type ──────────────────────────────────────────────────────────────────

export type ListingRow = {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  category: string;
  course: string | null;
  semester: string | null;
  condition: string;
  mode: string;
  price: number | null;
  rent_price_per_week: number | null;
  swap_wanted: string | null;
  status: string;
  created_at: string;
  seller_name?: string;
  seller_hostel?: string;
  seller_batch?: string;
  has_transactions?: number;
};

// ── Shared SQL fragment ───────────────────────────────────────────────────────

const SELECT_WITH_SELLER = `
  SELECT l.*, u.name AS seller_name, u.hostel AS seller_hostel, u.batch AS seller_batch,
         EXISTS(SELECT 1 FROM transactions t WHERE t.listing_id = l.id) AS has_transactions
  FROM listings l
  JOIN users u ON u.id = l.seller_id
`;

// ── GET /api/listings ─────────────────────────────────────────────────────────

export function getListings(req: AuthRequest, res: Response): void {
  const { q, category, semester, mode, maxPrice, sort = 'newest' } = req.query as Record<string, string>;

  let sql = `${SELECT_WITH_SELLER} WHERE l.status = 'available'`;
  const params: (string | number)[] = [];

  if (q) {
    sql += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.course LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) { sql += ' AND l.category = ?'; params.push(category); }
  if (semester) { sql += ' AND l.semester = ?'; params.push(semester); }
  if (mode) { sql += ' AND l.mode = ?'; params.push(mode); }
  if (maxPrice) {
    const p = Number(maxPrice);
    if (!Number.isFinite(p) || p < 0) { badRequest(res, 'maxPrice must be a non-negative number'); return; }
    sql += ' AND l.price <= ?';
    params.push(p);
  }

  const ORDER: Record<string, string> = {
    newest: 'l.created_at DESC',
    price_asc: 'l.price ASC',
    price_desc: 'l.price DESC',
  };
  sql += ` ORDER BY ${ORDER[sort] ?? ORDER.newest}`;

  const listings = db.prepare(sql).all(...params) as ListingRow[];
  ok(res, { listings });
}

// ── GET /api/listings/:id ─────────────────────────────────────────────────────

export function getListingById(req: AuthRequest, res: Response): void {
  const listing = db.prepare(`${SELECT_WITH_SELLER} WHERE l.id = ?`)
    .get(req.params.id) as ListingRow | undefined;

  if (!listing) { notFound(res, 'Listing not found'); return; }
  ok(res, { listing });
}

// ── POST /api/listings ────────────────────────────────────────────────────────

export function createListing(req: AuthRequest, res: Response): void {
  const parsed = ListingSchema.safeParse(req.body);
  if (!parsed.success) { badRequest(res, ...Object.values(parseZodError(parsed.error)) as [string, string[]]); return; }

  const {
    title, description, category, course = null, semester = null,
    condition, mode, price = null, rent_price_per_week = null, swap_wanted = null,
  } = parsed.data;

  const info = db.prepare(`
    INSERT INTO listings
      (seller_id, title, description, category, course, semester, condition, mode,
       price, rent_price_per_week, swap_wanted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId!, title, description, category, course, semester,
    condition, mode, price ?? null, rent_price_per_week ?? null, swap_wanted ?? null,
  );

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(info.lastInsertRowid) as ListingRow;
  created(res, { listing });
}

// ── PUT /api/listings/:id ─────────────────────────────────────────────────────

export function updateListing(req: AuthRequest, res: Response): void {
  const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as ListingRow | undefined;
  if (!existing) { notFound(res, 'Listing not found'); return; }
  if (existing.seller_id !== req.userId) { forbidden(res); return; }
  const transaction = db.prepare('SELECT id FROM transactions WHERE listing_id = ? LIMIT 1').get(req.params.id);
  if (transaction) { conflict(res, 'Listings with deal history cannot be edited'); return; }

  const parsed = ListingUpdateSchema.safeParse(req.body);
  if (!parsed.success) { badRequest(res, ...Object.values(parseZodError(parsed.error)) as [string, string[]]); return; }

  const fields = parsed.data;
  if (Object.keys(fields).length === 0) { badRequest(res, 'No fields to update'); return; }

  const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE listings SET ${setClauses} WHERE id = ?`)
    .run(...Object.values(fields), req.params.id);

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as ListingRow;
  ok(res, { listing });
}

// ── PATCH /api/listings/:id/status ───────────────────────────────────────────

export function patchListingStatus(req: AuthRequest, res: Response): void {
  const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as ListingRow | undefined;
  if (!existing) { notFound(res, 'Listing not found'); return; }
  if (existing.seller_id !== req.userId) { forbidden(res); return; }

  const VALID = ['available', 'sold', 'rented', 'swapped', 'closed'];
  const status = req.body && typeof req.body === 'object'
    ? (req.body as { status?: string }).status
    : undefined;
  if (!status || !VALID.includes(status)) {
    badRequest(res, `status must be one of: ${VALID.join(', ')}`); return;
  }

  if (status === 'available' && ['sold', 'rented', 'swapped'].includes(existing.status)) {
    const transaction = db.prepare('SELECT id FROM transactions WHERE listing_id = ? LIMIT 1').get(req.params.id);
    if (transaction) { conflict(res, 'A listing with transaction history cannot be relisted'); return; }
  }

  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, req.params.id);
  ok(res, { listing: { ...existing, status } });
}

// ── DELETE /api/listings/:id ──────────────────────────────────────────────────

export function deleteListing(req: AuthRequest, res: Response): void {
  const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as ListingRow | undefined;
  if (!existing) { notFound(res, 'Listing not found'); return; }
  if (existing.seller_id !== req.userId) { forbidden(res); return; }

  const transaction = db.prepare('SELECT id FROM transactions WHERE listing_id = ? LIMIT 1').get(req.params.id);
  if (transaction) { conflict(res, 'Listings with deal history cannot be deleted'); return; }

  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  ok(res, { message: 'Listing deleted' });
}

// ── GET /api/my/listings ──────────────────────────────────────────────────────

export function getMyListings(req: AuthRequest, res: Response): void {
  const listings = db.prepare(
    `${SELECT_WITH_SELLER} WHERE l.seller_id = ? ORDER BY l.created_at DESC`,
  ).all(req.userId!) as ListingRow[];
  ok(res, { listings });
}
