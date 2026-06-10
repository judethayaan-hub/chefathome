import { useState, useEffect, useCallback, useRef } from "react";

// ─── Evara SVG Logo ───────────────────────────────────────────────────────────
function EvaraLogo({ size = "md", dark = false }) {
  const sizes = { sm: 22, md: 28, lg: 36, xl: 48 };
  const h = sizes[size] || 28;
  const w = h * 2.8;
  const gold = "#D4AF6A";
  const navy = dark ? "#FFFFFF" : "#1C2B4B";
  return (
    <svg width={w} height={h} viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Evara">
      <polygon points="12,4 22,4 27,14 12,28 -3,14 2,4" fill={gold} opacity="0.15" />
      <polygon points="12,4 22,4 27,14 12,24 -3,14 2,4" fill="none" stroke={gold} strokeWidth="1.5" />
      <polygon points="12,10 18,10 21,15 12,22 3,15 6,10" fill={gold} opacity="0.5" />
      <line x1="12" y1="4" x2="12" y2="24" stroke={gold} strokeWidth="0.8" opacity="0.6" />
      <line x1="2" y1="14" x2="22" y2="14" stroke={gold} strokeWidth="0.8" opacity="0.6" />
      <text x="34" y="36" fontFamily="Georgia, 'Times New Roman', serif" fontSize="32" fontWeight="700" fill={navy} letterSpacing="-1">Ev</text>
      <text x="72" y="36" fontFamily="Georgia, 'Times New Roman', serif" fontSize="32" fontWeight="700" fill={gold} letterSpacing="-1">ara</text>
      <circle cx="134" cy="32" r="3" fill={gold} />
    </svg>
  );
}

// ─── Supabase client ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://xddbvtbkfvbumiwimrwr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGJ2dGJrZnZidW1pd2ltcndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzU4NjAsImV4cCI6MjA5NjQxMTg2MH0.hvFAtNrb-uj8ELVmzvaseglwLNK930LaHFiZQflRBa8";

const sb = (() => {
  const h = { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY };
  const auth = (token) => (token ? { ...h, Authorization: `Bearer ${token}` } : h);
  const signUp = async (email, password, name) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: h, body: JSON.stringify({ email, password, data: { full_name: name }, options: { data: { full_name: name } } }) });
    return r.json();
  };
  const signIn = async (email, password) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: h, body: JSON.stringify({ email, password }) });
    return r.json();
  };
  const refreshToken = async (refresh_token) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: h, body: JSON.stringify({ refresh_token }) });
    return r.json();
  };
  const signOut = async (token) => { await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: auth(token) }); };
  const getUser = async (token) => { const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: auth(token) }); return r.json(); };
  const query = async (table, params = "", token = null, method = "GET", body = null) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { method, headers: { ...auth(token), "Content-Type": "application/json", Prefer: "return=representation" }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 204) return { data: [], error: null };
    const data = await r.json();
    if (Array.isArray(data)) return { data, error: null };
    if (data && data.error) return { data: null, error: data };
    if (!r.ok) return { data: null, error: { message: data?.message || `HTTP ${r.status}` } };
    return { data, error: null };
  };
  return { signUp, signIn, signOut, getUser, query, refreshToken };
})();

// ─── Design Tokens ────────────────────────────────────────────────────────────
const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040", warning: "#D97706",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

const STATUS_STYLE = {
  pending:           { bg: "#FFFBEB", c: "#D97706", label: "Pending" },
  confirmed:         { bg: "#EDFAF4", c: "#1A9B6C", label: "Confirmed" },
  paid:              { bg: "#E8F5FF", c: "#0369A1", label: "Payment Held" },
  release_requested: { bg: "#FFF4E5", c: "#C05621", label: "Release Requested" },
  released:          { bg: "#EDFAF4", c: "#1A9B6C", label: "Payment Released" },
  completed:         { bg: "#F0F4FF", c: "#3B4FCC", label: "Completed" },
  cancelled:         { bg: "#FEF2F2", c: "#D94040", label: "Cancelled" },
};

