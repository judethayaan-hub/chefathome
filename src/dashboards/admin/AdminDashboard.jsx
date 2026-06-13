/**
 * dashboards/admin/AdminDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise admin panel for Super Admin / Admin / Support roles.
 * Sidebar modules are filtered per role (support sees less than super_admin).
 * Each module is a separate file in admin/modules/ and imported via the
 * ADMIN_MODULE_COMPONENTS map — no conditional rendering in this shell.
 */

import { useState, useCallback } from "react";
import { ROLES, hasPermission, PERMISSIONS as P } from "../../rbac/roles.js";
import { B, Icon, Toast, CAT_LABELS, CAT_EMOJI } from "../shared/tokens.js";

import AdminOverview        from "./modules/AdminOverview.jsx";
import AdminUsers           from "./modules/AdminUsers.jsx";
import AdminVendors         from "./modules/AdminVendors.jsx";
import AdminBookings        from "./modules/AdminBookings.jsx";
import AdminPayments        from "./modules/AdminPayments.jsx";
import AdminCommissions     from "./modules/AdminCommissions.jsx";
import AdminReviews         from "./modules/AdminReviews.jsx";
import AdminSupport         from "./modules/AdminSupport.jsx";
import AdminSettings        from "./modules/AdminSettings.jsx";
import AdminReports         from "./modules/AdminReports.jsx";

function ComingSoon({ moduleId }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, gap:12, padding:32 }}>
      <div style={{ fontSize:48 }}>🚧</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:B.text }}>Coming Soon</div>
      <div style={{ fontSize:13, color:B.textMuted }}>The <strong>{moduleId}</strong> module is under construction.</div>
    </div>
  );
}

const ADMIN_MODULE_COMPONENTS = {
  overview:    AdminOverview,
  users:       AdminUsers,
  vendors:     AdminVendors,
  bookings:    AdminBookings,
  payments:    AdminPayments,
  commissions: AdminCommissions,
  reviews:     AdminReviews,
  support:     AdminSupport,
  settings:    AdminSettings,
  reports:     AdminReports,
  listings:    () => <ComingSoon moduleId="Listings" />,
  categories:  () => <ComingSoon moduleId="Categories" />,
};

// Module definitions with permission gating
const ALL_ADMIN_MODULES = [
  { id:"overview",    label:"Overview",     icon:"📊", permission: null },
  { id:"users",       label:"Users",        icon:"👥", permission: P.MANAGE_USERS },
  { id:"vendors",     label:"Vendors",      icon:"🏢", permission: P.MANAGE_VENDORS },
  { id:"listings",    label:"Listings",     icon:"🗂️", permission: P.MANAGE_VENDORS },
  { id:"categories",  label:"Categories",   icon:"🏷️", permission: P.MANAGE_SETTINGS },
  { id:"bookings",    label:"Bookings",     icon:"📅", permission: P.MANAGE_ALL_BOOKINGS },
  { id:"payments",    label:"Payments",     icon:"💳", permission: P.MANAGE_PAYMENTS },
  { id:"commissions", label:"Commissions",  icon:"💰", permission: P.MANAGE_COMMISSIONS },
  { id:"reviews",     label:"Reviews",      icon:"⭐", permission: P.MANAGE_REVIEWS },
  { id:"reports",     label:"Reports",      icon:"📈", permission: P.VIEW_ANALYTICS },
  { id:"support",     label:"Support",      icon:"🎧", permission: P.MANAGE_SUPPORT },
  { id:"settings",    label:"Settings",     icon:"⚙️", permission: P.MANAGE_SETTINGS },
];

function EvaraLogo() {
  return (
    <svg width="110" height="36" viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,4 22,4 27,14 12,28 -3,14 2,4" fill="#D4AF6A" opacity="0.15"/>
      <polygon points="12,4 22,4 27,14 12,24 -3,14 2,4" fill="none" stroke="#D4AF6A" strokeWidth="1.5"/>
      <polygon points="12,10 18,10 21,15 12,22 3,15 6,10" fill="#D4AF6A" opacity="0.5"/>
      <text x="34" y="36" fontFamily="Georgia,serif" fontSize="32" fontWeight="700" fill="#FFFFFF" letterSpacing="-1">Ev</text>
      <text x="72" y="36" fontFamily="Georgia,serif" fontSize="32" fontWeight="700" fill="#D4AF6A" letterSpacing="-1">ara</text>
      <circle cx="134" cy="32" r="3" fill="#D4AF6A"/>
    </svg>
  );
}

const ROLE_BADGE = {
  [ROLES.SUPER_ADMIN]: { label:"Super Admin", bg:"rgba(212,175,106,0.2)", color:B.accent },
  [ROLES.ADMIN]:       { label:"Admin",        bg:"rgba(28,43,75,0.3)",   color:"rgba(255,255,255,0.6)" },
  [ROLES.SUPPORT]:     { label:"Support",      bg:"rgba(3,105,161,0.3)",  color:"#7DD3FC" },
};

