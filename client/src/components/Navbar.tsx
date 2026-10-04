import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Compass,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  GraduationCap,
  ChevronDown,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Transaction } from '../types';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Transaction[]>([]);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/transactions/incoming')
        .then(res => setNotifications(res.data.transactions))
        .catch(console.error);
    }
  }, [isAuthenticated, location.pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAvatarMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Close avatar and notifications dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Browse', icon: Compass },
    { to: '/requests', label: 'Requests', icon: HelpCircle },
    { to: '/create', label: 'Sell', icon: PlusCircle, highlight: true },
    ...(isAuthenticated ? [{ to: '/my-listings', label: 'My Activity', icon: LayoutDashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main nav bar */}
      <div className="w-full bg-[#FFE600] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-black flex items-center justify-center text-[#FFE600] border-[2px] border-black shadow-[2px_2px_0_0_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0_0_#000] transition-all duration-100">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-black uppercase flex items-center gap-0.5">
                  Campus<span className="text-black">Swap</span>
                </span>
                <span className="text-[9px] text-black/60 font-bold tracking-widest block -mt-0.5 uppercase font-mono">
                  Student Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 border-[2px] ${isActive
                        ? 'bg-black text-[#FFE600] border-black shadow-[2px_2px_0_0_#000]'
                        : 'bg-transparent text-black border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000]'
                      }`}
                  >
                    <Icon size={14} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action / Avatar Area */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="p-2 border-[2px] border-black bg-white shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all duration-100 cursor-pointer relative"
                      aria-label="Notifications"
                    >
                      <Bell size={18} className="text-black" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF6B9D] text-white border-[2px] border-black text-[10px] font-black flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-2 w-80 bg-[#FFF8E7] border-[3px] border-black shadow-[6px_6px_0_0_#000] z-50 overflow-hidden"
                        >
                          <div className="p-3 border-b-[3px] border-black bg-[#B79CFF]">
                            <p className="text-sm font-black text-black uppercase">Notifications</p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-4 text-center text-sm font-medium text-black/60">
                                No new notifications
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <Link
                                  key={notif.id}
                                  to="/my-listings"
                                  className="block p-3 border-b-[2px] border-black/10 hover:bg-white transition-colors"
                                >
                                  <p className="text-xs font-bold text-black group-hover:text-[#00D26A] line-clamp-1">
                                    <span className="uppercase text-[#FF6B9D]">{notif.type} request</span>
                                  </p>
                                  <p className="text-xs mt-0.5 truncate text-black/80 font-medium">
                                    <span className="font-bold">{notif.buyer_name}</span> wants your "{notif.listing_title}"
                                  </p>
                                </Link>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative" ref={avatarMenuRef}>
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 border-[2px] border-black bg-white shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all duration-100 cursor-pointer"
                  >
                    <div className="w-7 h-7 bg-black text-[#FFE600] flex items-center justify-center text-xs font-black">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-black text-black max-w-[90px] truncate uppercase">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={13} strokeWidth={3} className={`text-black transition-transform duration-150 ${avatarMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Avatar Dropdown Menu */}
                  <AnimatePresence>
                    {avatarMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-64 bg-[#FFF8E7] border-[3px] border-black shadow-[6px_6px_0_0_#000] z-50 overflow-hidden"
                      >
                        {/* Profile Header */}
                        <div className="p-3 border-b-[3px] border-black bg-[#FFE600]">
                          <p className="text-sm font-black text-black truncate uppercase">{user.name}</p>
                          <p className="text-xs text-black/70 font-mono truncate mt-0.5">{user.email}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-black/70 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-black" />
                              <span className="truncate max-w-[90px]">{user.hostel}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap size={11} className="text-black" />
                              <span className="truncate max-w-[90px]">{user.batch}</span>
                            </span>
                          </div>
                        </div>

                        {/* Menu Options */}
                        <div className="flex flex-col">
                          <Link
                            to="/my-listings"
                            className="flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-black uppercase tracking-wide hover:bg-[#FFE600] transition-colors border-b-[2px] border-black/20"
                          >
                            <LayoutDashboard size={14} />
                            <span>My Dashboard & Activity</span>
                          </Link>

                          <Link
                            to="/create"
                            className="flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-black uppercase tracking-wide hover:bg-[#00D26A] transition-colors border-b-[2px] border-black/20"
                          >
                            <PlusCircle size={14} />
                            <span>Post New Resource</span>
                          </Link>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-black text-black uppercase tracking-wide hover:bg-[#FF6B9D] transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 border-[2px] bg-transparent text-black border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000]"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wide transition-all duration-100 border-[2px] bg-transparent text-black border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 border-[2px] border-black bg-black text-[#FFE600] shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all duration-100 cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="lg:hidden w-full bg-[#FFF8E7] border-b-[3px] border-black overflow-hidden"
          >
            <div className="px-4 py-5 flex flex-col gap-2">
              {isAuthenticated && user && (
                <div className="p-3 bg-[#FFE600] border-[2px] border-black shadow-[3px_3px_0_0_#000] mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-[#FFE600] flex items-center justify-center font-black text-base">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-black uppercase truncate">{user.name}</p>
                    <p className="text-xs text-black/60 font-medium truncate">{user.hostel} · {user.batch}</p>
                  </div>
                </div>
              )}

              <Link
                to="/"
                className="flex items-center gap-3 p-3 text-sm font-black text-black uppercase tracking-wide border-[2px] border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:bg-white transition-all duration-100"
              >
                <Compass size={18} />
                <span>Browse Campus Resources</span>
              </Link>

              <Link
                to="/requests"
                className="flex items-center gap-3 p-3 text-sm font-black text-black uppercase tracking-wide border-[2px] border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:bg-white transition-all duration-100"
              >
                <HelpCircle size={18} />
                <span>Student Request Board</span>
              </Link>

              <Link
                to="/create"
                className="flex items-center gap-3 p-3 text-sm font-black text-[#FFE600] uppercase tracking-wide bg-black border-[2px] border-black shadow-[3px_3px_0_0_#000]"
              >
                <PlusCircle size={18} />
                <span>Sell or Rent an Item</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/my-listings"
                    className="flex items-center gap-3 p-3 text-sm font-black text-black uppercase tracking-wide border-[2px] border-transparent hover:border-black hover:shadow-[2px_2px_0_0_#000] hover:bg-white transition-all duration-100"
                  >
                    <LayoutDashboard size={18} />
                    <span>My Activity & Dashboard</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 text-sm font-black text-black uppercase tracking-wide mt-2 border-t-[2px] border-black bg-[#FF6B9D] border-[2px] border-black shadow-[3px_3px_0_0_#000] cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-3 border-t-[2px] border-black mt-2">
                  <Link
                    to="/login"
                    className="p-3 text-center text-sm font-black text-black uppercase tracking-wide bg-white border-[2px] border-black shadow-[2px_2px_0_0_#000]"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="p-3 text-center text-sm font-black text-[#FFE600] uppercase tracking-wide bg-black border-[2px] border-black shadow-[2px_2px_0_0_#000]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