const CAT_LABELS = {
  chefs: "Personal Chef", catering: "Catering", wedding: "Wedding Hall",
  party: "Party Hall", sports: "Indoor Sports", djs: "DJ & Music",
  photographers: "Photography", vendors: "Event Vendor",
};
const CAT_EMOJI = {
  chefs: "👨‍🍳", catering: "🍽️", wedding: "💒", party: "🎉",
  sports: "🏸", djs: "🎧", photographers: "📷", vendors: "🎪",
};
const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "wedding", label: "Wedding Halls", emoji: "💒" },
  { id: "party", label: "Party Halls", emoji: "🎉" },
  { id: "chefs", label: "Chefs", emoji: "👨‍🍳" },
  { id: "catering", label: "Catering", emoji: "🍽️" },
  { id: "djs", label: "DJ & Music", emoji: "🎧" },
  { id: "photographers", label: "Photography", emoji: "📷" },
  { id: "sports", label: "Indoor Sports", emoji: "🏸" },
];
const VENDOR_CATEGORIES = [
  { id: "wedding", label: "Wedding Hall", emoji: "💒" },
  { id: "party", label: "Party Hall", emoji: "🎉" },
  { id: "chefs", label: "Personal Chef", emoji: "👨‍🍳" },
  { id: "catering", label: "Catering", emoji: "🍽️" },
  { id: "djs", label: "DJ & Music", emoji: "🎧" },
  { id: "photographers", label: "Photography", emoji: "📷" },
  { id: "sports", label: "Indoor Sports", emoji: "🏸" },
  { id: "vendors", label: "Event Vendor", emoji: "🎪" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" }) : "—";
const shortId = (id) => (id ? id.replace(/-/g, "").slice(0, 10).toUpperCase() : "—");

// ─── Global Styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: 100%; -webkit-text-size-adjust: 100%; }
  body { font-family: 'DM Sans', sans-serif; background: #E8E6E0; color: #1C2B4B; height: 100%; overflow-x: hidden; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
  #root { min-height: 100vh; min-height: 100dvh; background: #F5F4F1; position: relative; }
  input, textarea, select, button { font-family: inherit; }
  input[type="date"] { color-scheme: light; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #E4E1D9; border-radius: 4px; }
  @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @supports (padding-bottom: env(safe-area-inset-bottom)) { .safe-bottom { padding-bottom: env(safe-area-inset-bottom); } }
  @media (min-width: 769px) { .mobile-signin-btn { display: none !important; } }

  /* ── Responsive layout shell ── */
  .evara-shell { display: flex; min-height: 100vh; }

  /* Desktop sidebar */
  .evara-sidebar {
    width: 240px; flex-shrink: 0; background: #0C1628;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 300;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .evara-sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .evara-sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .evara-sidebar-item {
    display: flex; align-items: center; gap: 12px; padding: 11px 14px;
    border-radius: 10px; cursor: pointer; border: none; background: none;
    color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; width: 100%; text-align: left;
    transition: background .15s, color .15s;
  }
  .evara-sidebar-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
  .evara-sidebar-item.active { background: rgba(212,175,106,0.12); color: #D4AF6A; font-weight: 700; }
  .evara-sidebar-item.active svg { stroke: #D4AF6A; }
  .evara-sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
  .evara-sidebar-user { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
  .evara-sidebar-avatar { width: 34px; height: 34px; border-radius: 50%; background: #D4AF6A; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #0C1628; flex-shrink: 0; }

  /* Main content area — offset for sidebar on desktop */
  .evara-main { flex: 1; min-width: 0; }
  @media (min-width: 769px) {
    .evara-main { margin-left: 240px; }
    .evara-bottom-nav { display: none !important; }
    .evara-mobile-header-pad { padding-top: 0 !important; }
    .evara-page-header { padding-top: 32px !important; }
  }
  @media (max-width: 768px) {
    .evara-sidebar { display: none !important; }
    .evara-main { margin-left: 0; }
    .evara-bottom-nav { display: flex !important; }
  }

  /* Desktop vendor grid — 2 or 3 columns */
  @media (min-width: 900px) {
    .vendor-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
  }
  @media (min-width: 1200px) {
    .vendor-grid { grid-template-columns: repeat(3, 1fr) !important; }
  }

  /* Desktop vendor detail — wider hero, side-by-side content */
  @media (min-width: 769px) {
    .vendor-detail-hero { height: 320px !important; }
    .vendor-detail-content { max-width: 860px; margin: 0 auto; }
    .vendor-detail-grid { display: grid !important; grid-template-columns: 1fr 340px !important; gap: 24px !important; align-items: start; }
    .toast-pos { bottom: 32px !important; }
    .evara-page-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
    .evara-page-header-inner { max-width: 1100px; margin: 0 auto; padding-left: 32px; padding-right: 32px; }
    .bookings-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
    .admin-max { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  }
  @media (min-width: 1400px) {
    .vendor-detail-grid { grid-template-columns: 1fr 400px !important; }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Star: ({ filled }) => <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#D4AF6A" : "none"} stroke="#D4AF6A" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  MapPin: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ChevronLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
  Print: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>,
  LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bookmark: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Unlock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Music: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Camera: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Utensils: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/><path d="M18 16l.75 2.25L21 19l-2.25.75L18 22l-.75-2.25L15 19l2.25-.75z"/></svg>,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#E8E5DC 25%,#F0EDE4 50%,#E8E5DC 75%)", backgroundSize: "200% 100%", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success: { bg: "#EDFAF4", border: "#1A9B6C", text: "#1A9B6C" }, error: { bg: "#FEF2F2", border: "#D94040", text: "#D94040" }, info: { bg: "#E8F5FF", border: "#0369A1", text: "#0369A1" } };
  const s = colors[toast.type] || colors.info;
  return <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, color: s.text, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", animation: "slideUp .3s ease", whiteSpace: "nowrap" }}>{toast.msg}</div>;
}

function SessionExpiredBanner({ onReAuth }) {
  return <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1500, background: "#D97706", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}><span>⏱ Session expired. Please sign in again.</span><button onClick={onReAuth} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "5px 14px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sign In</button></div>;
}

// ─── Category Feature Panel ───────────────────────────────────────────────────
// Shows specialized features per service type inline on vendor detail page
function CategoryFeaturePanel({ category, vendor, onFeatureAction }) {
  const [activeFeature, setActiveFeature] = useState(null);

  const features = {
    chefs: {
      title: "Personal Chef Features",
      items: [
        { id: "menu_builder", icon: "🍽️", label: "Build Custom Menu", desc: "Choose dishes, cuisine type & dietary preferences" },
        { id: "ai_menu", icon: "✨", label: "AI Menu Suggestion", desc: "Get AI-powered menu recommendations based on your guest count & budget", highlight: true },
        { id: "dietary", icon: "🥗", label: "Dietary Preferences", desc: "Halal • Vegan • Keto • Gluten-Free options" },
        { id: "service_style", icon: "🎪", label: "Service Style", desc: "Buffet • Plated • Live Cooking stations" },
        { id: "tasting", icon: "👅", label: "Request Tasting Session", desc: "Book a tasting before your event" },
        { id: "multi_day", icon: "📅", label: "Multi-Day Booking", desc: "Book for extended events or retreats" },
        { id: "signature", icon: "⭐", label: "View Signature Dishes", desc: "Explore the chef's specialties & award dishes" },
      ]
    },
    catering: {
      title: "Catering Features",
      items: [
        { id: "qty_calculator", icon: "🧮", label: "Auto Food Quantity Calculator", desc: "Automatically calculates food quantities for your guest count", highlight: true },
        { id: "per_person", icon: "💰", label: "Per-Person Pricing Calculator", desc: "See exact cost per guest for any menu" },
        { id: "menu_compare", icon: "📊", label: "Menu Comparison", desc: "Compare buffet vs plated side by side" },
        { id: "equipment", icon: "🍳", label: "Equipment Rental", desc: "Chafing dishes, serving sets, linens & more" },
        { id: "staff", icon: "👨‍🍳", label: "Staff Requirement Selector", desc: "Choose number of servers, chefs, coordinators" },
        { id: "bulk_menu", icon: "📋", label: "Menu Customization", desc: "Mix & match from our full catalogue" },
      ]
    },
    wedding: {
      title: "Wedding Hall Features",
      items: [
        { id: "seat_planner", icon: "💺", label: "Interactive Seat Planner", desc: "Drag-and-drop seating layout for your exact guest list", highlight: true },
        { id: "availability", icon: "📅", label: "Wedding Date Availability", desc: "Real-time calendar — see open & blocked dates" },
        { id: "floor_plan", icon: "🗺️", label: "Floor Plan Viewer", desc: "Interactive hall layout with table arrangements" },
        { id: "decoration", icon: "💐", label: "Decoration Package Selector", desc: "Florals, draping, centrepieces, lighting themes" },
        { id: "bridal_room", icon: "👰", label: "Bridal Room Availability", desc: "Check private bridal suite availability" },
        { id: "parking", icon: "🚗", label: "Parking Capacity Checker", desc: "Verify parking for your expected vehicles" },
        { id: "seating", icon: "🪑", label: "Seating Capacity Checker", desc: "Find the right setup for your exact guest count" },
      ]
    },
    party: {
      title: "Party Hall Features",
      items: [
        { id: "theme_builder", icon: "🎨", label: "Theme Package Builder", desc: "Build a complete party theme from scratch", highlight: true },
        { id: "birthday_themes", icon: "🎂", label: "Birthday Themes Selection", desc: "Unicorn • Superhero • Tropical • Elegant & 50+ more" },
        { id: "capacity_calc", icon: "🧮", label: "Capacity Calculator", desc: "Find the right hall for your crowd" },
        { id: "decoration", icon: "🎊", label: "Decoration Options", desc: "Balloons, backdrops, LED setups, custom props" },
        { id: "packages", icon: "📦", label: "Party Package Selector", desc: "All-inclusive packages with food, decor & entertainment" },
        { id: "event_type", icon: "✅", label: "Event Type Compatibility", desc: "Check if this hall suits your event type" },
      ]
    },
    djs: {
      title: "DJ & Music Features",
      items: [
        { id: "playlist_collab", icon: "🎵", label: "Playlist Collaboration", desc: "Build your playlist together before the event", highlight: true },
        { id: "genre_select", icon: "🎧", label: "Music Genre Selection", desc: "R&B • Hip-Hop • Baila • Bollywood • EDM & more" },
        { id: "audio_samples", icon: "🔊", label: "Audio Sample Listening", desc: "Listen to mix samples before booking" },
        { id: "video_perform", icon: "🎥", label: "Video Performance Viewing", desc: "Watch past event highlight reels" },
        { id: "playlist_req", icon: "📝", label: "Playlist Request", desc: "Submit your must-play & do-not-play lists" },
        { id: "equipment", icon: "🎛️", label: "Equipment Package Selection", desc: "Sound system sizing based on venue capacity" },
        { id: "mc_service", icon: "🎤", label: "MC Service", desc: "Add a bilingual MC for announcements & hosting" },
      ]
    },
    photographers: {
      title: "Photography & Video Features",
      items: [
        { id: "client_gallery", icon: "🖼️", label: "Client Photo Selection Gallery", desc: "Browse proofs and mark your favourites for editing", highlight: true },
        { id: "album_style", icon: "📷", label: "Album Style Selection", desc: "Classic • Editorial • Cinematic • Documentary styles" },
        { id: "coverage", icon: "⏱️", label: "Coverage Duration Selection", desc: "Half-day • Full-day • Multi-day packages" },
        { id: "drone", icon: "🚁", label: "Drone Add-On", desc: "Aerial shots and footage for stunning perspectives" },
        { id: "livestream", icon: "📡", label: "Livestream Add-On", desc: "Stream your event live to guests worldwide" },
        { id: "raw_files", icon: "💾", label: "Raw Files Request", desc: "Request unedited RAW files with your package" },
        { id: "same_day", icon: "⚡", label: "Same-Day Edit Option", desc: "Get a highlight reel at the reception" },
      ]
    },
    sports: {
      title: "Indoor Sports Features",
      items: [
        { id: "live_slots", icon: "🔴", label: "Real-Time Slot Availability", desc: "Live calendar — book in seconds", highlight: true },
        { id: "team_recurring", icon: "🔄", label: "Recurring Team Bookings", desc: "Lock in your weekly or monthly slot", highlight: true },
        { id: "sport_select", icon: "🏸", label: "Sport Type Selection", desc: "Badminton • Futsal • Basketball • Cricket nets & more" },
        { id: "tournament", icon: "🏆", label: "Tournament Booking", desc: "Book entire grounds for leagues & tournaments" },
        { id: "equipment_rental", icon: "🎾", label: "Equipment Rental", desc: "Rackets, nets, balls — everything provided" },
        { id: "coaching", icon: "📚", label: "Coaching Request", desc: "Book a certified coach for your session" },
        { id: "membership", icon: "💳", label: "Membership Plans", desc: "Monthly & annual memberships for regular players" },
      ]
    },
  };

  const catFeatures = features[category];
  if (!catFeatures) return null;

  const [guestCount, setGuestCount] = useState(50);
  const [budget, setBudget] = useState(50000);

  // AI menu suggestion panel
  const AiMenuPanel = () => {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [cuisine, setCuisine] = useState("sri_lankan");
    const cuisines = [
      { id: "sri_lankan", label: "Sri Lankan" }, { id: "indian", label: "Indian" },
      { id: "chinese", label: "Chinese" }, { id: "continental", label: "Continental" },
      { id: "arabic", label: "Arabic" },
    ];
    const generateMenu = async () => {
      setLoading(true);
      const perPerson = Math.round(budget / guestCount);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a professional event chef menu planner. Generate a concise, practical menu for a ${cuisine.replace("_"," ")} themed event in Sri Lanka.

Details:
- Guest count: ${guestCount} guests
- Total budget: LKR ${budget.toLocaleString()} (LKR ${perPerson}/person)
- Cuisine: ${cuisine.replace("_"," ")}

Respond ONLY with a JSON object, no markdown, no explanation:
{
  "menuTitle": "string",
  "appetizers": ["item1","item2","item3"],
  "mains": ["item1","item2","item3"],
  "sides": ["item1","item2"],
  "desserts": ["item1","item2"],
  "drinks": ["item1","item2"],
  "estimatedCostPerPerson": number,
  "dietaryNote": "string (e.g. Halal-friendly, can be made vegan on request)",
  "chefTip": "string (one practical tip for this menu)"
}`
          }]
        })
      });
      const data = await response.json();
      setLoading(false);
      try {
        const text = data.content?.[0]?.text || "{}";
        const clean = text.replace(/```json|```/g,"").trim();
        setSuggestion(JSON.parse(clean));
      } catch { setSuggestion(null); }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "linear-gradient(135deg,#1C2B4B,#2a3f6b)", borderRadius: 14, padding: 16, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AI Menu Recommendation</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>GUESTS</div>
              <input type="number" value={guestCount} onChange={e=>setGuestCount(Math.max(1,+e.target.value))} style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:14 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>BUDGET (LKR)</div>
              <input type="number" value={budget} onChange={e=>setBudget(Math.max(5000,+e.target.value))} step="5000" style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:14 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>CUISINE TYPE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cuisines.map(c => (
                <button key={c.id} onClick={()=>setCuisine(c.id)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", background: cuisine===c.id ? B.accent : "rgba(255,255,255,0.1)", color: cuisine===c.id ? B.dark : "#fff", border: cuisine===c.id ? `1px solid ${B.accent}` : "1px solid rgba(255,255,255,0.15)" }}>{c.label}</button>
              ))}
            </div>
          </div>
          <button onClick={generateMenu} disabled={loading} style={{ width:"100%", padding:"11px", borderRadius:10, background: loading ? "rgba(212,175,106,0.5)" : B.accent, color: B.dark, fontWeight:700, fontSize:14, border:"none", cursor: loading?"not-allowed":"pointer" }}>
            {loading ? "Generating..." : "✨ Generate AI Menu"}
          </button>
        </div>

        {suggestion && (
          <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 17, fontWeight:700, color:B.text, marginBottom: 12 }}>{suggestion.menuTitle}</div>
            {[
              { label:"🥗 Appetizers", items: suggestion.appetizers },
              { label:"🍛 Mains", items: suggestion.mains },
              { label:"🥘 Sides", items: suggestion.sides },
              { label:"🍮 Desserts", items: suggestion.desserts },
              { label:"🥤 Drinks", items: suggestion.drinks },
            ].map(sec => (
              <div key={sec.label} style={{ marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>{sec.label}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(sec.items||[]).map((item,i) => (
                    <span key={i} style={{ background:B.accentSoft, border:`1px solid ${B.border}`, borderRadius:20, padding:"4px 10px", fontSize:12, color:B.text }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background: B.bg, borderRadius:10, padding:"10px 12px", marginTop:8 }}>
              <div style={{ fontSize:12, color:B.textMuted, marginBottom:4 }}>💡 Chef's Tip</div>
              <div style={{ fontSize:13, color:B.text }}>{suggestion.chefTip}</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, paddingTop:10, borderTop:`1px solid ${B.border}` }}>
              <div style={{ fontSize:12, color:B.textMuted }}>{suggestion.dietaryNote}</div>
              <div style={{ fontWeight:700, color:B.primary, fontSize:14 }}>≈ LKR {(suggestion.estimatedCostPerPerson||0).toLocaleString()}/person</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Food quantity calculator for catering
  const FoodQtyCalculator = () => {
    const [guests, setGuests] = useState(100);
    const [mealType, setMealType] = useState("buffet");
    const perPerson = { buffet: { rice:0.35, curry:0.2, salad:0.15, bread:2, dessert:0.15 }, plated: { rice:0.3, curry:0.18, salad:0.12, bread:1.5, dessert:0.12 } };
    const pp = perPerson[mealType];
    const qty = (v) => v >= 1000 ? `${(v/1000).toFixed(1)} kg` : `${Math.round(v)} g`;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:12 }}>🧮 Auto Food Quantity Calculator</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, color:B.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>GUESTS</div>
              <input type="number" value={guests} onChange={e=>setGuests(Math.max(10,+e.target.value))} style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none" }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:B.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>STYLE</div>
              <select value={mealType} onChange={e=>setMealType(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none", cursor:"pointer" }}>
                <option value="buffet">Buffet</option>
                <option value="plated">Plated</option>
              </select>
            </div>
          </div>
          <div style={{ background:B.bg, borderRadius:12, overflow:"hidden" }}>
            {[
              { label:"Rice / Grain", val: guests * pp.rice * 1000, unit:"" },
              { label:"Curries / Protein", val: guests * pp.curry * 1000, unit:"" },
              { label:"Salad / Veggies", val: guests * pp.salad * 1000, unit:"" },
              { label:"Bread / Rotis", val: guests * pp.bread, unit:" pcs" },
              { label:"Dessert", val: guests * pp.dessert * 1000, unit:"" },
            ].map((item,i,arr) => (
              <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom: i<arr.length-1 ? `1px solid ${B.border}` : "none" }}>
                <span style={{ fontSize:13, color:B.textMuted }}>{item.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:B.text }}>{item.unit ? `${Math.round(item.val)}${item.unit}` : qty(item.val)}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(28,43,75,0.06)", borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, color:B.textMuted }}>
            ✅ Calculated with 10% buffer for {mealType} service. Adjust with your catering manager.
          </div>
        </div>
      </div>
    );
  };

  // Interactive seat planner for weddings
  const SeatPlanner = () => {
    const [tableCount, setTableCount] = useState(8);
    const [seatsPerTable, setSeatsPerTable] = useState(10);
    const [layout, setLayout] = useState("round");
    const total = tableCount * seatsPerTable;
    const tables = Array.from({length: Math.min(tableCount,20)}, (_,i)=>i);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:12 }}>💺 Interactive Seat Planner</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, color:B.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>TABLES</div>
              <input type="number" value={tableCount} onChange={e=>setTableCount(Math.min(20,Math.max(1,+e.target.value)))} style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none" }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:B.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>SEATS/TABLE</div>
              <input type="number" value={seatsPerTable} onChange={e=>setSeatsPerTable(Math.min(20,Math.max(2,+e.target.value)))} style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["round","long","mixed"].map(l=>(
              <button key={l} onClick={()=>setLayout(l)} style={{ flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background: layout===l ? B.primary : B.bg, color: layout===l ? "#fff" : B.textMuted, border:`1.5px solid ${layout===l ? B.primary : B.border}`, textTransform:"capitalize" }}>{l}</button>
            ))}
          </div>
          <div style={{ background:B.bg, borderRadius:12, padding:14, minHeight:120, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", justifyContent:"center" }}>
            {tables.map(i=>(
              <div key={i} style={{ position:"relative", width: layout==="long"?48:36, height: layout==="long"?24:36, borderRadius: layout==="long"?6:"50%", background:"rgba(28,43,75,0.1)", border:`2px solid ${B.primary}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:B.primary }}>
                {i+1}
              </div>
            ))}
            {tableCount > 20 && <div style={{ fontSize:12, color:B.textMuted }}>+{tableCount-20} more</div>}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, padding:"10px 14px", background:"rgba(212,175,106,0.1)", borderRadius:10, border:`1px solid rgba(212,175,106,0.2)` }}>
            <span style={{ fontSize:13, color:B.textMuted }}>Total Seating Capacity</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:B.primary }}>{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // Theme builder for party halls
  const ThemeBuilder = () => {
    const [theme, setTheme] = useState("tropical");
    const themes = [
      { id:"tropical", label:"🌴 Tropical", colors:["#0EA5E9","#22C55E","#FBBF24"] },
      { id:"royal", label:"👑 Royal", colors:["#7C3AED","#D97706","#1C2B4B"] },
      { id:"pastel", label:"🌸 Pastel", colors:["#FDA4AF","#A78BFA","#6EE7B7"] },
      { id:"rustic", label:"🌾 Rustic", colors:["#92400E","#059669","#D97706"] },
      { id:"neon", label:"⚡ Neon Party", colors:["#EC4899","#06B6D4","#84CC16"] },
      { id:"classic", label:"🎩 Classic Black Tie", colors:["#1C2B4B","#D4AF6A","#FFFFFF"] },
    ];
    const active = themes.find(t=>t.id===theme);
    const elements = ["Balloon arch","Backdrop","Table centrepieces","LED lighting","Custom banner","Photo booth","Cake table","Welcome sign"];
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:12 }}>🎨 Theme Package Builder</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            {themes.map(t=>(
              <button key={t.id} onClick={()=>setTheme(t.id)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${theme===t.id ? B.primary : B.border}`, background: theme===t.id ? "rgba(28,43,75,0.04)" : B.surface, cursor:"pointer" }}>
                <span style={{ fontSize:13, fontWeight:600, color:B.text }}>{t.label}</span>
                <div style={{ display:"flex", gap:4 }}>
                  {t.colors.map((c,i)=><div key={i} style={{ width:16, height:16, borderRadius:"50%", background:c, border:"2px solid rgba(0,0,0,0.1)" }}/>)}
                </div>
              </button>
            ))}
          </div>
          {active && (
            <div style={{ background:B.bg, borderRadius:12, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Included Elements</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {elements.map(el=>(
                  <div key={el} style={{ display:"flex", alignItems:"center", gap:5, background:B.surface, border:`1px solid ${B.border}`, borderRadius:20, padding:"4px 10px" }}>
                    <span style={{ color:B.success, display:"flex" }}><Icon.Check /></span>
                    <span style={{ fontSize:12, color:B.text }}>{el}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Playlist collaboration for DJs
  const PlaylistCollabPanel = () => {
    const [tracks, setTracks] = useState([]);
    const [input, setInput] = useState("");
    const [mood, setMood] = useState("energetic");
    const moods = ["romantic","energetic","chill","traditional","mixed"];
    const addTrack = () => {
      if (!input.trim()) return;
      setTracks(prev=>[...prev, { id:Date.now(), name:input.trim(), mood }]);
      setInput("");
    };
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:12 }}>🎵 Playlist Collaboration</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            {moods.map(m=>(
              <button key={m} onClick={()=>setMood(m)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", background: mood===m ? B.primary : B.bg, color: mood===m ? "#fff" : B.textMuted, border:`1.5px solid ${mood===m ? B.primary : B.border}`, textTransform:"capitalize" }}>{m}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTrack()} placeholder="Song name or artist..." style={{ flex:1, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none" }} />
            <button onClick={addTrack} style={{ padding:"10px 16px", borderRadius:10, background:B.primary, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>+ Add</button>
          </div>
          {tracks.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:B.textMuted, fontSize:13 }}>Add songs to build your playlist</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {tracks.map((t,i)=>(
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:B.bg, borderRadius:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:B.textLight, minWidth:20 }}>{i+1}</span>
                  <span style={{ flex:1, fontSize:13, color:B.text }}>{t.name}</span>
                  <span style={{ fontSize:11, background:"rgba(212,175,106,0.2)", color:"#9C7339", borderRadius:10, padding:"2px 8px", textTransform:"capitalize" }}>{t.mood}</span>
                  <button onClick={()=>setTracks(prev=>prev.filter(x=>x.id!==t.id))} style={{ background:"none", border:"none", cursor:"pointer", color:B.textLight, display:"flex" }}><Icon.X /></button>
                </div>
              ))}
            </div>
          )}
          {tracks.length>0 && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(26,155,108,0.08)", borderRadius:10, border:"1px solid rgba(26,155,108,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:B.success, fontWeight:600 }}>✓ {tracks.length} tracks ready to share with DJ</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Client gallery selector for photographers
  const ClientGalleryPanel = () => {
    const [selected, setSelected] = useState([]);
    const mockPhotos = Array.from({length:12},(_,i)=>({ id:i+1, url:`https://picsum.photos/seed/photo${i+1}evara/200/200`, label:`Shot ${i+1}` }));
    const toggle = (id) => setSelected(prev=>prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:B.text }}>🖼️ Client Gallery — Select Favourites</div>
            <div style={{ fontSize:12, fontWeight:600, color:B.accent }}>{selected.length} selected</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {mockPhotos.map(p=>(
              <div key={p.id} onClick={()=>toggle(p.id)} style={{ position:"relative", aspectRatio:"1", borderRadius:10, overflow:"hidden", cursor:"pointer", border:`2px solid ${selected.includes(p.id) ? B.accent : "transparent"}` }}>
                <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, #${((p.id*37)%255).toString(16).padStart(2,"0")}4${((p.id*73)%255).toString(16).padStart(2,"0")}8f, #1C2B4B)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                  {["📷","🌅","👨‍👩‍👧","🌸","🎊","🕯️","💃","🏛️","🌟","🥂","💒","🎆"][p.id-1]}
                </div>
                {selected.includes(p.id) && (
                  <div style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", background:B.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:B.dark, display:"flex" }}><Icon.Check /></span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {selected.length>0 && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(212,175,106,0.1)", borderRadius:10, border:`1px solid rgba(212,175,106,0.25)`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:B.text, fontWeight:600 }}>{selected.length} photos marked for editing</span>
              <button onClick={()=>setSelected([])} style={{ fontSize:12, color:B.textMuted, background:"none", border:"none", cursor:"pointer" }}>Clear</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Real-time slot booking for sports
  const SlotBookingPanel = () => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const slots = ["6am","7am","8am","9am","10am","4pm","5pm","6pm","7pm","8pm"];
    const booked = [0,1,3,7,12,18,22,28,35,42]; // indices of "taken" slots
    const [selected, setSelected] = useState(null);
    let idx = 0;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:4 }}>🔴 Real-Time Slot Availability</div>
          <div style={{ fontSize:12, color:B.textMuted, marginBottom:14 }}>This week — tap to select</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:"4px 6px", color:B.textMuted, textAlign:"left", fontWeight:600 }}>Time</th>
                  {days.map(d=><th key={d} style={{ padding:"4px 6px", color:B.textMuted, fontWeight:600, textAlign:"center" }}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {slots.map(slot=>(
                  <tr key={slot}>
                    <td style={{ padding:"4px 6px", fontWeight:600, color:B.text, fontSize:11, whiteSpace:"nowrap" }}>{slot}</td>
                    {days.map(day=>{
                      const i = idx++;
                      const taken = booked.includes(i);
                      const isSelected = selected===`${day}-${slot}`;
                      return (
                        <td key={day} style={{ padding:"3px 4px", textAlign:"center" }}>
                          <div onClick={()=>!taken&&setSelected(`${day}-${slot}`)} style={{ width:28, height:22, borderRadius:6, margin:"0 auto", background: taken ? "#FEF2F2" : isSelected ? B.accent : "#EDFAF4", border:`1px solid ${taken?"#D9404033":isSelected?B.accent:"rgba(26,155,108,0.25)"}`, cursor: taken?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color: taken?B.danger:isSelected?B.dark:B.success }} >
                            {taken?"●":isSelected?"✓":""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:12, fontSize:11 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:14,height:14,borderRadius:4,background:"#EDFAF4",border:"1px solid rgba(26,155,108,0.25)" }}/><span style={{ color:B.textMuted }}>Available</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:14,height:14,borderRadius:4,background:"#FEF2F2",border:"1px solid #D9404033" }}/><span style={{ color:B.textMuted }}>Taken</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:14,height:14,borderRadius:4,background:B.accent }}/><span style={{ color:B.textMuted }}>Your pick</span></div>
          </div>
          {selected && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(212,175,106,0.1)", borderRadius:10, border:`1px solid rgba(212,175,106,0.25)`, fontSize:13, fontWeight:600, color:B.text }}>
              Selected: {selected.replace("-"," at ")} — proceed to booking
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActiveFeature = () => {
    if (!activeFeature) return null;
    const map = {
      ai_menu: <AiMenuPanel />,
      qty_calculator: <FoodQtyCalculator />,
      seat_planner: <SeatPlanner />,
      theme_builder: <ThemeBuilder />,
      playlist_collab: <PlaylistCollabPanel />,
      client_gallery: <ClientGalleryPanel />,
      live_slots: <SlotBookingPanel />,
      team_recurring: <SlotBookingPanel />,
    };
    if (map[activeFeature]) return map[activeFeature];
    // Generic info panel for non-interactive features
    const feature = catFeatures.items.find(f=>f.id===activeFeature);
    if (!feature) return null;
    return (
      <div style={{ background: B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
        <div style={{ fontSize:18, marginBottom:8 }}>{feature.icon}</div>
        <div style={{ fontSize:16, fontWeight:700, color:B.text, marginBottom:6 }}>{feature.label}</div>
        <div style={{ fontSize:14, color:B.textMuted, lineHeight:1.6 }}>{feature.desc}</div>
        <div style={{ marginTop:14, padding:"10px 14px", background:B.bg, borderRadius:10, fontSize:13, color:B.textMuted }}>
          This feature is available when you book — your requirements will be customised with the vendor.
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
        {catFeatures.title}
      </div>
      {activeFeature ? (
        <div>
          <button onClick={()=>setActiveFeature(null)} style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:B.textMuted, background:"none", border:"none", cursor:"pointer", marginBottom:12, fontWeight:600 }}>
            ← Back to features
          </button>
          {renderActiveFeature()}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {catFeatures.items.map(feat=>(
            <button key={feat.id} onClick={()=>setActiveFeature(feat.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background: feat.highlight ? "rgba(212,175,106,0.08)" : B.surface, borderRadius:12, border:`1.5px solid ${feat.highlight ? "rgba(212,175,106,0.35)" : B.border}`, cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{feat.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, display:"flex", alignItems:"center", gap:6 }}>
                  {feat.label}
                  {feat.highlight && <span style={{ fontSize:10, background:"rgba(212,175,106,0.2)", color:"#9C7339", borderRadius:10, padding:"2px 8px", fontWeight:700 }}>PREMIUM</span>}
                </div>
                <div style={{ fontSize:12, color:B.textMuted, marginTop:2 }}>{feat.desc}</div>
              </div>
              <span style={{ color:B.textLight, flexShrink:0, display:"flex" }}><Icon.ChevronRight /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Support Widget ───────────────────────────────────────────────────────────
const SUPPORT_WHATSAPP = "https://wa.me/94768161428";
const SUPPORT_EMAIL = "mailto:support@evara.lk";
const HELP_TOPICS = [
  { id: "booking", label: "Booking", emoji: "📅", answers: [
    { q: "How do I make a booking?", a: "Go to Explore, pick a vendor, choose your date and guests, then tap Book Now. You'll get a confirmation once the vendor accepts." },
    { q: "Can I cancel a booking?", a: "Yes. Go to My Bookings, open the booking, and tap Cancel. Cancellation policies vary by vendor." },
    { q: "How do I check my booking status?", a: "Open My Bookings from the bottom nav. Each booking shows its current status — Pending, Confirmed, Paid, etc." },
    { q: "Booking not confirmed?", a: "Vendors have 24 hours to confirm. If no response, contact support and we'll follow up immediately." },
  ]},
  { id: "payment", label: "Pricing & Payment", emoji: "💳", answers: [
    { q: "How does payment work?", a: "Payment is held in escrow after confirmation. It's released to the vendor only after your event is completed successfully." },
    { q: "What payment methods are accepted?", a: "We accept all major cards and bank transfers via our secure PayHere gateway." },
    { q: "When is payment released to the vendor?", a: "Once you confirm the event was completed, or after 72hrs automatically. You can request early release from My Bookings." },
  ]},
  { id: "vendors", label: "Vendors", emoji: "🏪", answers: [
    { q: "Are all vendors verified?", a: "Yes. Every vendor goes through ID verification, certificate checks, and service portfolio review before listing." },
    { q: "How are ratings calculated?", a: "Ratings are based on verified booking reviews only — guests who actually completed an event with that vendor." },
  ]},
];
const ISSUE_OPTIONS = [
  { id: "no_show", label: "Vendor didn't show up", emoji: "🚫", urgent: true },
  { id: "quality", label: "Service quality issues", emoji: "⚠️", urgent: false },
  { id: "payment", label: "Payment / billing dispute", emoji: "💳", urgent: false },
  { id: "cancel", label: "Vendor cancelled last minute", emoji: "❌", urgent: true },
  { id: "other", label: "Other issue", emoji: "💬", urgent: false },
];

function SupportWidget({ user, token }) {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeQ, setActiveQ] = useState(null);
  const [reportStep, setReportStep] = useState("id_entry");
  const [bookingId, setBookingId] = useState("");
  const [verifiedBkg, setVerifiedBkg] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [reportIssue, setReportIssue] = useState(null);
  const [reportMsg, setReportMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(SUPPORT_WHATSAPP);

  const reset = () => { setScreen("home"); setActiveTopic(null); setActiveQ(null); setReportStep("id_entry"); setBookingId(""); setVerifiedBkg(null); setVerifyError(""); setReportIssue(null); setReportMsg(""); };
  const back = () => {
    if (screen==="answer") setScreen("topic");
    else if (screen==="topic") setScreen("help");
    else if (screen==="report" && reportStep==="form") setReportStep("issue_pick");
    else if (screen==="report" && reportStep==="issue_pick") setReportStep("id_entry");
    else if (screen==="report" && reportStep==="id_verified") setReportStep("id_entry");
    else setScreen("home");
  };

  const verifyBooking = async () => {
    const raw = bookingId.trim();
    if (!raw) return;
    setVerifying(true); setVerifyError("");
    const { data } = await sb.query("bookings", `?select=*,vendors(name,category,location)`, token || null);
    setVerifying(false);
    const match = (data||[]).find(b => b.id.replace(/-/g,"").slice(0,10).toUpperCase() === raw.toUpperCase() || b.id.toUpperCase() === raw.toUpperCase());
    if (match) { setVerifiedBkg(match); setReportStep("id_verified"); }
    else setVerifyError("Booking not found. Check your ID or skip below.");
  };

  const sendReport = async () => {
    setSending(true);
    const body = { issue_label: reportIssue?.label, message: reportMsg, is_urgent: reportIssue?.urgent, user_email: user?.email, vendor_name: verifiedBkg?.vendors?.name, booking_id: verifiedBkg?.id, status: "open" };
    await sb.query("support_tickets","",token||null,"POST",body);
    setSending(false);
    const wa = encodeURIComponent(`[Evara Support] Issue: ${reportIssue?.label}\n${verifiedBkg ? `Booking: #${shortId(verifiedBkg.id)}` : ""}\n\n${reportMsg}`);
    setWhatsappUrl(`${SUPPORT_WHATSAPP}?text=${wa}`);
    setReportStep("done");
  };

  const greetName = user?.user_metadata?.full_name?.split(" ")[0] || "";
  const W = {
    panel: { position:"fixed", bottom:82, right:12, zIndex:900, width:310, maxHeight:480, background:"#0F1C33", borderRadius:20, border:"1px solid rgba(212,175,106,0.2)", boxShadow:"0 24px 60px rgba(0,0,0,0.5)", display:"flex", flexDirection:"column", overflow:"hidden", animation:"slideUp .3s ease" },
    header: { background:"linear-gradient(135deg,#1C2B4B,#162038)", padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 },
    avatar: { width:36, height:36, borderRadius:"50%", background:"rgba(212,175,106,0.2)", border:"1px solid rgba(212,175,106,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
    body: { padding:"14px 14px 16px", overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:8 },
    bubble: { background:"rgba(255,255,255,0.06)", borderRadius:"12px 12px 12px 4px", padding:"10px 12px", fontSize:12, color:"rgba(255,255,255,0.75)", lineHeight:1.55 },
    row: { background:"#1E2840", borderRadius:12, padding:"12px 14px", cursor:"pointer", border:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:10 },
    rowIcon: { width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
    rowLabel: { fontSize:13, fontWeight:600, color:"#fff" },
    rowSub: { fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 },
    backBtn: { display:"flex", alignItems:"center", gap:4, fontSize:12, color:"rgba(255,255,255,0.4)", cursor:"pointer", marginBottom:4, fontWeight:600, background:"none", border:"none" },
    input: { width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.12)", background:"#1E2840", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box", letterSpacing:1 },
  };

  return (
    <>
      <button onClick={()=>{ setOpen(o=>!o); if(open) reset(); }} style={{ position:"fixed", bottom:20, right:16, zIndex:901, width:52, height:52, borderRadius:"50%", background: open ? B.dark : B.primary, border:`2px solid ${B.accent}`, boxShadow:"0 6px 24px rgba(28,43,75,0.45)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s" }}>
        {open
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF6A" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      </button>
      {open && (
        <div style={W.panel}>
          <div style={W.header}>
            <div style={W.avatar}>🌟</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Evara Support</div>
              <div style={{ fontSize:11, color:"#4ADE80", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", display:"inline-block" }}/>Online now · 9am–9pm
              </div>
            </div>
            <button onClick={()=>{ setOpen(false); reset(); }} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={W.body}>
            {screen !== "home" && (
              <button onClick={back} style={W.backBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>Back
              </button>
            )}
            <div style={{ display:"flex", gap:8, marginBottom:4 }}>
              <div style={{ ...W.avatar, width:28, height:28, fontSize:13, flexShrink:0, marginTop:2 }}>🌟</div>
              <div style={W.bubble}>
                {screen==="home" && <span>👋 Hi{greetName?`, ${greetName}`:""} Welcome to <strong>Evara Support</strong>. How can we help?</span>}
                {screen==="help" && <span>📚 Choose a topic:</span>}
                {screen==="topic" && <span>Questions about <strong>{HELP_TOPICS.find(t=>t.id===activeTopic)?.label}</strong>:</span>}
                {screen==="answer" && <span style={{ fontWeight:700 }}>{activeQ?.q}</span>}
                {screen==="contact" && <span>Reach us directly:</span>}
                {screen==="report" && reportStep==="id_entry" && <span>Enter your <strong>Booking ID</strong> to look it up.</span>}
                {screen==="report" && reportStep==="id_verified" && <span>✅ Booking found! What's the issue?</span>}
                {screen==="report" && reportStep==="issue_pick" && <span>What type of issue are you facing?</span>}
                {screen==="report" && reportStep==="form" && <span>Tell us more about "<strong>{reportIssue?.label}</strong>".</span>}
                {screen==="report" && reportStep==="done" && <span>✅ Report received! We'll respond within <strong>2 hours</strong>.{reportIssue?.urgent?" 🚨 Marked urgent.":""}</span>}
              </div>
            </div>
            {screen==="answer" && activeQ && <div style={{ ...W.bubble, background:"rgba(212,175,106,0.12)", border:"1px solid rgba(212,175,106,0.2)", marginLeft:36 }}>{activeQ.a}</div>}
            {screen==="home" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4 }}>
                  {[{id:"help",emoji:"🆘",label:"Help Center",sub:"Browse FAQs"},{id:"contact",emoji:"📞",label:"Contact Us",sub:"Reach our team"}].map(({id,emoji,label,sub})=>(
                    <div key={id} onClick={()=>setScreen(id)} style={{ background:"#1E2840", borderRadius:12, padding:"14px 12px", cursor:"pointer", border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:22, marginBottom:6 }}>{emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{label}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div onClick={()=>setScreen("report")} style={{ background:"#1E2840", borderRadius:12, padding:"14px 12px", cursor:"pointer", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:22 }}>🚨</div>
                  <div><div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Report an Issue</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Flag a problem with a booking</div></div>
                </div>
              </>
            )}
            {screen==="help" && HELP_TOPICS.map(topic=>(
              <div key={topic.id} onClick={()=>{ setActiveTopic(topic.id); setScreen("topic"); }} style={W.row}>
                <div style={{ ...W.rowIcon, background:"rgba(212,175,106,0.12)" }}>{topic.emoji}</div>
                <div><div style={W.rowLabel}>{topic.label}</div><div style={W.rowSub}>{topic.answers.length} articles</div></div>
                <svg style={{ marginLeft:"auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
            {screen==="topic" && HELP_TOPICS.find(t=>t.id===activeTopic)?.answers.map((item,i)=>(
              <div key={i} onClick={()=>{ setActiveQ(item); setScreen("answer"); }} style={W.row}>
                <div style={W.rowLabel}>{item.q}</div>
                <svg style={{ marginLeft:"auto", flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
            {screen==="answer" && <button onClick={()=>setScreen("contact")} style={{ width:"100%", padding:"10px", borderRadius:10, background:B.primary, color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>Still need help?</button>}
            {screen==="contact" && (
              <>
                <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer" style={{ ...W.row, textDecoration:"none", background:"#1A3D2B", border:"1px solid rgba(74,222,128,0.2)" }}>
                  <div style={{ ...W.rowIcon, background:"rgba(74,222,128,0.15)", fontSize:20 }}>💬</div>
                  <div><div style={{ ...W.rowLabel, color:"#4ADE80" }}>WhatsApp Us</div><div style={W.rowSub}>+94 76 816 1428 · 9am–9pm</div></div>
                </a>
                <a href={SUPPORT_EMAIL} style={{ ...W.row, textDecoration:"none" }}>
                  <div style={{ ...W.rowIcon, background:"rgba(212,175,106,0.15)", fontSize:20 }}>📧</div>
                  <div><div style={W.rowLabel}>Email Support</div><div style={W.rowSub}>support@evara.lk</div></div>
                </a>
              </>
            )}
            {screen==="report" && reportStep==="id_entry" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input value={bookingId} onChange={e=>{setBookingId(e.target.value);setVerifyError("");}} onKeyDown={e=>e.key==="Enter"&&verifyBooking()} placeholder="e.g. A1B2C3D4E5" maxLength={12} style={W.input}/>
                {verifyError && <div style={{ fontSize:12, color:"#F87171", fontWeight:600 }}>{verifyError}</div>}
                <button onClick={verifyBooking} disabled={!bookingId.trim()||verifying} style={{ width:"100%", padding:"11px", borderRadius:10, background:B.primary, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:bookingId.trim()&&!verifying?"pointer":"not-allowed", opacity:!bookingId.trim()?0.5:1 }}>{verifying?"Verifying…":"Verify Booking"}</button>
                <button onClick={()=>{ setVerifiedBkg(null); setReportStep("issue_pick"); }} style={{ width:"100%", padding:"10px", borderRadius:10, background:"transparent", color:"rgba(255,255,255,0.35)", fontWeight:600, fontSize:12, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer" }}>I don't have my Booking ID</button>
              </div>
            )}
            {screen==="report" && reportStep==="id_verified" && verifiedBkg && (
              <>
                <div style={{ background:"rgba(26,155,108,0.1)", border:"1px solid rgba(26,155,108,0.3)", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#4ADE80" }}>✓ Booking Verified #{shortId(verifiedBkg.id)}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginTop:4 }}>{verifiedBkg.vendors?.name}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{formatDate(verifiedBkg.event_date)}</div>
                </div>
                <button onClick={()=>setReportStep("issue_pick")} style={{ width:"100%", padding:"12px", borderRadius:10, background:B.danger, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>Report an Issue with this Booking →</button>
              </>
            )}
            {screen==="report" && reportStep==="issue_pick" && (
              <>
                {verifiedBkg && <div style={{ background:"rgba(26,155,108,0.1)", border:"1px solid rgba(26,155,108,0.3)", borderRadius:12, padding:"10px 12px", fontSize:12, fontWeight:600, color:"#4ADE80" }}>✓ {verifiedBkg.vendors?.name}</div>}
                {ISSUE_OPTIONS.map(issue=>(
                  <div key={issue.id} onClick={()=>{ setReportIssue(issue); setReportStep("form"); }} style={{ ...W.row, border: issue.urgent?"1px solid rgba(217,64,64,0.3)":"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ ...W.rowIcon, background: issue.urgent?"rgba(217,64,64,0.12)":"rgba(212,175,106,0.08)", fontSize:18 }}>{issue.emoji}</div>
                    <div style={{ flex:1 }}><div style={W.rowLabel}>{issue.label}</div>{issue.urgent && <div style={{ fontSize:10, color:"#F87171", fontWeight:700 }}>URGENT</div>}</div>
                    <svg style={{ marginLeft:"auto", flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                ))}
              </>
            )}
            {screen==="report" && reportStep==="form" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"#1E2840", borderRadius:10, padding:"10px 12px", display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:18 }}>{reportIssue?.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)" }}>{reportIssue?.label}</span>
                  {reportIssue?.urgent && <span style={{ marginLeft:"auto", fontSize:10, color:"#F87171", fontWeight:700, background:"rgba(217,64,64,0.15)", padding:"2px 7px", borderRadius:6 }}>URGENT</span>}
                </div>
                <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Describe what happened…" style={{ ...W.input, minHeight:100, resize:"vertical", letterSpacing:0, lineHeight:1.5 }}/>
                <button onClick={sendReport} disabled={!reportMsg.trim()||sending} style={{ width:"100%", padding:"12px", borderRadius:10, background: reportIssue?.urgent?B.danger:B.primary, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:reportMsg.trim()&&!sending?"pointer":"not-allowed", opacity:!reportMsg.trim()||sending?0.5:1 }}>
                  {sending?"Submitting…":reportIssue?.urgent?"🚨 Submit Urgent Report":"Submit Report"}
                </button>
              </div>
            )}
            {screen==="report" && reportStep==="done" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ background:"rgba(26,155,108,0.1)", border:"1px solid rgba(26,155,108,0.3)", borderRadius:12, padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:6 }}>✅</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#4ADE80" }}>Report Submitted</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{reportIssue?.urgent?"Reviewed within 1 hour.":"We'll respond within 2 hours."}</div>
                </div>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ ...W.row, textDecoration:"none", background:"#1A3D2B", border:"1px solid rgba(74,222,128,0.2)" }}>
                  <div style={{ ...W.rowIcon, background:"rgba(74,222,128,0.15)", fontSize:18 }}>💬</div>
                  <div><div style={{ ...W.rowLabel, color:"#4ADE80" }}>Chat on WhatsApp</div><div style={W.rowSub}>Opens with your report pre-filled</div></div>
                </a>
                <button onClick={reset} style={{ width:"100%", padding:"10px", borderRadius:10, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", fontWeight:600, fontSize:13, border:"none", cursor:"pointer" }}>Back to Home</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
function Receipt({ booking, onClose }) {
  if (!booking) return null;
  const platformFee = Math.round(((booking.amount||0)*0.05)/1.05);
  const baseAmount = (booking.amount||0)-platformFee;
  const statusStyle = STATUS_STYLE[booking.status]||STATUS_STYLE.pending;
  const vendorName = booking.vendors?.name||booking.vendor_name||"Vendor";
  const vendorCat = booking.vendors?.category||"vendors";
  const vendorLoc = booking.vendors?.location||booking.location||"—";
  const receiptNum = shortId(booking.id);
  const handlePrint = () => {
    const el = document.getElementById("evara-receipt-content");
    const pw = window.open("","_blank","width=700,height=900");
    pw.document.write(`<!DOCTYPE html><html><head><title>Evara Receipt #${receiptNum}</title><style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;padding:32px;max-width:600px;margin:0 auto}</style></head><body>${el.innerHTML}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
    pw.document.close();
  };
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(12,22,40,0.65)", backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", alignItems:"flex-end", justifyContent:"center", pointerEvents:"none" }}>
        <div style={{ width:"100%", maxWidth:480, maxHeight:"92vh", background:B.bg, borderRadius:"22px 22px 0 0", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents:"all", animation:"slideUp .35s cubic-bezier(.22,1,.36,1) both" }}>
          <div style={{ padding:"16px 20px", background:B.surface, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:B.text }}>Booking Receipt</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handlePrint} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.surface, color:B.text, fontSize:13, fontWeight:600, cursor:"pointer" }}><Icon.Print/> Download</button>
              <button onClick={onClose} style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${B.border}`, background:B.surface, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:B.textMuted }}><Icon.X/></button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1, padding:"20px 16px 40px" }}>
            <div id="evara-receipt-content">
              <div style={{ background:B.dark, borderRadius:16, padding:"24px 24px 20px", marginBottom:14, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(212,175,106,0.1)" }}/>
                <div style={{ marginBottom:4 }}><EvaraLogo size="md" dark/></div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>Official Booking Receipt</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>Receipt No.</div>
                    <div style={{ fontSize:18, fontWeight:700, color:B.accent, letterSpacing:1 }}>#{receiptNum}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>Issued On</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>{formatDate(booking.created_at)}</div>
                  </div>
                </div>
              </div>
              <div style={{ background:statusStyle.bg, border:`1px solid ${statusStyle.c}33`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:"50%", background:statusStyle.c }}/><span style={{ fontSize:13, fontWeight:600, color:statusStyle.c }}>{statusStyle.label}</span></div>
                <span style={{ fontSize:11, color:B.textMuted }}>{booking.status?.toUpperCase()}</span>
              </div>
              <div style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Service Provider</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${B.border}`, fontSize:22 }}>{CAT_EMOJI[vendorCat]||"🎪"}</div>
                  <div><div style={{ fontWeight:700, fontSize:16, color:B.text, marginBottom:2 }}>{vendorName}</div><div style={{ fontSize:12, color:B.textMuted }}>{CAT_LABELS[vendorCat]||vendorCat} · {vendorLoc}</div></div>
                </div>
              </div>
              <div style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Event Details</div>
                {[
                  ["Event Date", formatDate(booking.event_date)],
                  ["Event Type", booking.event_type||"—"],
                  ["Guests", booking.guests?`${booking.guests} guests`:"—"],
                  ["Location", booking.location||"—"],
                  ["Package", booking.package||"—"],
                  booking.notes?["Notes",booking.notes]:null,
                ].filter(Boolean).map(([label,value],i,arr)=>(
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${B.border}`:"none" }}>
                    <span style={{ fontSize:13, color:B.textMuted, flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:B.text, textAlign:"right", wordBreak:"break-word", maxWidth:"60%" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Payment Summary</div>
                {[["Service Amount",`LKR ${baseAmount.toLocaleString()}`],["Platform Fee (5%)",`LKR ${platformFee.toLocaleString()}`]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${B.border}` }}>
                    <span style={{ fontSize:13, color:B.textMuted }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:B.text }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0 0" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:B.text }}>Total</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:B.primary }}>LKR {(booking.amount||0).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ background:B.accentSoft, borderRadius:12, padding:"12px 16px", border:`1px solid ${B.border}`, display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ display:"flex", color:B.success, marginTop:1 }}><Icon.Shield/></span>
                <div><div style={{ fontSize:12, fontWeight:700, color:B.text }}>Escrow Protected</div><div style={{ fontSize:11, color:B.textMuted, marginTop:2 }}>Payment held safely until your event is complete.</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ vendor, user, token, onClose, onSuccess }) {
  const packages = ["Basic","Standard","Premium"];
  const PRICE_MAP = { Basic: vendor.base_price||15000, Standard: Math.round((vendor.base_price||15000)*1.5), Premium: Math.round((vendor.base_price||15000)*2.5) };
  const [form, setForm] = useState({ event_date:"", event_type:"", guests:"", location: vendor.location||"", package:"Standard", notes:"", amount: PRICE_MAP.Standard });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handlePackageChange = (pkg) => setForm(f=>({ ...f, package:pkg, amount: PRICE_MAP[pkg]||f.amount }));
  const handleSubmit = async () => {
    if (!form.event_date||!form.event_type||!form.guests) { setError("Please fill in all required fields."); return; }
    setLoading(true); setError("");
    const { error: err } = await sb.query("bookings","",token,"POST",{ vendor_id: vendor.id, user_id: user.id, event_date: form.event_date, event_type: form.event_type, guests: parseInt(form.guests)||0, location: form.location, package: form.package, notes: form.notes, amount: form.amount, status:"pending" });
    setLoading(false);
    if (err) { setError(err.message||"Booking failed. Please try again."); return; }
    onSuccess();
  };
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(12,22,40,0.65)", backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", alignItems:"flex-end", justifyContent:"center", pointerEvents:"none" }}>
        <div style={{ width:"100%", maxWidth:480, maxHeight:"92vh", background:B.bg, borderRadius:"22px 22px 0 0", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents:"all", animation:"slideUp .35s cubic-bezier(.22,1,.36,1) both" }}>
          <div style={{ padding:"16px 20px", background:B.surface, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:B.text }}>{vendor.name}</div>
              <div style={{ fontSize:12, color:B.textMuted }}>{CAT_LABELS[vendor?.category]||vendor?.category}</div>
            </div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${B.border}`, background:B.surface, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:B.textMuted }}><Icon.X/></button>
          </div>
          <div style={{ overflowY:"auto", flex:1, padding:"20px 16px 32px", display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:B.textMuted, marginBottom:8, textTransform:"uppercase", letterSpacing:0.8 }}>Select Package</div>
              <div style={{ display:"flex", gap:8 }}>
                {packages.map(pkg=>(
                  <button key={pkg} onClick={()=>handlePackageChange(pkg)} style={{ flex:1, padding:"10px 8px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", background: form.package===pkg ? B.primary : B.surface, color: form.package===pkg ? "#fff" : B.text, border:`1.5px solid ${form.package===pkg ? B.primary : B.border}` }}>
                    {pkg}<div style={{ fontSize:11, fontWeight:400, marginTop:2, opacity:0.75 }}>LKR {(PRICE_MAP[pkg]||0).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
            {[{key:"event_date",label:"Event Date *",type:"date"},{key:"event_type",label:"Event Type *",type:"text",placeholder:"Wedding, Birthday, Corporate..."},{key:"guests",label:"Number of Guests *",type:"number",placeholder:"e.g. 150"},{key:"location",label:"Event Location",type:"text",placeholder:vendor?.location||"Venue address"}].map(({key,label,type,placeholder})=>(
              <div key={key}>
                <div style={{ fontSize:12, fontWeight:600, color:B.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{label}</div>
                <input type={type} value={form[key]} placeholder={placeholder} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.surface, fontSize:14, color:B.text, outline:"none" }}/>
              </div>
            ))}
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:B.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>Special Notes</div>
              <textarea value={form.notes} placeholder="Any special requests or requirements..." onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.surface, fontSize:14, color:B.text, outline:"none", resize:"none" }}/>
            </div>
            {error && <div style={{ background:"#FEF2F2", border:"1px solid #D94040", borderRadius:10, padding:"10px 14px", fontSize:13, color:B.danger }}>{error}</div>}
            <div style={{ background:B.dark, borderRadius:14, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Total Amount</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:B.accent }}>LKR {form.amount.toLocaleString()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>incl. 5% platform fee · Escrow protected</div>
              </div>
              <button onClick={handleSubmit} disabled={loading} style={{ padding:"12px 24px", borderRadius:12, background:B.accent, color:B.dark, fontWeight:700, fontSize:14, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
                {loading?"Booking…":"Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Category-Specific Packages ──────────────────────────────────────────────
function CategoryPackages({ vendor }) {
  const base = vendor.base_price || 15000;
  const cat = vendor.category;

  const PACKAGES = {
    chefs: [
      { name:"Essentials", multiplier:1, popular:false, icon:"🍽️",
        features:["Up to 25 guests","3-course set menu","Basic equipment","1 chef + 1 assistant","Service: 4 hours"] },
      { name:"Signature", multiplier:1.8, popular:true, icon:"👨‍🍳",
        features:["Up to 80 guests","5-course custom menu","Full equipment set","2 chefs + 2 assistants","Dietary options incl.","Service: 7 hours","Menu tasting session"] },
      { name:"Grand Chef", multiplier:3, popular:false, icon:"⭐",
        features:["Unlimited guests","7-course gourmet menu","Premium equipment","Full brigade team","Live cooking stations","Bar & beverage service","Service: full day","Post-event cleanup"] },
    ],
    catering: [
      { name:"Buffet Classic", multiplier:1, popular:false, icon:"🍛",
        features:["Min. 50 guests","10 buffet dishes","Basic serving ware","2 servers","Food warmers incl.","4-hour service"] },
      { name:"Buffet Royal", multiplier:1.6, popular:true, icon:"🍽️",
        features:["Min. 100 guests","20 dishes incl. live stations","Full serving equipment","5 servers + supervisor","Dessert table","Beverage station","6-hour service","Setup & cleanup"] },
      { name:"Corporate Full", multiplier:2.5, popular:false, icon:"🏆",
        features:["Any guest count","Custom menu design","Premium tableware rental","Full staff team","Multiple live stations","Bar service","All-day coverage","Logistics & transport"] },
    ],
    wedding: [
      { name:"Silver", multiplier:1, popular:false, icon:"💍",
        features:["Up to 150 guests","6-hour hall rental","Basic décor package","1 bridal room","100 car parking","Standard lighting","Tables & chairs incl."] },
      { name:"Gold", multiplier:2, popular:true, icon:"💒",
        features:["Up to 300 guests","10-hour hall rental","Premium floral décor","Bridal suite + groom room","200 car parking","LED uplighting","Custom centrepieces","Sound system incl.","Coordination team"] },
      { name:"Platinum", multiplier:3.5, popular:false, icon:"👑",
        features:["Unlimited guests","Full-day exclusive use","Luxury décor & draping","All VIP suites","Valet parking","Stage & AV setup","Outdoor garden access","Dedicated wedding planner","Catering coordination"] },
    ],
    party: [
      { name:"Starter", multiplier:1, popular:false, icon:"🎈",
        features:["Up to 40 guests","4-hour rental","Basic balloon décor","Standard sound system","1 staff on site","Tables & chairs"] },
      { name:"Celebration", multiplier:1.7, popular:true, icon:"🎉",
        features:["Up to 100 guests","6-hour rental","Full theme decoration","Premium sound + DJ setup","2 staff on site","Custom backdrop","Cake table setup","LED lighting"] },
      { name:"Mega Party", multiplier:2.8, popular:false, icon:"🏆",
        features:["Unlimited guests","Full-day rental","Custom theme build-out","Professional DJ & MC","Full event staff","Photo booth setup","Outdoor area access","Catering coordination"] },
    ],
    djs: [
      { name:"Essential", multiplier:1, popular:false, icon:"🎵",
        features:["3-hour set","Standard sound system","Basic lighting rig","1 DJ","Pre-event playlist call","Music: 1 genre focus"] },
      { name:"Pro Night", multiplier:1.8, popular:true, icon:"🎧",
        features:["5-hour set","Premium JBL/QSC system","LED moving lights","1 DJ + assistant","Playlist collaboration","All genres covered","Wireless mic for MC","Setup & soundcheck"] },
      { name:"Festival", multiplier:3, popular:false, icon:"🎛️",
        features:["Full-day / full-night","Concert-grade sound","Full light & haze show","2 DJs (back-to-back)","Live remixing","Crowd hype MC","Social media live stream","Custom intro & branding"] },
    ],
    photographers: [
      { name:"Moments", multiplier:1, popular:false, icon:"📷",
        features:["4-hour coverage","1 photographer","100 edited photos","Online gallery delivery","7-day turnaround","1 location"] },
      { name:"Story", multiplier:1.9, popular:true, icon:"🎥",
        features:["8-hour coverage","1 photographer + videographer","300 edited photos","Cinematic highlight reel","Client selection gallery","Same-day preview","Raw files included","2-location coverage"] },
      { name:"Legacy", multiplier:3.2, popular:false, icon:"🎬",
        features:["Full-day coverage","2 photographers + drone","Unlimited edited photos","Feature-length film","Same-day edit","Livestream add-on","Premium album printing","Priority 48hr delivery"] },
    ],
    sports: [
      { name:"Walk-In", multiplier:1, popular:false, icon:"🎾",
        features:["Per-hour slot booking","Standard court access","Basic equipment rental","Locker room access","Walk-in or pre-book","Up to 4 players"] },
      { name:"Team Pass", multiplier:0.7, popular:true, icon:"🏆",
        features:["Monthly recurring slot","Dedicated court time","Equipment included","Team registration","Referee on request","Up to 12 players","Discount on tournaments","Priority booking"] },
      { name:"Tournament", multiplier:4, popular:false, icon:"🥇",
        features:["Full-day ground exclusive","All courts included","Referees & scorekeepers","Trophies & medals setup","Livestream option","Coaching staff on site","Canteen access","Spectator seating"] },
    ],
    vendors: [
      { name:"Basic", multiplier:1, popular:false, icon:"🎪",
        features:["Standard service","Up to 4 hours","Basic equipment","1 operator"] },
      { name:"Standard", multiplier:1.5, popular:true, icon:"⭐",
        features:["Full service","Up to 8 hours","Premium equipment","2 operators","Setup & teardown"] },
      { name:"Premium", multiplier:2.5, popular:false, icon:"👑",
        features:["All-inclusive","Full day","Top-tier equipment","Full team","Custom branding"] },
    ],
  };

  const pkgs = PACKAGES[cat] || PACKAGES.vendors;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {pkgs.map((pkg, i) => {
        const price = Math.round(base * pkg.multiplier);
        return (
          <div key={pkg.name} style={{ background:B.surface, borderRadius:14, border:`1.5px solid ${pkg.popular ? B.accent : B.border}`, padding:"18px 18px 16px", position:"relative", overflow:"hidden" }}>
            {pkg.popular && (
              <div style={{ position:"absolute", top:0, right:0, background:B.accent, color:B.dark, fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:"0 0 0 10px", letterSpacing:0.5 }}>MOST POPULAR</div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:28 }}>{pkg.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:B.text }}>{pkg.name}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color: pkg.popular ? B.accent : B.primary, marginTop:2 }}>
                    LKR {price.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {pkg.features.map((f,j) => (
                <div key={j} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background: pkg.popular ? "rgba(212,175,106,0.15)" : B.bg, border:`1px solid ${pkg.popular ? B.accent : B.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={pkg.popular ? B.accent : B.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize:13, color:B.text }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ background:"rgba(28,43,75,0.04)", borderRadius:12, padding:"10px 14px", border:`1px solid ${B.border}`, fontSize:12, color:B.textMuted, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ display:"flex", color:B.success }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        All packages include escrow-protected payment. Custom quotes available on request.
      </div>
    </div>
  );
}

// ─── Vendor Detail Page ───────────────────────────────────────────────────────
function VendorDetail({ vendor, user, token, onBack, onBookingSuccess }) {
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabLabel = { sports:"Pricing & Plans", djs:"Rates", photographers:"Rates", chefs:"Packages", catering:"Packages", wedding:"Packages", party:"Packages", vendors:"Packages" };
  const tabs = [
    { id:"overview", label:"Overview" },
    { id:"features", label:"Features" },
    { id:"packages", label: tabLabel[vendor.category] || "Packages" },
  ];
  return (
    <div style={{ minHeight:"100vh", background:B.bg, paddingBottom:90 }}>
      {/* Hero */}
      <div className="vendor-detail-hero" style={{ height:260, background:`linear-gradient(135deg, ${B.dark} 0%, #1a3a6b 100%)`, position:"relative", display:"flex", alignItems:"flex-end" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:96, opacity:0.15 }}>{CAT_EMOJI[vendor.category]||"🎪"}</div>
        <button onClick={onBack} style={{ position:"absolute", top:20, left:16, width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", backdropFilter:"blur(8px)" }}><Icon.ChevronLeft/></button>
        <div style={{ padding:"0 20px 20px", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(212,175,106,0.2)", borderRadius:20, padding:"4px 12px", marginBottom:8 }}>
            <span style={{ fontSize:14 }}>{CAT_EMOJI[vendor.category]}</span>
            <span style={{ fontSize:12, color:B.accent, fontWeight:600 }}>{CAT_LABELS[vendor.category]||vendor.category}</span>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{vendor.name}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <Icon.MapPin/><span style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{vendor.location||"Sri Lanka"}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:B.surface, borderBottom:`1px solid ${B.border}`, display:"flex", paddingLeft:16, position:"sticky", top:0, zIndex:100 }}>
        <div className="evara-page-header-inner" style={{ display:"flex", width:"100%" }}>
          {tabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ padding:"12px 16px", background:"none", border:"none", borderBottom:`2px solid ${activeTab===tab.id ? B.accent : "transparent"}`, color: activeTab===tab.id ? B.text : B.textMuted, fontWeight: activeTab===tab.id ? 700 : 500, fontSize:13, cursor:"pointer" }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="evara-page-inner" style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
        {activeTab === "overview" && (
          <>
            <div style={{ display:"flex", gap:12 }}>
              {[{label:"Rating",value:`${vendor.rating||"4.8"} ★`},{label:"Events",value:vendor.events_count||"50+"},{label:"Response",value:vendor.response_time||"< 1hr"}].map(({label,value})=>(
                <div key={label} style={{ flex:1, background:B.surface, borderRadius:12, border:`1px solid ${B.border}`, padding:"12px 10px", textAlign:"center" }}>
                  <div style={{ fontWeight:700, fontSize:16, color:B.text }}>{value}</div>
                  <div style={{ fontSize:11, color:B.textMuted, marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>About</div>
              <p style={{ fontSize:14, color:B.text, lineHeight:1.65 }}>{vendor.description||`${vendor.name} is a premier ${CAT_LABELS[vendor.category]||"event service"} in ${vendor.location||"Sri Lanka"}, delivering exceptional experiences for all types of events. Known for professionalism, creativity, and reliability.`}</p>
            </div>
          </>
        )}
        {activeTab === "features" && (
          <CategoryFeaturePanel category={vendor.category} vendor={vendor} />
        )}
        {activeTab === "packages" && (
          <CategoryPackages vendor={vendor} />
        )}
        {user ? (
          <button onClick={()=>setShowBooking(true)} style={{ width:"100%", padding:16, borderRadius:14, background:B.dark, color:"#fff", fontWeight:700, fontSize:16, border:"none", cursor:"pointer" }}>
            Book Now — from LKR {(vendor.base_price||15000).toLocaleString()}
          </button>
        ) : (
          <div style={{ background:B.accentSoft, borderRadius:14, padding:16, textAlign:"center", border:`1px solid ${B.border}` }}>
            <div style={{ fontSize:14, color:B.textMuted, marginBottom:10 }}>Sign in to book this vendor</div>
            <button onClick={()=>window.__evaraShowAuth&&window.__evaraShowAuth()} style={{ padding:"10px 28px", borderRadius:10, background:B.primary, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>Sign In</button>
          </div>
        )}
      </div>
      {showBooking && <BookingModal vendor={vendor} user={user} token={token} onClose={()=>setShowBooking(false)} onSuccess={onBookingSuccess}/>}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const signInWithGoogle = () => {
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}`;
  };
  const handleSubmit = async () => {
    setError("");
    if (!form.email||!form.password) { setError("Email and password required."); return; }
    setLoading(true);
    let res;
    if (mode==="signup") {
      if (!form.name) { setError("Name required."); setLoading(false); return; }
      res = await sb.signUp(form.email, form.password, form.name);
    } else {
      res = await sb.signIn(form.email, form.password);
    }
    setLoading(false);
    if (res.error||res.error_description) { setError(res.error_description||res.error?.message||"Authentication failed."); return; }
    const token = res.access_token;
    const refreshTok = res.refresh_token;
    const user = await sb.getUser(token);
    onAuth({ user, token, refreshToken: refreshTok });
  };
  return (
    <div style={{ padding:"32px 28px 28px" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}><EvaraLogo size="lg" dark/></div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Sri Lanka's premier event booking platform</div>
      </div>
      <div>
        <div style={{ padding:"0" }}>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
            {["signin","signup"].map(m=>(
              <button key={m} onClick={()=>{ setMode(m); setError(""); }} style={{ flex:1, padding:10, borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", background: mode===m?"#fff":"transparent", color: mode===m?B.dark:"rgba(255,255,255,0.5)", transition:"all .2s" }}>{m==="signin"?"Sign In":"Create Account"}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="signup" && (
              <div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6, fontWeight:600 }}>Full Name</div>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:14, outline:"none" }}/>
              </div>
            )}
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6, fontWeight:600 }}>Email</div>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:14, outline:"none" }}/>
            </div>
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6, fontWeight:600 }}>Password</div>
              <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:14, outline:"none" }}/>
            </div>
            {error && <div style={{ background:"rgba(217,64,64,0.15)", border:"1px solid rgba(217,64,64,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#FF8080" }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:14, borderRadius:12, background:B.accent, color:B.dark, fontWeight:700, fontSize:15, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4 }}>
              {loading?(mode==="signin"?"Signing in…":"Creating account…"):(mode==="signin"?"Sign In":"Create Account")}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>or</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
            </div>
            <button onClick={signInWithGoogle} style={{ width:"100%", padding:14, borderRadius:12, background:"#fff", color:"#1C2B4B", fontWeight:700, fontSize:15, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:16, fontSize:12, color:"rgba(255,255,255,0.25)" }}>By continuing you agree to Evara's Terms of Service</p>
      </div>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function ExplorePage({ user, token, onVendorSelect, onShowAuth }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    let params = "?select=*&order=created_at.desc";
    if (category!=="all") params += `&category=eq.${category}`;
    const { data } = await sb.query("vendors", params, null);
    setVendors(data||[]);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:B.bg, paddingBottom:"clamp(16px, 10vw, 90px)" }}>
      <div className="evara-page-header" style={{ background:B.dark, padding:"52px 20px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(212,175,106,0.08)", border:"1px solid rgba(212,175,106,0.12)", pointerEvents:"none" }}/>
        <div className="evara-page-header-inner" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>{user?`Welcome back, ${user.user_metadata?.full_name?.split(" ")[0]||"there"}`:"Discover Sri Lanka's finest events"}</div>
            <EvaraLogo size="md" dark/>
          </div>
          {!user && <button onClick={onShowAuth} className="mobile-signin-btn" style={{ padding:"8px 18px", borderRadius:20, background:B.accent, color:B.dark, fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>Sign In</button>}
        </div>
        <div className="evara-page-header-inner" style={{ maxWidth:"none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 14px", border:"1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ color:"rgba(255,255,255,0.4)" }}><Icon.Search/></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors, locations..." style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:14, color:"#fff" }}/>
          </div>
        </div>
      </div>
      <div className="evara-page-inner" style={{ display:"flex", gap:8, overflowX:"auto", padding:"16px 16px 0", scrollbarWidth:"none" }}>
        {CATEGORIES.map(cat=>(
          <button key={cat.id} onClick={()=>setCategory(cat.id)} style={{ display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap", padding:"8px 14px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", background: category===cat.id ? B.primary : B.surface, color: category===cat.id ? "#fff" : B.textMuted, border:`1.5px solid ${category===cat.id ? B.primary : B.border}`, flexShrink:0 }}>
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>
      <div className="evara-page-inner" style={{ padding:"16px 16px" }}>
        {loading ? (
          <div className="vendor-grid" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[1,2,3,4,5,6].map(i=>(
              <div key={i} style={{ background:B.surface, borderRadius:16, border:`1px solid ${B.border}`, padding:16, display:"flex", gap:12 }}>
                <Skeleton w={72} h={72} r={12}/>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}><Skeleton h={16} w="60%"/><Skeleton h={12} w="40%"/><Skeleton h={12} w="80%"/></div>
              </div>
            ))}
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <div style={{ fontWeight:700, color:B.text, marginBottom:6 }}>No vendors found</div>
            <div style={{ fontSize:13, color:B.textMuted }}>Try a different category or search term</div>
          </div>
        ) : (
          <div className="vendor-grid" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map(vendor=><VendorCard key={vendor.id} vendor={vendor} onSelect={onVendorSelect}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorCard({ vendor, onSelect }) {
  return (
    <div onClick={()=>onSelect(vendor)} style={{ background:B.surface, borderRadius:16, border:`1px solid ${B.border}`, padding:16, display:"flex", gap:14, cursor:"pointer", transition:"transform .15s, box-shadow .15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
      <div style={{ width:72, height:72, borderRadius:14, background:`linear-gradient(135deg, ${B.dark}22, ${B.primary}33)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0, border:`1px solid ${B.border}` }}>{CAT_EMOJI[vendor.category]||"🎪"}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
          <div style={{ fontWeight:700, fontSize:15, color:B.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>{vendor.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0 }}><Icon.Star filled/><span style={{ fontSize:12, fontWeight:600, color:B.textMuted }}>{vendor.rating||"4.8"}</span></div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
          <span style={{ color:B.textMuted }}><Icon.MapPin/></span>
          <span style={{ fontSize:12, color:B.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{vendor.location||"Sri Lanka"}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:B.bg, borderRadius:20, padding:"3px 10px", border:`1px solid ${B.border}` }}>
            <span style={{ fontSize:11 }}>{CAT_EMOJI[vendor.category]}</span>
            <span style={{ fontSize:11, color:B.textMuted, fontWeight:500 }}>{CAT_LABELS[vendor.category]||vendor.category}</span>
          </div>
          {vendor.base_price && <span style={{ fontSize:13, fontWeight:700, color:B.primary }}>from LKR {vendor.base_price.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

function BookingsPage({ user, token, onShowAuth }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [releasing, setReleasing] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await sb.query("bookings", `?user_id=eq.${user.id}&select=*,vendors(name,category,location)&order=created_at.desc`, token);
    setBookings(data||[]);
    setLoading(false);
  }, [user, token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const requestRelease = async (booking) => {
    setReleasing(booking.id);
    const { error } = await sb.query("bookings", `?id=eq.${booking.id}`, token, "PATCH", { status:"release_requested" });
    setReleasing(null);
    if (error) return;
    setBookings(prev=>prev.map(b=>b.id===booking.id?{...b,status:"release_requested"}:b));
    if (receipt?.id===booking.id) setReceipt(r=>({...r,status:"release_requested"}));
  };

  if (!user) {
    return (
      <div style={{ minHeight:"100vh", background:B.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ fontSize:60, marginBottom:16 }}>🔒</div>
        <div style={{ fontWeight:700, fontSize:18, color:B.text, marginBottom:8 }}>Sign in to see bookings</div>
        <div style={{ fontSize:14, color:B.textMuted, textAlign:"center", marginBottom:20 }}>Your bookings will appear here after you sign in</div>
        <button onClick={onShowAuth} style={{ padding:"12px 32px", borderRadius:12, background:B.primary, color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor:"pointer" }}>Sign In</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:B.bg, paddingBottom:"clamp(16px, 10vw, 90px)" }}>
      <div className="evara-page-header" style={{ background:B.dark, padding:"52px 20px 20px" }}>
        <div className="evara-page-header-inner">
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"#fff" }}>My Bookings</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Track your events & services</div>
        </div>
      </div>
      <div className="evara-page-inner" style={{ padding:16 }}>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[1,2,3].map(i=><div key={i} style={{ background:B.surface, borderRadius:16, height:110, border:`1px solid ${B.border}` }}><Skeleton h="100%" r={16}/></div>)}
          </div>
        ) : bookings.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:60, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:18, color:B.text, marginBottom:8 }}>No bookings yet</div>
            <div style={{ fontSize:14, color:B.textMuted }}>Start exploring to book your first vendor</div>
          </div>
        ) : (
          <div className="bookings-grid" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {bookings.map(booking=>{
              const ss = STATUS_STYLE[booking.status]||STATUS_STYLE.pending;
              return (
                <div key={booking.id} style={{ background:B.surface, borderRadius:16, border:`1px solid ${B.border}`, padding:16 }}>
                  <div onClick={()=>setReceipt(booking)} style={{ cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:B.text }}>{booking.vendors?.name||"Vendor"}</div>
                        <div style={{ fontSize:12, color:B.textMuted, marginTop:2 }}>{CAT_LABELS[booking.vendors?.category]||booking.vendors?.category}</div>
                      </div>
                      <div style={{ background:ss.bg, color:ss.c, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, border:`1px solid ${ss.c}33` }}>{ss.label}</div>
                    </div>
                    <div style={{ display:"flex", gap:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:B.textMuted }}><Icon.Calendar/>{formatDate(booking.event_date)}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:B.textMuted }}><Icon.Users/>{booking.guests||"—"} guests</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, paddingTop:10, borderTop:`1px solid ${B.border}` }}>
                      <span style={{ fontSize:12, color:B.textMuted }}>#{shortId(booking.id)}</span>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:B.primary }}>LKR {(booking.amount||0).toLocaleString()}</span>
                    </div>
                  </div>
                  {booking.status==="paid" && (
                    <button onClick={()=>requestRelease(booking)} disabled={releasing===booking.id} style={{ marginTop:12, width:"100%", padding:10, borderRadius:10, background:"#FFF4E5", border:"1.5px solid #C0562133", color:"#C05621", fontWeight:700, fontSize:13, cursor:releasing===booking.id?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:releasing===booking.id?0.6:1 }}>
                      <Icon.Unlock/>{releasing===booking.id?"Requesting…":"Request Payment Release"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {receipt && <Receipt booking={receipt} onClose={()=>setReceipt(null)}/>}
    </div>
  );
}

function ProfilePage({ user, token, onSignOut, onShowAuth }) {
  if (!user) {
    return (
      <div style={{ minHeight:"100vh", background:B.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ fontSize:60, marginBottom:16 }}>👤</div>
        <div style={{ fontWeight:700, fontSize:18, color:B.text, marginBottom:8 }}>Sign in to view your profile</div>
        <button onClick={onShowAuth} style={{ padding:"12px 32px", borderRadius:12, background:B.primary, color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor:"pointer", marginTop:8 }}>Sign In</button>
      </div>
    );
  }
  const name = user.user_metadata?.full_name||user.email?.split("@")[0]||"User";
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ minHeight:"100vh", background:B.bg, paddingBottom:"clamp(16px, 10vw, 90px)" }}>
      <div className="evara-page-header" style={{ background:B.dark, padding:"52px 20px 30px", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:B.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:B.dark, marginBottom:12 }}>{initials}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>{name}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>{user.email}</div>
      </div>
      <div className="evara-page-inner" style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background:B.surface, borderRadius:16, border:`1px solid ${B.border}`, overflow:"hidden" }}>
          {[["Name",name],["Email",user.email],["Member since",formatDate(user.created_at)]].map(([label,value],i,arr)=>(
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:i<arr.length-1?`1px solid ${B.border}`:"none" }}>
              <span style={{ fontSize:13, color:B.textMuted }}>{label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:B.text, textAlign:"right", maxWidth:"60%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ background:B.accentSoft, borderRadius:14, padding:"14px 16px", border:`1px solid ${B.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:6 }}>🛡️ Escrow Protected</div>
          <div style={{ fontSize:12, color:B.textMuted, lineHeight:1.6 }}>All payments on Evara are held in escrow until your event is successfully completed, protecting both you and the vendor.</div>
        </div>
        <button onClick={onSignOut} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:14, borderRadius:12, background:"#FEF2F2", color:B.danger, fontWeight:700, fontSize:14, border:`1.5px solid #D9404033`, cursor:"pointer" }}>
          <Icon.LogOut/> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ tab, onTab, user, onShowAuth, onSignOut }) {
  const tabs = [
    { id:"explore",  label:"Explore",  icon:Icon.Home },
    { id:"bookings", label:"Bookings", icon:Icon.Bookmark },
    { id:"profile",  label:"Profile",  icon:Icon.User },
  ];
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() || "?";
  return (
    <div className="evara-sidebar">
      <div className="evara-sidebar-logo">
        <EvaraLogo size="md" dark />
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:8, letterSpacing:0.5 }}>Sri Lanka's Event Platform</div>
      </div>
      <nav className="evara-sidebar-nav">
        {tabs.map(({id,label,icon:Ico})=>(
          <button key={id} className={"evara-sidebar-item"+(tab===id?" active":"")} onClick={()=>onTab(id)}>
            <Ico /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="evara-sidebar-footer">
        {user ? (
          <>
            <div className="evara-sidebar-user">
              <div className="evara-sidebar-avatar">{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
              </div>
            </div>
            <button onClick={onSignOut} className="evara-sidebar-item" style={{ color:"rgba(217,64,64,0.8)", marginTop:4 }}>
              <Icon.LogOut /><span>Sign Out</span>
            </button>
          </>
        ) : (
          <button onClick={onShowAuth} style={{ width:"100%", padding:"11px", borderRadius:10, background:B.accent, color:B.dark, fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function BottomNav({ tab, onTab }) {
  const tabs = [
    { id:"explore",  label:"Explore",  icon:Icon.Home },
    { id:"bookings", label:"Bookings", icon:Icon.Bookmark },
    { id:"profile",  label:"Profile",  icon:Icon.User },
  ];
  return (
    <div className="evara-bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:500, background:B.surface, borderTop:`1px solid ${B.border}`, display:"flex", padding:"8px 0 env(safe-area-inset-bottom, 8px)" }}>
      {tabs.map(({id,label,icon:Ico})=>(
        <button key={id} onClick={()=>onTab(id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:"6px 0", color: tab===id ? B.primary : B.textLight }}>
          <Ico/><span style={{ fontSize:10, fontWeight: tab===id?700:500 }}>{label}</span>
          {tab===id && <div style={{ width:4, height:4, borderRadius:"50%", background:B.accent, marginTop:-1 }}/>}
        </button>
      ))}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "judethayaan@gmail.com";

function AdminPanel({ user, token, onSignOut }) {
  const [adminTab, setAdminTab] = useState("vendors");
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingV, setLoadingV] = useState(true);
  const [loadingB, setLoadingB] = useState(true);
  const [loadingT, setLoadingT] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  const fetchVendors = useCallback(async () => {
    setLoadingV(true);
    const { data } = await sb.query("vendors","?select=*&order=created_at.desc",token);
    setVendors(data||[]);
    setLoadingV(false);
  }, [token]);
  const fetchBookings = useCallback(async () => {
    setLoadingB(true);
    const { data } = await sb.query("bookings","?select=*,vendors(name,category,location)&order=created_at.desc",token);
    setBookings(data||[]);
    setLoadingB(false);
  }, [token]);
  const fetchTickets = useCallback(async () => {
    setLoadingT(true);
    const { data } = await sb.query("support_tickets","?select=*&order=created_at.desc",token);
    setTickets(data||[]);
    setLoadingT(false);
  }, [token]);

  useEffect(() => { fetchVendors(); fetchBookings(); fetchTickets(); }, [fetchVendors,fetchBookings,fetchTickets]);

  const deleteVendor = async (id) => {
    const { error } = await sb.query("vendors",`?id=eq.${id}`,token,"DELETE");
    if (error) { showToast("Delete failed: "+(error.message||"unknown error"),"error"); return; }
    setVendors(v=>v.filter(x=>x.id!==id));
    setConfirmDel(null);
    showToast("Vendor deleted.");
  };
  const updateBookingStatus = async (id, status) => {
    const { error } = await sb.query("bookings",`?id=eq.${id}`,token,"PATCH",{status});
    if (error) { showToast("Update failed","error"); return; }
    setBookings(prev=>prev.map(b=>b.id===id?{...b,status}:b));
    showToast(`Status updated to "${status}"`);
  };
  const updateTicketStatus = async (id, status) => {
    const { error } = await sb.query("support_tickets",`?id=eq.${id}`,token,"PATCH",{status});
    if (error) { showToast("Update failed","error"); return; }
    setTickets(prev=>prev.map(t=>t.id===id?{...t,status}:t));
    showToast(`Ticket marked as ${status}`);
  };

  const openTickets = tickets.filter(t=>t.status==="open").length;
  const stats = {
    totalVendors: vendors.length,
    totalBookings: bookings.length,
    pending: bookings.filter(b=>b.status==="pending").length,
    revenue: bookings.filter(b=>["paid","released","completed"].includes(b.status)).reduce((s,b)=>s+(b.amount||0),0),
  };

  return (
    <div style={{ minHeight:"100vh", background:B.bg, fontFamily:"'DM Sans', sans-serif" }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ background:B.dark, padding:"0 20px", position:"sticky", top:0, zIndex:200, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <EvaraLogo size="sm" dark/>
            <div style={{ background:"rgba(212,175,106,0.15)", border:"1px solid rgba(212,175,106,0.3)", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, color:B.accent, letterSpacing:1 }}>ADMIN</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{user.email}</span>
            <button onClick={onSignOut} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              <Icon.LogOut/> Sign Out
            </button>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {[{id:"vendors",label:"Vendors",count:stats.totalVendors},{id:"bookings",label:"Bookings",count:stats.totalBookings},{id:"tickets",label:"Support",count:openTickets,urgent:openTickets>0}].map(({id,label,count,urgent})=>(
            <button key={id} onClick={()=>setAdminTab(id)} style={{ padding:"10px 16px", background:"none", border:"none", borderBottom: adminTab===id?`2px solid ${B.accent}`:"2px solid transparent", color: adminTab===id?"#fff":"rgba(255,255,255,0.4)", fontWeight: adminTab===id?700:500, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              {label}
              <span style={{ background: adminTab===id?B.accent:urgent?"rgba(217,64,64,0.7)":"rgba(255,255,255,0.1)", color: adminTab===id?B.dark:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-max" style={{ display:"flex", gap:12, padding:"16px 0 0", overflowX:"auto" }}>
        {[{label:"Total Vendors",value:stats.totalVendors,color:B.primary},{label:"Total Bookings",value:stats.totalBookings,color:"#0369A1"},{label:"Pending",value:stats.pending,color:B.warning},{label:"Open Tickets",value:openTickets,color:B.danger},{label:"Revenue (LKR)",value:stats.revenue.toLocaleString(),color:B.success}].map(({label,value,color})=>(
          <div key={label} style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:"14px 18px", flexShrink:0, minWidth:130 }}>
            <div style={{ fontSize:11, color:B.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color, fontFamily:"'Playfair Display',serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {adminTab==="vendors" && (
        <div className="admin-max" style={{ padding:"16px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:16, color:B.text }}>All Vendors</div>
            <button onClick={()=>{ setEditVendor(null); setShowAddForm(true); }} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.primary, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>+ Add Vendor</button>
          </div>
          {loadingV ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3].map(i=><div key={i} style={{ background:B.surface, borderRadius:14, height:80, border:`1px solid ${B.border}` }}><Skeleton h="100%" r={14}/></div>)}</div>
          ) : vendors.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:B.textMuted }}><div style={{ fontSize:48, marginBottom:10 }}>🏢</div><div style={{ fontWeight:700 }}>No vendors yet</div><div style={{ fontSize:13, marginTop:4 }}>Add the first vendor to get started</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {vendors.map(v=>(
                <div key={v.id} style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, border:`1px solid ${B.border}` }}>{CAT_EMOJI[v.category]||"🎪"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:B.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div>
                    <div style={{ fontSize:12, color:B.textMuted, marginTop:2 }}>{CAT_LABELS[v.category]||v.category} · {v.location||"—"} · LKR {(v.base_price||0).toLocaleString()}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={()=>{ setEditVendor(v); setShowAddForm(true); }} style={{ padding:"6px 14px", borderRadius:8, background:B.accentSoft, border:`1px solid ${B.border}`, color:B.text, fontWeight:600, fontSize:12, cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>setConfirmDel(v)} style={{ padding:"6px 14px", borderRadius:8, background:"#FEF2F2", border:"1px solid #D9404033", color:B.danger, fontWeight:600, fontSize:12, cursor:"pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminTab==="bookings" && (
        <div className="admin-max" style={{ padding:"16px 0" }}>
          <div style={{ fontWeight:700, fontSize:16, color:B.text, marginBottom:14 }}>All Bookings</div>
          {loadingB ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3,4].map(i=><div key={i} style={{ background:B.surface, borderRadius:14, height:110, border:`1px solid ${B.border}` }}><Skeleton h="100%" r={14}/></div>)}</div>
          ) : bookings.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:B.textMuted }}><div style={{ fontSize:48, marginBottom:10 }}>📋</div><div style={{ fontWeight:700 }}>No bookings yet</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {bookings.map(b=>{
                const ss = STATUS_STYLE[b.status]||STATUS_STYLE.pending;
                return (
                  <div key={b.id} style={{ background:B.surface, borderRadius:14, border:`1px solid ${B.border}`, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:B.text }}>{b.vendors?.name||"Vendor"}</div>
                        <div style={{ fontSize:12, color:B.textMuted, marginTop:2 }}>#{shortId(b.id)} · {formatDate(b.event_date)} · {b.guests||"—"} guests</div>
                      </div>
                      <div style={{ background:ss.bg, color:ss.c, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, border:`1px solid ${ss.c}33`, whiteSpace:"nowrap" }}>{ss.label}</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${B.border}`, paddingTop:10 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:B.primary }}>LKR {(b.amount||0).toLocaleString()}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        {b.status==="pending" && <button onClick={()=>updateBookingStatus(b.id,"confirmed")} style={{ padding:"5px 12px", borderRadius:8, background:"#EDFAF4", border:"1px solid #1A9B6C33", color:B.success, fontWeight:700, fontSize:12, cursor:"pointer" }}>✓ Confirm</button>}
                        {b.status==="confirmed" && <button onClick={()=>updateBookingStatus(b.id,"paid")} style={{ padding:"5px 12px", borderRadius:8, background:"#E8F5FF", border:"1px solid #0369A133", color:"#0369A1", fontWeight:700, fontSize:12, cursor:"pointer" }}>💳 Mark Paid</button>}
                        {b.status==="release_requested" && <button onClick={()=>updateBookingStatus(b.id,"released")} style={{ padding:"5px 12px", borderRadius:8, background:"#EDFAF4", border:"1px solid #1A9B6C33", color:B.success, fontWeight:700, fontSize:12, cursor:"pointer" }}>🔓 Release</button>}
                        {b.status==="released" && <button onClick={()=>updateBookingStatus(b.id,"completed")} style={{ padding:"5px 12px", borderRadius:8, background:"#F0F4FF", border:"1px solid #3B4FCC33", color:"#3B4FCC", fontWeight:700, fontSize:12, cursor:"pointer" }}>✅ Complete</button>}
                        {!["completed","cancelled"].includes(b.status) && <button onClick={()=>updateBookingStatus(b.id,"cancelled")} style={{ padding:"5px 12px", borderRadius:8, background:"#FEF2F2", border:"1px solid #D9404033", color:B.danger, fontWeight:700, fontSize:12, cursor:"pointer" }}>✕</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {adminTab==="tickets" && (
        <div className="admin-max" style={{ padding:"16px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:16, color:B.text }}>Support Tickets</div>
            <button onClick={fetchTickets} style={{ padding:"7px 14px", borderRadius:8, background:B.surface, border:`1px solid ${B.border}`, fontWeight:600, fontSize:12, color:B.textMuted, cursor:"pointer" }}>↻ Refresh</button>
          </div>
          {loadingT ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3].map(i=><div key={i} style={{ background:B.surface, borderRadius:14, height:120, border:`1px solid ${B.border}` }}><Skeleton h="100%" r={14}/></div>)}</div>
          ) : tickets.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:B.textMuted }}><div style={{ fontSize:48, marginBottom:10 }}>🎫</div><div style={{ fontWeight:700 }}>No support tickets yet</div><div style={{ fontSize:13, marginTop:4 }}>Tickets submitted by users will appear here</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {tickets.map(t=>{
                const isOpen = t.status==="open";
                const isResolved = t.status==="resolved";
                return (
                  <div key={t.id} style={{ background:B.surface, borderRadius:14, border:`1.5px solid ${t.is_urgent&&isOpen?"#D94040":B.border}`, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          {t.is_urgent&&isOpen && <span style={{ background:"#FEF2F2", color:B.danger, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6 }}>🚨 URGENT</span>}
                          <span style={{ fontSize:13, fontWeight:700, color:B.text }}>{t.issue_label||"General Issue"}</span>
                        </div>
                        <div style={{ fontSize:12, color:B.textMuted }}>{t.user_email||"Anonymous"} · {t.vendor_name?`${t.vendor_name} · `:""}{formatDate(t.created_at)}</div>
                        {t.booking_id && <div style={{ fontSize:11, color:B.textMuted, marginTop:2 }}>Booking #{t.booking_id.replace(/-/g,"").slice(0,10).toUpperCase()}</div>}
                      </div>
                      <div style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, background:isResolved?"#EDFAF4":isOpen?(t.is_urgent?"#FEF2F2":"#FFFBEB"):"#F0F4FF", color:isResolved?B.success:isOpen?(t.is_urgent?B.danger:B.warning):"#3B4FCC" }}>
                        {isResolved?"✓ Resolved":isOpen?"Open":t.status}
                      </div>
                    </div>
                    {t.message && <div style={{ background:B.bg, borderRadius:8, padding:"10px 12px", fontSize:13, color:B.text, lineHeight:1.5, marginBottom:10, borderLeft:`3px solid ${t.is_urgent?B.danger:B.accent}` }}>{t.message}</div>}
                    <div style={{ display:"flex", gap:8 }}>
                      {t.user_email && <a href={`mailto:${t.user_email}?subject=Re: Your Evara Support Ticket`} style={{ flex:1, padding:8, borderRadius:8, background:B.accentSoft, border:`1px solid ${B.border}`, color:B.text, fontWeight:600, fontSize:12, cursor:"pointer", textAlign:"center", textDecoration:"none" }}>📧 Reply by Email</a>}
                      {!isResolved && <button onClick={()=>updateTicketStatus(t.id,"resolved")} style={{ flex:1, padding:8, borderRadius:8, background:"#EDFAF4", border:"1px solid rgba(26,155,108,0.2)", color:B.success, fontWeight:700, fontSize:12, cursor:"pointer" }}>✓ Resolve</button>}
                      {isResolved && <button onClick={()=>updateTicketStatus(t.id,"open")} style={{ flex:1, padding:8, borderRadius:8, background:B.bg, border:`1px solid ${B.border}`, color:B.textMuted, fontWeight:600, fontSize:12, cursor:"pointer" }}>↺ Reopen</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showAddForm && <VendorFormModal vendor={editVendor} token={token} onClose={()=>{ setShowAddForm(false); setEditVendor(null); }} onSaved={(msg)=>{ showToast(msg); fetchVendors(); setShowAddForm(false); setEditVendor(null); }}/>}

      {confirmDel && (
        <>
          <div onClick={()=>setConfirmDel(null)} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(12,22,40,0.65)", backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
            <div style={{ background:B.surface, borderRadius:20, padding:28, maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 24px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
              <div style={{ fontWeight:700, fontSize:18, color:B.text, marginBottom:8 }}>Delete Vendor?</div>
              <div style={{ fontSize:14, color:B.textMuted, marginBottom:24 }}>"<strong>{confirmDel.name}</strong>" will be permanently removed.</div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setConfirmDel(null)} style={{ flex:1, padding:12, borderRadius:10, background:B.bg, border:`1px solid ${B.border}`, fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
                <button onClick={()=>deleteVendor(confirmDel.id)} style={{ flex:1, padding:12, borderRadius:10, background:B.danger, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer" }}>Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
      <Toast toast={toast}/>
    </div>
  );
}

// ─── Vendor Form Modal ────────────────────────────────────────────────────────
function VendorFormModal({ vendor, token, onClose, onSaved }) {
  const isEdit = !!vendor;
  const [form, setForm] = useState({ name:vendor?.name||"", category:vendor?.category||"wedding", location:vendor?.location||"", base_price:vendor?.base_price||"", description:vendor?.description||"", rating:vendor?.rating||"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSave = async () => {
    if (!form.name||!form.category||!form.location||!form.base_price) { setError("Please fill in all required fields."); return; }
    setLoading(true); setError("");
    const body = { name:form.name.trim(), category:form.category, location:form.location.trim(), base_price:parseFloat(form.base_price)||0, description:form.description.trim()||null, rating:parseFloat(form.rating)||null };
    const { error: err } = isEdit
      ? await sb.query("vendors",`?id=eq.${vendor.id}`,token,"PATCH",body)
      : await sb.query("vendors","",token,"POST",body);
    setLoading(false);
    if (err) { setError(err.message||"Save failed."); return; }
    onSaved(isEdit?"Vendor updated!":"Vendor added!");
  };
  const inputStyle = { width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:14, color:B.text, outline:"none" };
  const labelStyle = { display:"block", fontSize:12, fontWeight:600, color:B.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 };
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(12,22,40,0.65)", backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", alignItems:"flex-end", justifyContent:"center", pointerEvents:"none" }}>
        <div style={{ width:"100%", maxWidth:480, maxHeight:"92vh", background:B.bg, borderRadius:"22px 22px 0 0", overflow:"hidden", display:"flex", flexDirection:"column", pointerEvents:"all", animation:"slideUp .35s cubic-bezier(.22,1,.36,1) both" }}>
          <div style={{ padding:"16px 20px", background:B.surface, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:B.text }}>{isEdit?"Edit Vendor":"Add New Vendor"}</div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${B.border}`, background:B.surface, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:B.textMuted }}><Icon.X/></button>
          </div>
          <div style={{ overflowY:"auto", flex:1, padding:"20px 16px 32px", display:"flex", flexDirection:"column", gap:14 }}>
            <div><label style={labelStyle}>Vendor Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Grand Royal Banquet Hall" style={inputStyle}/></div>
            <div><label style={labelStyle}>Category *</label><select value={form.category} onChange={e=>set("category",e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>{VENDOR_CATEGORIES.map(({id,label,emoji})=><option key={id} value={id}>{emoji} {label}</option>)}</select></div>
            <div><label style={labelStyle}>Location *</label><input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Colombo 03, Sri Lanka" style={inputStyle}/></div>
            <div><label style={labelStyle}>Base Price (LKR) *</label><input type="number" value={form.base_price} onChange={e=>set("base_price",e.target.value)} placeholder="e.g. 50000" style={inputStyle} min="0"/></div>
            <div><label style={labelStyle}>Rating (1–5)</label><input type="number" value={form.rating} onChange={e=>set("rating",e.target.value)} placeholder="4.8" style={inputStyle} min="1" max="5" step="0.1"/></div>
            <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Brief description of the vendor's services..." style={{ ...inputStyle, minHeight:90, resize:"vertical" }}/></div>
            {error && <div style={{ background:"#FEF2F2", border:"1px solid #D9404033", borderRadius:10, padding:"10px 14px", fontSize:13, color:B.danger, fontWeight:600 }}>{error}</div>}
            <button onClick={handleSave} disabled={loading} style={{ width:"100%", padding:14, borderRadius:12, background:B.primary, color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4 }}>
              {loading?(isEdit?"Saving…":"Adding…"):(isEdit?"Save Changes":"Add Vendor")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshTok, setRefreshTok] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tab, setTab] = useState("explore");
  const [showAuth, setShowAuth] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const refreshTimerRef = useRef(null);
  const scheduleRefresh = useCallback((accessToken, refresh_token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!refresh_token) return;
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const expiresIn = (payload.exp*1000)-Date.now()-5*60*1000;
      if (expiresIn<=0) { setSessionExpired(true); return; }
      refreshTimerRef.current = setTimeout(async () => {
        const res = await sb.refreshToken(refresh_token);
        if (res.error||!res.access_token) { setSessionExpired(true); return; }
        setToken(res.access_token);
        setRefreshTok(res.refresh_token);
        scheduleRefresh(res.access_token, res.refresh_token);
      }, expiresIn);
    } catch { setSessionExpired(true); }
  }, []);

  // Expose showAuth globally so nested components (VendorDetail) can trigger it
  useEffect(() => { window.__evaraShowAuth = () => setShowAuth(true); return () => { delete window.__evaraShowAuth; }; }, []);

  const handleAuth = useCallback(({user, token, refreshToken}) => {
    setUser(user); setToken(token); setRefreshTok(refreshToken);
    setSessionExpired(false); setShowAuth(false);
    scheduleRefresh(token, refreshToken);
    if (user?.email===ADMIN_EMAIL) showToast("Welcome to the Admin Panel 🛡️");
    else showToast(`Welcome back, ${user.user_metadata?.full_name?.split(" ")[0]||"there"}! 👋`);
  }, [scheduleRefresh]);

  // Handle Google OAuth redirect — token arrives in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token) {
        sb.getUser(access_token).then(user => {
          handleAuth({ user, token: access_token, refreshToken: refresh_token });
          window.history.replaceState(null, null, window.location.pathname);
        });
      }
    }
  }, [handleAuth]);

  const handleSignOut = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await sb.signOut(token);
    setUser(null); setToken(null); setRefreshTok(null);
    setSessionExpired(false); setTab("explore");
    showToast("Signed out successfully","info");
  };

  // Auth is rendered as overlay — no early return, so sidebar stays mounted
  if (isAdmin) return <AdminPanel user={user} token={token} onSignOut={handleSignOut}/>;
  if (selectedVendor) return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <VendorDetail vendor={selectedVendor} user={user} token={token} onBack={()=>setSelectedVendor(null)} onBookingSuccess={()=>{ showToast("Booking confirmed! 🎉"); setSelectedVendor(null); setTab("bookings"); }}/>
      <Toast toast={toast}/>
    </>
  );

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      {sessionExpired && <SessionExpiredBanner onReAuth={()=>{ setSessionExpired(false); setShowAuth(true); }}/>}
      <div className="evara-shell">
        <DesktopSidebar tab={tab} onTab={setTab} user={user} onShowAuth={()=>setShowAuth(true)} onSignOut={handleSignOut} />
        <main className="evara-main">
          {tab==="explore" && <ExplorePage user={user} token={token} onVendorSelect={setSelectedVendor} onShowAuth={()=>setShowAuth(true)}/>}
          {tab==="bookings" && <BookingsPage user={user} token={token} onShowAuth={()=>setShowAuth(true)}/>}
          {tab==="profile" && <ProfilePage user={user} token={token} onSignOut={handleSignOut} onShowAuth={()=>setShowAuth(true)}/>}
        </main>
      </div>
      <BottomNav tab={tab} onTab={setTab}/>
      <Toast toast={toast}/>
      <SupportWidget user={user} token={token}/>

      {/* Auth overlay — rendered on top of everything, no unmount */}
      {showAuth && (
        <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(12,22,40,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", animation:"fadeIn .2s ease" }}>
          <div style={{ width:"100%", maxWidth:440, background:B.dark, borderRadius:20, border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 32px 80px rgba(0,0,0,0.6)", overflow:"hidden", position:"relative", animation:"slideUp .3s ease" }}>
            {/* Close button */}
            <button onClick={()=>setShowAuth(false)} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
              <Icon.X />
            </button>
            <AuthScreen onAuth={handleAuth} />
          </div>
        </div>
      )}
    </>
  );
}