export default function AdminDashboard({ user, role, token, sb, onSignOut, onBackToMarketplace }) {
  const [active, setActive]         = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Filter modules the current role can see
  const visibleModules = ALL_ADMIN_MODULES.filter(m =>
    !m.permission || hasPermission(role, m.permission)
  );

  const ActiveModule = ADMIN_MODULE_COMPONENTS[active] || (() => <ComingSoon moduleId={active} />);
  const activeMeta   = visibleModules.find(m => m.id === active);
  const roleBadge    = ROLE_BADGE[role] || ROLE_BADGE[ROLES.SUPPORT];
  const name         = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const init         = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleModuleChange = (id) => {
    setActive(id);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Logo */}
      <div style={{ padding:"22px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <EvaraLogo />
        <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:6, background:roleBadge.bg, borderRadius:20, padding:"3px 10px" }}>
          <Icon.Shield />
          <span style={{ fontSize:11, fontWeight:700, color:roleBadge.color }}>{roleBadge.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto", scrollbarWidth:"none" }}>
        {visibleModules.map(m => (
          <button
            key={m.id}
            onClick={() => handleModuleChange(m.id)}
            style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer",
              marginBottom:2, textAlign:"left", fontFamily:"'DM Sans',sans-serif",
              background: active===m.id ? "rgba(212,175,106,0.12)" : "none",
              color: active===m.id ? B.accent : "rgba(255,255,255,0.5)",
              fontWeight: active===m.id ? 700 : 500, fontSize:13,
              transition:"background .15s, color .15s",
            }}
          >
            <span style={{ fontSize:15, width:22, textAlign:"center", flexShrink:0 }}>{m.icon}</span>
            <span>{m.label}</span>
            {active===m.id && <div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:B.accent }} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        {onBackToMarketplace && (
          <button onClick={onBackToMarketplace} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:10, border:"none", cursor:"pointer", background:"none", color:"rgba(255,255,255,0.35)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>
            <Icon.ChevLeft /> Back to Marketplace
          </button>
        )}
        <button onClick={onSignOut} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:10, border:"none", cursor:"pointer", background:"none", color:"rgba(217,64,64,0.7)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
          <Icon.LogOut /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:B.bg, fontFamily:"'DM Sans',sans-serif" }}>

      {/* Desktop sidebar */}
      <div style={{ width:220, flexShrink:0, background:B.dark, position:"fixed", top:0, left:0, bottom:0, zIndex:300, borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column" }} className="admin-sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(12,22,40,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", top:0, left:0, bottom:0, width:240, background:B.dark, zIndex:500, display:"flex", flexDirection:"column", animation:"slideUp .25s ease" }}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main */}
      <div style={{ flex:1, marginLeft:220, minWidth:0, display:"flex", flexDirection:"column" }} className="admin-main">

        {/* Top bar */}
        <div style={{ background:B.surface, borderBottom:`1px solid ${B.border}`, padding:"0 20px", position:"sticky", top:0, zIndex:200, display:"flex", alignItems:"center", height:56, gap:12 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textMuted, display:"none", padding:4 }} className="admin-menu-btn">
            <Icon.Menu />
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text }}>{activeMeta?.icon} {activeMeta?.label || "Admin"}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"none", fontSize:11, fontWeight:700, color:roleBadge.color, background:roleBadge.bg, borderRadius:20, padding:"3px 10px" }} className="role-chip">{roleBadge.label}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:10, background:B.bg, border:`1px solid ${B.border}` }}>
              <div style={{ width:26, height:26, borderRadius:8, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{init}</div>
              <div style={{ fontSize:12 }}>
                <div style={{ fontWeight:700, color:B.text, lineHeight:1 }}>{name}</div>
                <div style={{ color:B.accent, fontSize:10, fontWeight:700 }}>{roleBadge.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module content */}
        <div style={{ flex:1, padding:"24px 24px 40px", maxWidth:1300, width:"100%", margin:"0 auto" }}>
          <ActiveModule
            user={user}
            role={role}
            token={token}
            sb={sb}
            showToast={showToast}
          />
        </div>
      </div>

      <Toast toast={toast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#F5F4F1; color:#1C2B4B; -webkit-font-smoothing:antialiased; }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#E4E1D9; border-radius:4px; }
        .admin-sidebar-desktop { display:flex !important; }
        .admin-main { margin-left:220px !important; }
        @media (max-width:768px) {
          .admin-sidebar-desktop { display:none !important; }
          .admin-main { margin-left:0 !important; }
          .admin-menu-btn { display:flex !important; }
          .role-chip { display:block !important; }
        }
      `}</style>
    </div>
  );
}
