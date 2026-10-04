import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  FlaskConical,
  Calculator,
  FileText,
  Package,
  Filter,
  X,
  SlidersHorizontal,
  PlusCircle,
  TrendingUp,
  HelpCircle,
  Handshake,
  RefreshCw,
} from 'lucide-react';
import type { Listing, ListingCategory, ListingMode, Stats } from '../types';
import { CATEGORY_META, MODE_META, SEMESTER_OPTIONS } from '../lib/constants';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { EmptyState } from '../components/ui';
import api from '../lib/api';

const CATEGORIES = Object.keys(CATEGORY_META) as ListingCategory[];
const MODES = Object.keys(MODE_META) as ListingMode[];

const HERO_CATEGORIES = [
  { key: 'book' as const, icon: BookOpen, label: 'Textbooks' },
  { key: 'notes' as const, icon: FileText, label: 'Notes' },
  { key: 'calculator' as const, icon: Calculator, label: 'Calculators' },
  { key: 'lab-equipment' as const, icon: FlaskConical, label: 'Lab Gear' },
  { key: 'other' as const, icon: Package, label: 'Other' },
];

const MODE_FILTER_LABEL: Record<ListingMode, string> = {
  sell: 'Buy',
  rent: 'Rent',
  swap: 'Swap',
};

const SEARCH_DEBOUNCE_MS = 400;

// Marquee items
const MARQUEE_ITEMS = [
  '📚 TEXTBOOKS', '🔢 CALCULATORS', '📝 LECTURE NOTES', '🔬 LAB GEAR',
  '💛 NO SHIPPING', '🤝 PEER TO PEER', '🏠 HOSTEL PICKUP', '♻️ SWAP DEALS',
  '📚 TEXTBOOKS', '🔢 CALCULATORS', '📝 LECTURE NOTES', '🔬 LAB GEAR',
  '💛 NO SHIPPING', '🤝 PEER TO PEER', '🏠 HOSTEL PICKUP', '♻️ SWAP DEALS',
];

