/**
 * dashboards/vendor/VendorDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared shell for every vendor type. Renders the sidebar, top-bar, and
 * dynamically loads the correct module component based on:
 *   1. The vendor's category (used to resolve modules from moduleRegistry)
 *   2. The currently selected sidebar tab (activeModule)
 *
 * Module components live in src/dashboards/vendor/modules/ and are imported
 * in the MODULE_COMPONENTS map below — zero conditional rendering in this file.
 */

import { useState, useCallback, useEffect } from "react";
import { getModulesForCategory } from "./moduleRegistry.js";
import {
  B, CAT_LABELS, CAT_EMOJI, Icon, Toast, formatDate, formatMoney, shortId,
} from "../shared/tokens.js";

// ─── Lazy module component map ────────────────────────────────────────────────
// Imported statically for Vite compatibility (no dynamic import() needed at scale)
import VendorDashboardHome  from "./modules/VendorDashboardHome.jsx";
import VendorBookings        from "./modules/VendorBookings.jsx";
import VendorCalendar        from "./modules/VendorCalendar.jsx";
import VendorAvailability    from "./modules/VendorAvailability.jsx";
import VendorCustomers       from "./modules/VendorCustomers.jsx";
import VendorPayments        from "./modules/VendorPayments.jsx";
import VendorAnalytics       from "./modules/VendorAnalytics.jsx";
import VendorMarketing       from "./modules/VendorMarketing.jsx";
import VendorProfile         from "./modules/VendorProfile.jsx";
import VendorSettings        from "./modules/VendorSettings.jsx";
import VendorPricingRules    from "./modules/VendorPricingRules.jsx";
import VendorPackages        from "./modules/VendorPackages.jsx";
import VendorMenuBuilder     from "./modules/VendorMenuBuilder.jsx";
import VendorSlots           from "./modules/VendorSlots.jsx";
import VendorGrounds         from "./modules/VendorGrounds.jsx";
import VendorReviews         from "./modules/VendorReviews.jsx";
import VendorMessages        from "./modules/VendorMessages.jsx";

// Generic placeholder for modules not yet built
function ComingSoon({ moduleId }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 12, padding: 32 }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: B.text }}>Coming Soon</div>
      <div style={{ fontSize: 13, color: B.textMuted }}>The <strong>{moduleId}</strong> module is under construction.</div>
    </div>
  );
}

const MODULE_COMPONENTS = {
  dashboard:      VendorDashboardHome,
  bookings:       VendorBookings,
  calendar:       VendorCalendar,
  availability:   VendorAvailability,
  customers:      VendorCustomers,
  messages:       VendorMessages,
  reviews:        VendorReviews,
  payments:       VendorPayments,
  analytics:      VendorAnalytics,
  marketing:      VendorMarketing,
  profile:        VendorProfile,
  settings:       VendorSettings,
  pricing_rules:  VendorPricingRules,
  packages:       VendorPackages,
  menu_builder:   VendorMenuBuilder,
  slots:          VendorSlots,
  grounds:        VendorGrounds,
  // Remaining special modules resolve to ComingSoon until implemented
};

function resolveModule(id) {
  return MODULE_COMPONENTS[id] || (() => <ComingSoon moduleId={id} />);
}

// ─── Evara Logo (self-contained so no import from App.jsx needed) ─────────────
function EvaraLogo({ size = "md", dark = false }) {
  const sizes = { sm: 20, md: 26, lg: 34 };
  const h = sizes[size] || 26;
  const w = h * 2.8;
  const gold = "#D4AF6A";
  const navy = dark ? "#FFFFFF" : "#1C2B4B";
  return (
    <svg width={w} height={h} viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,4 22,4 27,14 12,28 -3,14 2,4" fill={gold} opacity="0.15"/>
      <polygon points="12,4 22,4 27,14 12,24 -3,14 2,4" fill="none" stroke={gold} strokeWidth="1.5"/>
      <polygon points="12,10 18,10 21,15 12,22 3,15 6,10" fill={gold} opacity="0.5"/>
      <text x="34" y="36" fontFamily="Georgia,serif" fontSize="32" fontWeight="700" fill={navy} letterSpacing="-1">Ev</text>
      <text x="72" y="36" fontFamily="Georgia,serif" fontSize="32" fontWeight="700" fill={gold} letterSpacing="-1">ara</text>
      <circle cx="134" cy="32" r="3" fill={gold}/>
    </svg>
  );
}

// ─── Notification panel ────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: 1, type: "booking",  msg: "New booking from Priya S. for 24 Dec",      time: "2m ago",  read: false },
  { id: 2, type: "payment",  msg: "LKR 85,000 payment received for booking #A3F2",time: "14m ago", read: false },
  { id: 3, type: "review",   msg: "New 5-star review: 'Absolutely amazing!'",  time: "1h ago",  read: false },
  { id: 4, type: "message",  msg: "Kamal K. sent you a message",               time: "3h ago",  read: true  },
  { id: 5, type: "cancel",   msg: "Booking #B7D1 was cancelled by customer",    time: "5h ago",  read: true  },
];
const NOTIF_EMOJI = { booking: "📅", payment: "💳", review: "⭐", message: "💬", cancel: "❌" };

