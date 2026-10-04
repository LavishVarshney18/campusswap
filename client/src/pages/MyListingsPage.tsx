import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Edit3, CheckCircle2, ShoppingBag, Clock, Mail, Calendar, HelpCircle, Package, ArrowRight, Trash2 } from 'lucide-react';
import type { Listing, Transaction, RequestItem } from '../types';
import { CATEGORY_META, MODE_META } from '../lib/constants';
import api from '../lib/api';

type Tab = 'listings' | 'requests' | 'deals';

function rentalDueBadge(dueDate: string): { label: string; bg: string } {
  const [year, month, day] = dueDate.slice(0, 10).split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: 'Overdue', bg: '#FF6B9D' };
  if (days === 0) return { label: 'Due today', bg: '#FFE600' };
  return { label: `Due in ${days} ${days === 1 ? 'day' : 'days'}`, bg: '#FFE600' };
}

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAll = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const [listRes, txRes, reqRes] = await Promise.all([
        api.get('/my/listings'),
        api.get('/my/transactions'),
        api.get('/my/requests'),
      ]);
      setListings(listRes.data.listings || []);
      setTransactions(txRes.data.transactions || []);
      setRequests(reqRes.data.requests || []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      await api.patch(`/listings/${id}/status`, { status: nextStatus });
      fetchAll(true);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to update status');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/listings/${id}`);
      await fetchAll(true);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'listings', label: 'My Listings', icon: <Package size={15} /> },
    { key: 'requests', label: 'My Requests', icon: <HelpCircle size={15} /> },
    { key: 'deals', label: 'My Deals', icon: <ShoppingBag size={15} /> },
  ];

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FFF8E7]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tight">Student Dashboard</h1>
            <p className="text-black/60 text-sm mt-1 font-medium normal-case tracking-normal">
              Manage your active listings, track borrowed items, and view campus requests.
            </p>
          </div>
          <Link to="/create" className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm inline-flex items-center gap-2">
            <PlusCircle size={16} /> Post New Resource
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-0 mb-8 border-[3px] border-black shadow-[3px_3px_0_0_#000] w-full sm:w-auto sm:max-w-fit overflow-hidden">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all duration-100 cursor-pointer border-r-[2px] border-black last:border-r-0 ${activeTab === key
                  ? 'bg-black text-[#FFE600]'
                  : 'bg-white text-black hover:bg-[#FFE600]'
                }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {loadError ? (
          <div role="alert" className="bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] p-10 text-center">
            <p className="text-black font-black uppercase">Activity couldn't load</p>
            <p className="text-black/60 text-sm mt-1 mb-4 font-medium normal-case">Check your connection and retry.</p>
            <button type="button" onClick={() => fetchAll(true)} className="btn-ghost text-xs mx-auto flex items-center gap-1">
              <Clock size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Tab 1: My Listings */}
            {activeTab === 'listings' && (
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border-[3px] border-black/20 h-24 animate-pulse" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-20 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                    <span className="text-5xl mb-4 block">📦</span>
                    <p className="text-lg font-black text-black uppercase">No listings posted yet</p>
                    <p className="text-black/60 text-sm mb-6 mt-1 font-medium normal-case">Sell or rent textbooks, notes, and lab gear to peers.</p>
                    <Link to="/create" className="btn-primary text-xs mx-auto inline-flex items-center gap-2">
                      Create First Listing
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map(item => {
                      const catMeta = CATEGORY_META[item.category] || CATEGORY_META.other;
                      const modeMeta = MODE_META[item.mode] || MODE_META.sell;
                      const isAvailable = item.status === 'available';

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] transition-all duration-100"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 border-[2px] border-black flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0_0_#000]"
                              style={{ backgroundColor: catMeta.color }}
                            >
                              {catMeta.emoji}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="badge text-[10px] px-2 py-0.5 font-black uppercase tracking-widest border-black"
                                  style={{ backgroundColor: modeMeta.bg, color: modeMeta.color }}
                                >
                                  {modeMeta.label}
                                </span>
                                <span
                                  className={`badge text-[10px] px-2 py-0.5 font-black uppercase tracking-widest border-black ${isAvailable ? 'bg-[#00D26A] text-black' : 'bg-[#FFE600] text-black'
                                    }`}
                                >
                                  {item.status}
                                </span>
                                {item.course && (
                                  <span className="text-black/50 text-xs font-bold">
                                    {item.course}
                                  </span>
                                )}
                              </div>
                              <Link to={`/listing/${item.id}`} className="text-black font-black hover:underline text-base block uppercase">
                                {item.title}
                              </Link>
                              <p className="text-black/60 text-xs mt-0.5 font-mono">
                                {item.mode === 'sell' && `₹${item.price ?? 0}`}
                                {item.mode === 'rent' && `₹${item.rent_price_per_week ?? 0}/week`}
                                {item.mode === 'swap' && `Swap for: ${item.swap_wanted || 'Other resource'}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-center">
                            {isAvailable || !item.has_transactions || item.status === 'closed' ? (
                              <button
                                onClick={() => handleToggleStatus(item.id, item.status)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-black uppercase border-[2px] border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000] transition-all duration-100 cursor-pointer ${isAvailable ? 'bg-[#FFE600]' : 'bg-[#00D26A]'
                                  }`}
                              >
                                <CheckCircle2 size={13} />
                                {isAvailable ? 'Mark Sold' : 'Mark Available'}
                              </button>
                            ) : (
                              <span className="badge text-[10px] uppercase bg-white text-black border-black px-2 py-0.5">{item.status}</span>
                            )}

                            {!item.has_transactions && (
                              <>
                                <Link to={`/listings/${item.id}/edit`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-black uppercase border-[2px] border-black bg-white shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000] transition-all duration-100">
                                  <Edit3 size={13} /> Edit
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteListing(item.id)}
                                  disabled={deletingId === item.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-black uppercase border-[2px] border-black bg-[#FF6B9D] shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000] transition-all duration-100 disabled:opacity-50 cursor-pointer"
                                  aria-label={`Delete ${item.title}`}
                                >
                                  <Trash2 size={13} /> {deletingId === item.id ? 'Deleting…' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: My Requests */}
            {activeTab === 'requests' && (
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white border-[3px] border-black/20 h-24 animate-pulse" />)}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-20 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                    <span className="text-5xl mb-4 block">🙋</span>
                    <p className="text-lg font-black text-black uppercase">No requests posted</p>
                    <p className="text-black/60 text-sm mb-6 mt-1 font-medium normal-case">Your resource requests will appear here.</p>
                    <Link to="/requests" className="btn-primary text-xs mx-auto inline-flex items-center gap-2">Open Request Board</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map(req => (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {req.course && <span className="badge bg-[#B79CFF] text-black border-black text-[10px] px-2 py-0.5">{req.course}</span>}
                            {req.semester && <span className="badge bg-white text-black border-black text-[10px] px-2 py-0.5">{req.semester}</span>}
                            <span className={`badge text-[10px] px-2 py-0.5 border-black uppercase ${req.status === 'open' ? 'bg-[#FFE600] text-black' : 'bg-[#00D26A] text-black'}`}>{req.status}</span>
                          </div>
                          <h3 className="text-black font-black uppercase">{req.title}</h3>
                          {req.note && <p className="text-black/60 text-sm mt-1 font-medium normal-case italic">{req.note}</p>}
                        </div>
                        <span className="text-xs text-black/50 font-mono shrink-0">{new Date(req.created_at).toLocaleDateString()}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: My Deals */}
            {activeTab === 'deals' && (
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border-[3px] border-black/20 h-24 animate-pulse" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-20 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                    <span className="text-5xl mb-4 block">🛍️</span>
                    <p className="text-lg font-black text-black uppercase">No items claimed yet</p>
                    <p className="text-black/60 text-sm mb-6 mt-1 font-medium normal-case">Browse campus listings to buy, rent, or swap academic materials.</p>
                    <Link to="/" className="btn-primary text-xs mx-auto inline-flex items-center gap-2">
                      Browse Resources
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map(tx => {
                      const dueBadge = tx.due_date ? rentalDueBadge(tx.due_date) : null;
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="badge text-[10px] px-2 py-0.5 bg-[#4D7CFF] text-black border-black font-black uppercase tracking-widest">
                                {tx.type}
                              </span>
                              <span className="badge text-[10px] px-2 py-0.5 bg-[#00D26A] text-black border-black font-black uppercase tracking-widest">
                                {tx.status}
                              </span>
                              <span className="text-[11px] text-black/50 flex items-center gap-1 font-mono">
                                <Clock size={11} /> {new Date(tx.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-black font-black text-base uppercase">{tx.listing_title || `Listing #${tx.listing_id}`}</h3>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-black/60 mt-2 font-medium">
                              <span>
                                Seller: <strong className="text-black font-black">{tx.seller_name || 'Campus Peer'}</strong>
                              </span>
                              {tx.seller_email && (
                                <a href={`mailto:${tx.seller_email}`} className="flex items-center gap-1 text-black hover:underline font-bold">
                                  <Mail size={12} /> {tx.seller_email}
                                </a>
                              )}
                              {tx.due_date && dueBadge && (
                                <span
                                  className="flex items-center gap-1 font-black px-2 py-0.5 border-[2px] border-black uppercase text-black"
                                  style={{ backgroundColor: dueBadge.bg }}
                                >
                                  <Calendar size={12} /> {dueBadge.label} · Return {new Date(`${tx.due_date}T00:00:00`).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link to={`/listing/${tx.listing_id}`} className="btn-ghost text-xs py-1.5 px-3.5 self-end sm:self-center flex items-center gap-1">
                            View Item <ArrowRight size={13} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