function AnimatedStat({
  value,
  label,
  color,
  icon,
  delay,
}: {
  value: number;
  label: string;
  color: string;
  icon: ReactNode;
  delay: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const steps = 24;
    const step = value / steps;
    const id = window.setInterval(() => {
      frame += 1;
      setDisplay(frame >= steps ? value : Math.round(step * frame));
      if (frame >= steps) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex flex-col items-center gap-2 p-4 bg-white border-[3px] border-black shadow-[3px_3px_0_0_#000]"
    >
      <div
        className="w-10 h-10 flex items-center justify-center border-[2px] border-black"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <motion.span
        key={value}
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl sm:text-4xl font-black tabular-nums text-black"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {display}
      </motion.span>
      <span className="text-black/60 text-[10px] font-black uppercase tracking-widest text-center leading-snug font-mono">
        {label}
      </span>
    </motion.div>
  );
}

interface FilterPanelProps {
  category: string;
  mode: string;
  semester: string;
  sort: string;
  setFilter: (key: string, value: string) => void;
  clearAll: () => void;
  hasFilters: boolean;
  onClose?: () => void;
  className?: string;
}

function FilterPanel({
  category,
  mode,
  semester,
  sort,
  setFilter,
  clearAll,
  hasFilters,
  onClose,
  className = '',
}: FilterPanelProps) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wide">
          <SlidersHorizontal size={16} />
          Filters
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-[2px] border-black bg-[#FF6B9D] hover:shadow-[2px_2px_0_0_#000] transition-all lg:hidden cursor-pointer"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2 font-mono">Category</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('category', '')}
            className={`badge text-[10px] px-3 py-1.5 cursor-pointer transition-all border-[2px] border-black ${
              !category ? 'bg-black text-[#FFE600]' : 'bg-white text-black hover:bg-[#FFE600]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(c => {
            const meta = CATEGORY_META[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter('category', active ? '' : c)}
                className={`badge text-[10px] px-3 py-1.5 cursor-pointer transition-colors border-[2px] border-black flex items-center gap-1 ${
                  active ? '' : 'bg-white text-black hover:bg-gray-100'
                }`}
                style={active ? {
                  backgroundColor: meta.color,
                  color: '#000',
                  boxShadow: '2px 2px 0 0 #000'
                } : {
                  color: '#000'
                }}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2 font-mono">Semester</p>
        <select
          className="input py-2.5 text-sm w-full"
          value={semester}
          onChange={e => setFilter('semester', e.target.value)}
        >
          <option value="">All semesters</option>
          {SEMESTER_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2 font-mono">Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => {
            const meta = MODE_META[m];
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setFilter('mode', active ? '' : m)}
                className="py-2 border-[2px] border-black text-xs font-black uppercase tracking-wide transition-all duration-100 cursor-pointer"
                style={{
                  backgroundColor: active ? meta.bg : '#fff',
                  color: '#000',
                  boxShadow: active ? '2px 2px 0 0 #000' : 'none',
                }}
              >
                {MODE_FILTER_LABEL[m]}
              </button>
            );
          })}
        </div>
      </div>



      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2 font-mono">Sort by</p>
        <select
          className="input py-2.5 text-sm w-full"
          value={sort}
          onChange={e => setFilter('sort', e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center justify-center gap-2 w-full py-2 border-[2px] border-black bg-[#FF6B9D] text-black text-xs font-black uppercase tracking-wide hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#000] transition-all duration-100 cursor-pointer"
        >
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingError, setListingError] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    openRequests: 0,
    completedTransactions: 0,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const category = params.get('category') ?? '';
  const mode = params.get('mode') ?? '';
  const semester = params.get('semester') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const q = params.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      setLoading(true);
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next);
    },
    [params, setParams],
  );

  const clearAll = useCallback(() => {
    setLoading(true);
    setSearchInput('');
    setParams({});
    setFilterDrawerOpen(false);
  }, [setParams]);

  const hasFilters = !!(category || mode || semester || maxPrice || q || sort !== 'newest');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === q) return;
      setFilter('q', trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput, q, setFilter]);

  const fetchListings = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/listings', {
        params: {
          ...(category && { category }),
          ...(mode && { mode }),
          ...(semester && { semester }),
          ...(maxPrice && { maxPrice }),
          ...(sort && { sort }),
          ...(q && { q }),
        },
      });
      setListings(res.data.listings || []);
      setListingError(false);
    } catch {
      setListings([]);
      setListingError(true);
    } finally {
      setLoading(false);
    }
  }, [category, mode, semester, maxPrice, sort, q]);

  useEffect(() => {
    fetchListings(false);
  }, [fetchListings]);

  useEffect(() => {
    api
      .get('/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => {});
  }, []);

  const toggleCategoryChip = (key: ListingCategory) => {
    setFilter('category', category === key ? '' : key);
  };

  const filterPanelProps: FilterPanelProps = {
    category,
    mode,
    semester,
    sort,
    setFilter,
    clearAll,
    hasFilters,
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-8 px-4 sm:pt-16 sm:pb-10">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            {/* Hero label */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-black text-[#FFE600] text-[10px] font-black uppercase tracking-widest mb-5 font-mono border-[2px] border-black shadow-[3px_3px_0_0_#FFE600]">
              🎓 Campus-only marketplace
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-black leading-tight mb-4 uppercase tracking-tight">
              Buy, rent & swap<br />
              <span className="bg-[#FFE600] px-2 inline-block border-[3px] border-black">academic resources</span>
            </h1>

            <p className="text-black/60 text-sm sm:text-base mb-8 max-w-2xl mx-auto leading-relaxed font-medium normal-case tracking-normal">
              Textbooks, notes, calculators, and lab gear from students in your hostels and batch — no shipping, no strangers.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by title, course code, or topic…"
                className="input w-full pl-12 pr-12 py-4 text-base"
                aria-label="Search listings"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {HERO_CATEGORIES.map(({ key, label }, i) => {
                const meta = CATEGORY_META[key];
                const active = category === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.04 }}
                    onClick={() => toggleCategoryChip(key)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wide border-[2px] border-black transition-colors duration-200 cursor-pointer ${
                      active ? '' : 'bg-white hover:bg-gray-100'
                    }`}
                    style={active ? {
                      backgroundColor: '#000',
                      color: meta.color,
                      boxShadow: '3px 3px 0 0 #000'
                    } : {
                      color: '#000',
                      boxShadow: '2px 2px 0 0 #000'
                    }}
                  >
                    <span>{meta.emoji}</span>
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-y-[3px] border-black bg-[#FFE600] py-3 overflow-hidden">
        <div className="marquee-track">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-black font-black text-xs uppercase tracking-widest font-mono whitespace-nowrap">
              {item}
              <span className="w-2 h-2 bg-black inline-block transform rotate-45 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <section className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <AnimatedStat
              value={stats.totalListings}
              label="Listings live"
              color="#B79CFF"
              icon={<TrendingUp size={18} />}
              delay={0.1}
            />
            <AnimatedStat
              value={stats.openRequests}
              label="Open requests"
              color="#FFE600"
              icon={<HelpCircle size={18} />}
              delay={0.18}
            />
            <AnimatedStat
              value={stats.completedTransactions}
              label="Deals done"
              color="#00D26A"
              icon={<Handshake size={18} />}
              delay={0.26}
            />
          </div>
        </motion.div>
      </section>

      {/* Browse grid + filters */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-black uppercase">Campus marketplace</h2>
              <p className="text-black/60 text-sm mt-0.5 font-medium normal-case">
                {loading
                  ? 'Loading resources…'
                  : `${listings.length} item${listings.length === 1 ? '' : 's'} match your filters`}
              </p>
            </div>
            <button
              type="button"
              id="toggle-filters-btn"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setFilterDrawerOpen(true);
                } else {
                  setSidebarOpen(prev => !prev);
                }
              }}
              className="btn-ghost text-xs py-2.5 px-4 flex items-center gap-2"
            >
              <Filter size={16} />
              {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
              {hasFilters && (
                <span className="w-2 h-2 bg-black inline-block" aria-hidden />
              )}
            </button>
          </div>

          <div className="flex gap-8 items-start">
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.aside
                  key="filter-sidebar"
                  initial={{ opacity: 0, width: 0, marginRight: -32 }}
                  animate={{ opacity: 1, width: 288, marginRight: 0 }}
                  exit={{ opacity: 0, width: 0, marginRight: -32 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="hidden lg:block shrink-0 sticky top-24 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] p-5 overflow-hidden overflow-y-auto"
                  style={{ minWidth: 0, maxHeight: 'calc(100vh - 7rem)' }}
                >
                  <FilterPanel {...filterPanelProps} />
                </motion.aside>
              )}
            </AnimatePresence>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                  ))}
                </div>
              ) : listingError ? (
                <EmptyState
                  icon={<RefreshCw size={24} />}
                  title="Listings couldn't load"
                  description="Check the server connection and try again."
                  action={
                    <button type="button" onClick={() => fetchListings(true)} className="btn-ghost text-sm">
                      <RefreshCw size={15} /> Retry
                    </button>
                  }
                />
              ) : listings.length === 0 ? (
                <EmptyState
                  title="No listings found"
                  description="Try different keywords or filters, or be the first to list what you have."
                  action={
                    <Link to="/create" className="btn-primary text-sm inline-flex items-center gap-2">
                      <PlusCircle size={16} />
                      List an item
                    </Link>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {listings.map((listing, i) => (
                    <ListingCard key={listing.id} listing={listing} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              aria-label="Close filters overlay"
              onClick={() => setFilterDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[#FFF8E7] border-l-[3px] border-black p-6 overflow-y-auto lg:hidden"
            >
              <FilterPanel {...filterPanelProps} onClose={() => setFilterDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