function NotificationPanel({ onClose }) {
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 700 }} />
      <div style={{
        position: "absolute", top: 52, right: 0, width: 320, zIndex: 800,
        background: B.surface, borderRadius: 16, border: `1px solid ${B.border}`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)", overflow: "hidden",
        animation: "slideUp .2s ease",
      }}>
        <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${B.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Notifications</div>
          <button onClick={markAll} style={{ fontSize: 11, color: B.accent, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${B.border}`, cursor: "pointer", background: n.read ? "transparent" : B.accentSoft }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{NOTIF_EMOJI[n.type] || "🔔"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: B.text, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.msg}</div>
                <div style={{ fontSize: 10, color: B.textLight, marginTop: 3 }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.accent, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Vendor Dashboard Shell ────────────────────────────────────────────────────
export default function VendorDashboard({ vendor, user, token, sb, onSignOut, onBackToMarketplace }) {
  const category  = vendor?.category || "sports";
  const modules   = getModulesForCategory(category);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [toast, setToast]               = useState(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
  const name  = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Vendor";
  const init  = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const ActiveModule = resolveModule(activeModule);
  const activeMeta   = modules.find(m => m.id === activeModule);

  const handleModuleChange = (id) => {
    setActiveModule(id);
    setSidebarOpen(false);
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo + vendor badge */}
      <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <EvaraLogo size="sm" dark />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,106,0.15)", border: "1px solid rgba(212,175,106,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {CAT_EMOJI[category] || "🎪"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{vendor?.name || "My Venue"}</div>
            <div style={{ fontSize: 10, color: B.accent, fontWeight: 600 }}>{CAT_LABELS[category] || category}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", scrollbarWidth: "none" }}>
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => handleModuleChange(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              marginBottom: 2, textAlign: "left", fontFamily: "'DM Sans', sans-serif",
              background: activeModule === m.id ? "rgba(212,175,106,0.12)" : "none",
              color: activeModule === m.id ? B.accent : "rgba(255,255,255,0.5)",
              fontWeight: activeModule === m.id ? 700 : 500, fontSize: 13,
              transition: "background .15s, color .15s",
            }}
          >
            <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{m.icon}</span>
            <span>{m.label}</span>
            {activeModule === m.id && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: B.accent }} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {onBackToMarketplace && (
          <button onClick={onBackToMarketplace} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
            <Icon.ChevLeft /> Back to Marketplace
          </button>
        )}
        <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "none", color: "rgba(217,64,64,0.7)", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          <Icon.LogOut /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif", position: "relative" }}>

      {/* ── Desktop sidebar (fixed) ── */}
      <div style={{ width: 220, flexShrink: 0, background: B.dark, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 300, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }} className="vendor-sidebar-desktop">
        <SidebarContent />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(12,22,40,0.6)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, background: B.dark, zIndex: 500, display: "flex", flexDirection: "column", animation: "slideUp .25s ease" }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, marginLeft: 220, minWidth: 0, display: "flex", flexDirection: "column" }} className="vendor-main">

        {/* Top bar */}
        <div style={{ background: B.surface, borderBottom: `1px solid ${B.border}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", height: 56, gap: 12 }}>
          {/* Mobile menu toggle */}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, display: "none", padding: 4 }} className="vendor-menu-btn">
            <Icon.Menu />
          </button>

          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: B.text }}>{activeMeta?.label || "Dashboard"}</div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
            {/* Notifications bell */}
            <button
              onClick={() => setShowNotifs(o => !o)}
              style={{ position: "relative", width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: B.textMuted }}
            >
              <Icon.Bell />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: B.danger, border: "1.5px solid #fff" }} />
              )}
            </button>
            {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: 10, background: B.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: B.dark, cursor: "pointer" }}>{init}</div>
          </div>
        </div>

        {/* Module content */}
        <div style={{ flex: 1, padding: "24px 24px 40px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          <ActiveModule
            vendor={vendor}
            user={user}
            token={token}
            sb={sb}
            showToast={showToast}
          />
        </div>
      </div>

      <Toast toast={toast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F5F4F1; color: #1C2B4B; -webkit-font-smoothing: antialiased; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #E4E1D9; border-radius: 4px; }
        .vendor-sidebar-desktop { display: flex !important; }
        .vendor-main { margin-left: 220px !important; }
        @media (max-width: 768px) {
          .vendor-sidebar-desktop { display: none !important; }
          .vendor-main { margin-left: 0 !important; }
          .vendor-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
