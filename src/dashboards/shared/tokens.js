/**
 * dashboards/shared/tokens.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Design tokens, shared styles, and micro-components reused across the
 * Admin, Vendor, and Customer dashboards.  Every color, font and spacing
 * decision is authored here once.
 */

// ─── Palette ──────────────────────────────────────────────────────────────────
export const B = {
  primary:    "#1C2B4B",
  accent:     "#D4AF6A",
  accentSoft: "#FBF5E9",
  success:    "#1A9B6C",
  danger:     "#D94040",
  warning:    "#D97706",
  info:       "#0369A1",
  bg:         "#F5F4F1",
  surface:    "#FFFFFF",
  border:     "#E4E1D9",
  text:       "#1C2B4B",
  textMuted:  "#7A7D8C",
  textLight:  "#B0B3C1",
  dark:       "#0C1628",
};

export const STATUS_COLORS = {
  pending:           { bg: "#FFFBEB", c: "#D97706", label: "Pending" },
  confirmed:         { bg: "#EDFAF4", c: "#1A9B6C", label: "Confirmed" },
  in_progress:       { bg: "#E8F5FF", c: "#0369A1", label: "In Progress" },
  completed:         { bg: "#F0F4FF", c: "#3B4FCC", label: "Completed" },
  cancelled:         { bg: "#FEF2F2", c: "#D94040", label: "Cancelled" },
  refunded:          { bg: "#F9F0FF", c: "#7C3AED", label: "Refunded" },
  paid:              { bg: "#E8F5FF", c: "#0369A1", label: "Payment Held" },
  release_requested: { bg: "#FFF4E5", c: "#C05621", label: "Release Req." },
  released:          { bg: "#EDFAF4", c: "#1A9B6C", label: "Released" },
  open:              { bg: "#FFFBEB", c: "#D97706", label: "Open" },
  resolved:          { bg: "#EDFAF4", c: "#1A9B6C", label: "Resolved" },
  closed:            { bg: "#F5F4F1", c: "#7A7D8C", label: "Closed" },
  approved:          { bg: "#EDFAF4", c: "#1A9B6C", label: "Approved" },
  suspended:         { bg: "#FEF2F2", c: "#D94040", label: "Suspended" },
  rejected:          { bg: "#FEF2F2", c: "#D94040", label: "Rejected" },
  available:         { bg: "#EDFAF4", c: "#1A9B6C", label: "Available" },
  blocked:           { bg: "#FEF2F2", c: "#D94040", label: "Blocked" },
  maintenance:       { bg: "#FFFBEB", c: "#D97706", label: "Maintenance" },
};

export const CAT_LABELS = {
  chefs: "Personal Chef", catering: "Catering", wedding: "Wedding Hall",
  party: "Party Hall",    sports: "Indoor Sports", djs: "DJ & Music",
  photographers: "Photography", vendors: "Event Vendor",
};
export const CAT_EMOJI = {
  chefs: "👨‍🍳", catering: "🍽️", wedding: "💒", party: "🎉",
  sports: "🏸", djs: "🎧", photographers: "📷", vendors: "🎪",
};

// ─── Typography global string (injected once at root) ─────────────────────────
export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');`;

// ─── Shared inline style helpers ──────────────────────────────────────────────
export const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: `1.5px solid ${B.border}`, background: B.bg,
  fontSize: 13, color: B.text, outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

export const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: B.textMuted,
  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
};

export const cardStyle = {
  background: B.surface, borderRadius: 14,
  border: `1px solid ${B.border}`, padding: 16,
};

// ─── Micro-components ─────────────────────────────────────────────────────────

/** Status badge pill */
export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: B.bg, c: B.textMuted, label: status };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.c, border: `1px solid ${s.c}33`,
    }}>{s.label}</span>
  );
}

/** Skeleton shimmer block */
export function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#E8E5DC 25%,#F0EDE4 50%,#E8E5DC 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

/** Stat card */
export function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: accent || B.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: B.textMuted }}>{sub}</div>}
    </div>
  );
}

/** Empty state */
export function EmptyState({ emoji, title, desc, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 48 }}>{emoji}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: B.text }}>{title}</div>
      {desc && <div style={{ fontSize: 13, color: B.textMuted, maxWidth: 280, lineHeight: 1.6 }}>{desc}</div>}
      {action}
    </div>
  );
}

/** Section header with optional action */
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: B.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: B.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

/** Toast notification */
export function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: { bg: "#EDFAF4", border: "#1A9B6C", text: "#1A9B6C" },
    error:   { bg: "#FEF2F2", border: "#D94040", text: "#D94040" },
    info:    { bg: "#E8F5FF", border: "#0369A1", text: "#0369A1" },
  };
  const s = colors[toast.type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600,
      color: s.text, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      animation: "slideUp .3s ease", whiteSpace: "nowrap",
    }}>{toast.msg}</div>
  );
}

/** Mini bar chart using div widths */
export function MiniBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", borderRadius: "3px 3px 0 0",
            height: `${(d.value / max) * 44}px`,
            background: color || B.accent,
            minHeight: 4,
            transition: "height .3s ease",
          }} />
          <div style={{ fontSize: 8, color: B.textLight, whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Confirmation dialog */
export function ConfirmDialog({ title, desc, onConfirm, onCancel, danger = false }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(12,22,40,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 8001, width: "min(360px, 92vw)", background: B.surface, borderRadius: 18,
        border: `1px solid ${B.border}`, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        animation: "slideUp .25s ease",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: B.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: B.textMuted, lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, background: B.bg, border: `1.5px solid ${B.border}`, color: B.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, background: danger ? B.danger : B.primary, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export const Icon = {
  X:          () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  ChevLeft:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>,
  ChevRight:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>,
  Check:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Edit:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Search:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Filter:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Download:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Bell:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  LogOut:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  TrendUp:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Calendar:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Menu:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Star:       () => <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4AF6A" stroke="#D4AF6A" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
};

export const formatDate  = (d) => d ? new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const formatMoney = (n) => `LKR ${(n || 0).toLocaleString()}`;
export const shortId     = (id) => (id ? id.replace(/-/g, "").slice(0, 8).toUpperCase() : "—");
