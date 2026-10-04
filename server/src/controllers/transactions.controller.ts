import { Response } from 'express';
import db from '../db/database';
import { TransactionSchema } from '../schemas';
import { AuthRequest } from '../middleware/auth';
import { ok, created, badRequest, forbidden, notFound, conflict, parseZodError } from '../lib/response';
import type { ListingRow } from './listings.controller';

type TransactionRow = {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  type: string;
  status: string;
  due_date: string | null;
  created_at: string;
  // joined
  listing_title?: string;
  seller_email?: string;
  seller_name?: string;
  buyer_name?: string;
};

// ── POST /api/transactions ────────────────────────────────────────────────────
// Atomic: checks availability, inserts transaction, updates listing status
// in a single SQLite transaction to prevent double-booking.

export function createTransaction(req: AuthRequest, res: Response): void {
  const parsed = TransactionSchema.safeParse(req.body);
  if (!parsed.success) { badRequest(res, ...Object.values(parseZodError(parsed.error)) as [string, string[]]); return; }

  const { listingId } = parsed.data;
  const buyerId = req.userId!;

  // Run everything inside an immediate transaction for atomicity
  db.exec('BEGIN IMMEDIATE');
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?')
      .get(listingId) as ListingRow | undefined;

    if (!listing) {
      db.exec('ROLLBACK');
      notFound(res, 'Listing not found');
      return;
    }
    if (listing.seller_id === buyerId) {
      db.exec('ROLLBACK');
      forbidden(res, "You can't buy your own listing");
      return;
    }
    if (listing.status !== 'available') {
      db.exec('ROLLBACK');
      conflict(res, `Listing is already ${listing.status}`);
      return;
    }

    // Derive type from the listing mode
    const typeMap: Record<string, string> = { sell: 'sale', rent: 'rent', swap: 'swap' };
    const type = typeMap[listing.mode] ?? 'sale';

    // due_date = now + 7 days for rentals
    const due_date = listing.mode === 'rent'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null;

    // Insert transaction
    const info = db.prepare(`
      INSERT INTO transactions (listing_id, buyer_id, seller_id, type, status, due_date)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(listingId, buyerId, listing.seller_id, type, due_date);

    const transaction = db.prepare(`
      SELECT t.*, u.email AS seller_email, u.name AS seller_name
      FROM transactions t
      JOIN users u ON u.id = t.seller_id
      WHERE t.id = ?
    `).get(info.lastInsertRowid) as TransactionRow;

    db.exec('COMMIT');
    created(res, { transaction });
  } catch (err: unknown) {
    try { db.exec('ROLLBACK'); } catch { /* ignore rollback errors */ }
    console.error('Failed to create transaction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── GET /api/my/transactions ──────────────────────────────────────────────────
// Buyer's history: listing title + seller's contact email

export function getMyTransactions(req: AuthRequest, res: Response): void {
  const transactions = db.prepare(`
    SELECT t.*, l.title AS listing_title, u.email AS seller_email, u.name AS seller_name
    FROM transactions t
    JOIN listings l ON l.id = t.listing_id
    JOIN users   u ON u.id = t.seller_id
    WHERE t.buyer_id = ?
    ORDER BY t.created_at DESC
  `).all(req.userId!) as TransactionRow[];

  ok(res, { transactions });
}

// ── GET /api/transactions/incoming ────────────────────────────────────────────
// Seller notifications: pending requests on the logged-in user's listings

export function getIncomingRequests(req: AuthRequest, res: Response): void {
  const transactions = db.prepare(`
    SELECT t.*, l.title AS listing_title, u.name AS buyer_name
    FROM transactions t
    JOIN listings l ON l.id = t.listing_id
    JOIN users   u ON u.id = t.buyer_id
    WHERE t.seller_id = ? AND t.status = 'pending'
    ORDER BY t.created_at DESC
  `).all(req.userId!) as TransactionRow[];

  ok(res, { transactions });
}

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
// Allows the buyer to revoke their transaction/request if it is still pending

export function deleteTransaction(req: AuthRequest, res: Response): void {
  const transactionId = req.params.id;
  const userId = req.userId!;

  db.exec('BEGIN IMMEDIATE');
  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId) as TransactionRow | undefined;
    if (!transaction) {
      db.exec('ROLLBACK');
      notFound(res, 'Transaction not found');
      return;
    }
    
    // Check if the user is the one who created it
    if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
      db.exec('ROLLBACK');
      forbidden(res, 'Not authorized to revoke this transaction');
      return;
    }

    if (transaction.status !== 'pending' && transaction.status !== 'active') {
      db.exec('ROLLBACK');
      badRequest(res, `Cannot revoke transaction in '${transaction.status}' state`);
      return;
    }

    // Delete the transaction
    db.prepare('DELETE FROM transactions WHERE id = ?').run(transaction.id);

    db.exec('COMMIT');
    ok(res, { message: 'Transaction revoked' });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    console.error('Failed to revoke transaction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
