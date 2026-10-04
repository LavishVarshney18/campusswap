import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  RefreshCw,
  Mail,
  GraduationCap,
  AlertCircle,
  X,
  Copy,
  Undo2,
} from 'lucide-react';
import type { Listing, Transaction } from '../types';
import { CATEGORY_META, MODE_META, CONDITION_LABELS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { Button, EmptyState, Skeleton } from '../components/ui';
import api from '../lib/api';
import toast from 'react-hot-toast';

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    transaction: Transaction;
    sellerEmail: string;
  } | null>(null);
  const [actionError, setActionError] = useState('');
  const [myTransaction, setMyTransaction] = useState<Transaction | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchListing = useCallback((showLoading = true) => {
    if (!id) return;
    if (showLoading) {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
    }
    api
      .get(`/listings/${id}`)
      .then(r => setListing(r.data.listing))
      .catch(err => {
        if (err.response?.status === 404) {
          setListing(null);
          setNotFound(true);
        } else {
          setListing(null);
          setLoadError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchListing(false);
  }, [fetchListing]);

  // Fetch current user's pending transaction for this listing (if any)
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    api.get('/transactions/mine')
      .then(r => {
        const txs: Transaction[] = r.data.transactions;
        const mine = txs.find(t => t.listing_id === Number(id)) ?? null;
        setMyTransaction(mine);
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently?')) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted');
      navigate('/my-listings');
    } catch {
      toast.error('Failed to delete listing');
      setDeleting(false);
    }
  };

  const closedStatusForMode = (mode: Listing['mode']) => {
    if (mode === 'rent') return 'rented';
    if (mode === 'swap') return 'swapped';
    return 'sold';
  };

  const handleMarkClosed = async () => {
    if (!listing) return;
    try {
      await api.patch(`/listings/${id}/status`, { status: closedStatusForMode(listing.mode) });
      toast.success('Listing marked as unavailable');
      fetchListing();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Failed to update status');
    }
  };

  const handleMarkAvailable = async () => {
    try {
      await api.patch(`/listings/${id}/status`, { status: 'available' });
      toast.success('Listing is live again');
      fetchListing();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Failed to update status');
    }
  };

  const handleTransact = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.post('/transactions', { listingId: Number(id) });
      const tx = res.data.transaction as Transaction;
      setMyTransaction(tx);
      setConfirmModal({ transaction: tx, sellerEmail: tx.seller_email ?? '' });
      // Listing stays available — no refetch needed
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setActionError(ax.response?.data?.error ?? 'Could not complete this action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!myTransaction) return;
    if (!confirm('Revoke your request for this listing?')) return;
    setRevoking(true);
    try {
      await api.delete(`/transactions/${myTransaction.id}`);
      toast.success('Request revoked — listing is available again');
      setMyTransaction(null);
      fetchListing();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Failed to revoke request');
    } finally {
      setRevoking(false);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email copied');
    } catch {
      toast.error('Could not copy email');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-10 px-4 bg-[#FFF8E7]">
        <DetailSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center bg-[#FFF8E7]">
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Couldn't load this listing"
          description="Check your connection and try again."
          action={
            <Button type="button" onClick={() => fetchListing()} leftIcon={<RefreshCw size={15} />}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center bg-[#FFF8E7]">
        <EmptyState
          icon="📭"
          title="Listing not found"
          description="This item may have been removed or the link is incorrect."
          action={
            <Link to="/" className="btn-primary text-sm">
              Back to browse
            </Link>
          }
        />
      </div>
    );
  }

  const catMeta = CATEGORY_META[listing.category] || CATEGORY_META.other;
  const modeMeta = MODE_META[listing.mode] || MODE_META.sell;
  const isOwner = user?.id === listing.seller_id;
  const isAvailable = listing.status === 'available';

  const actionLabel =
    listing.mode === 'sell'
      ? 'Buy now'
      : listing.mode === 'rent'
        ? 'Rent for 7 days'
        : 'Propose swap';

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FFF8E7]">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-black/60 hover:text-black mb-6 transition-colors text-sm font-bold uppercase"
        >
          <ArrowLeft size={16} /> Back to browse
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-[3px] border-black shadow-[6px_6px_0_0_#000] overflow-hidden bg-white">
          {/* Category header */}
          <div
            className="relative p-8 sm:p-10 border-b-[3px] border-black"
            style={{ backgroundColor: catMeta.color }}
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 bg-white border-[3px] border-black flex items-center justify-center text-5xl shrink-0 shadow-[4px_4px_0_0_#000]">
                {catMeta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-black text-xs font-black uppercase tracking-widest mb-2 font-mono">{catMeta.label}</p>
                <h1 className="text-black text-2xl sm:text-4xl font-black leading-tight uppercase">{listing.title}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  {listing.course && (
                    <span className="badge bg-white text-black border-black text-xs px-2.5 py-1">
                      {listing.course}
                    </span>
                  )}
                  {listing.semester && (
                    <span className="badge bg-white text-black border-black text-xs px-2.5 py-1">
                      {listing.semester}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span
                className="badge text-sm px-3 py-1.5 font-black border-black"
                style={{ backgroundColor: modeMeta.bg, color: modeMeta.color }}
              >
                {modeMeta.label}
              </span>
              <span className="badge text-sm px-3 py-1.5 text-black bg-white border-black">
                {CONDITION_LABELS[listing.condition]}
              </span>
              <span
                className={`badge text-xs px-3 py-1 font-black uppercase tracking-wider border-black ${isAvailable ? 'bg-[#00D26A] text-black' : 'bg-[#FFE600] text-black'
                  }`}
              >
                {listing.status}
              </span>
              <div className="ml-auto text-right">
                {listing.mode === 'sell' && (
                  <span className="text-3xl font-black text-black" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {listing.price != null ? `₹${listing.price}` : 'Free'}
                  </span>
                )}
                {listing.mode === 'rent' && (
                  <p className="text-3xl font-black text-black" style={{ fontFamily: "'Space Mono', monospace" }}>
                    ₹{listing.rent_price_per_week}
                    <span className="text-sm font-bold text-black/50">/week</span>
                  </p>
                )}
                {listing.mode === 'swap' && listing.swap_wanted && (
                  <p className="text-sm font-bold text-black max-w-[220px] normal-case">
                    Swap for {listing.swap_wanted}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-black text-xs font-black uppercase tracking-widest mb-2">Description</h2>
              <p className="text-black/80 leading-relaxed whitespace-pre-line font-medium normal-case">{listing.description}</p>
            </div>

            {/* Seller info */}
            <div className="bg-[#FFF8E7] p-5 border-[3px] border-black shadow-[3px_3px_0_0_#000] mb-8">
              <h2 className="text-black text-xs font-black uppercase tracking-widest mb-4">Seller</h2>
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-black text-[#FFE600] flex items-center justify-center text-xl font-black shrink-0 border-[2px] border-black">
                  {listing.seller_name?.[0]?.toUpperCase() ?? 'S'}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-black font-black text-lg uppercase">{listing.seller_name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/60 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} className="text-black" />
                      {listing.seller_hostel || 'On campus'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-black" />
                      {listing.seller_batch || 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-black/50 flex items-center gap-1 font-mono">
                    <Clock size={12} />
                    Posted {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {actionError && (
              <div className="flex items-center gap-2 text-black text-sm mb-4 p-3 bg-[#FF6B9D] border-[3px] border-black font-bold uppercase">
                <AlertCircle size={16} />
                {actionError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {isOwner ? (
                <>
                  {!listing.has_transactions && (
                    <Link to={`/listings/${listing.id}/edit`} className="btn-ghost flex-1 justify-center inline-flex items-center gap-2">
                      <Edit3 size={16} /> Edit
                    </Link>
                  )}
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={handleMarkClosed}
                      className="inline-flex items-center justify-center gap-2 flex-1 py-2 px-4 border-[3px] border-black bg-[#FFE600] text-black font-black text-sm uppercase shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] transition-all duration-100 cursor-pointer"
                    >
                      <CheckCircle2 size={16} /> Mark as sold
                    </button>
                  ) : !listing.has_transactions || listing.status === 'closed' ? (
                    <button
                      type="button"
                      onClick={handleMarkAvailable}
                      className="inline-flex items-center justify-center gap-2 flex-1 py-2 px-4 border-[3px] border-black bg-[#00D26A] text-black font-black text-sm uppercase shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] transition-all duration-100 cursor-pointer"
                    >
                      Mark available again
                    </button>
                  ) : (
                    <p className="flex-1 text-center text-xs text-black/50 self-center font-medium">Deal recorded</p>
                  )}
                  {!listing.has_transactions && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDelete}
                      isLoading={deleting}
                      className="flex-1"
                      leftIcon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  )}
                </>
              ) : isAvailable ? (
                <>
                  {myTransaction ? (
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      <div className="flex-1 p-4 bg-[#FFE600] border-[3px] border-black text-black text-sm font-black uppercase flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} />
                        You've already requested this
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleRevoke}
                        isLoading={revoking}
                        leftIcon={<Undo2 size={16} />}
                      >
                        Revoke request
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleTransact}
                      isLoading={actionLoading}
                      size="lg"
                      fullWidth
                      className="sm:flex-1"
                      leftIcon={
                        listing.mode === 'swap' ? <RefreshCw size={18} /> : <ShoppingBag size={18} />
                      }
                    >
                      {actionLabel}
                    </Button>
                  )}
                </>
              ) : (
                <p className="flex-1 p-4 bg-white border-[3px] border-black text-center text-black/60 text-sm font-medium">
                  This listing is no longer available.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setConfirmModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-[#FFF8E7] border-[3px] border-black shadow-[6px_6px_0_0_#000] p-6 sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
            >
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="absolute top-4 right-4 p-1.5 border-[2px] border-black bg-[#FF6B9D] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#00D26A] border-[2px] border-black flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                  <CheckCircle2 size={24} className="text-black" />
                </div>
                <div>
                  <h3 id="confirm-title" className="text-black font-black text-lg uppercase">
                    Request confirmed
                  </h3>
                  <p className="text-black/60 text-xs font-medium normal-case">Coordinate a campus handover with the seller.</p>
                </div>
              </div>

              <p className="text-black/70 text-sm leading-relaxed mb-4 font-medium normal-case">
                Email the seller to arrange pickup at their hostel or a campus meetup spot.
              </p>

              {confirmModal.sellerEmail ? (
                <div className="flex items-center gap-2 p-3 bg-white border-[2px] border-black shadow-[2px_2px_0_0_#000] mb-4">
                  <Mail size={16} className="text-black shrink-0" />
                  <a
                    href={`mailto:${confirmModal.sellerEmail}`}
                    className="text-black font-bold text-sm truncate flex-1 hover:underline"
                  >
                    {confirmModal.sellerEmail}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyEmail(confirmModal.sellerEmail)}
                    className="p-2 border-[2px] border-black hover:bg-[#FFE600] transition-colors"
                    title="Copy email"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-black font-bold text-sm mb-4 bg-[#FFE600] p-2 border-[2px] border-black">Seller contact is unavailable — check My Activity.</p>
              )}

              {confirmModal.transaction.due_date && (
                <div className="flex items-center gap-2 text-black text-xs font-black bg-[#00D26A] px-3 py-2 border-[2px] border-black mb-4 uppercase">
                  <Calendar size={14} />
                  Return due {new Date(confirmModal.transaction.due_date).toLocaleDateString()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/my-listings" className="btn-primary flex-1 justify-center text-sm py-2.5 inline-flex items-center">
                  View my activity
                </Link>
                <button type="button" onClick={() => setConfirmModal(null)} className="btn-ghost flex-1 justify-center text-sm py-2.5">
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
