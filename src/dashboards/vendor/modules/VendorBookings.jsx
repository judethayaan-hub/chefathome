/**
 * dashboards/vendor/modules/VendorBookings.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal booking management module for all vendor types.
 * Supports: Pending / Confirmed / In Progress / Completed / Cancelled / Refunded
 * Actions: Approve, Reject, Reschedule, Message Customer, Mark Complete
 */

import { useState, useMemo } from "react";
import {
  B, StatusBadge, SectionHeader, EmptyState, ConfirmDialog,
  Icon, formatDate, formatMoney, shortId, cardStyle, inputStyle,
} from "../../shared/tokens.jsx";

const ALL_STATUSES = ["all","pending","confirmed","in_progress","completed","cancelled","refunded"];

const STATUS_TABS = [
  { id: "all",         label: "All",        count: null },
  { id: "pending",     label: "Pending",    count: 3    },
  { id: "confirmed",   label: "Confirmed",  count: 5    },
  { id: "in_progress", label: "In Progress",count: 1    },
  { id: "completed",   label: "Completed",  count: null },
  { id: "cancelled",   label: "Cancelled",  count: null },
  { id: "refunded",    label: "Refunded",   count: null },
];

const MOCK_BOOKINGS = [
  { id: "a1b2-c3d4", customer: "Priya Subramaniam",  email: "priya@example.com", phone: "+94 77 123 4567", date: "2026-12-24", guests: 200, amount: 85000,  status: "pending",     package: "Buffet Royal",       notes: "Need vegetarian options for 40 guests", event_type: "Wedding Reception", created_at: "2026-12-10" },
  { id: "e5f6-g7h8", customer: "Kamal Perera",       email: "kamal@example.com", phone: "+94 71 234 5678", date: "2026-12-31", guests: 80,  amount: 45000,  status: "confirmed",   package: "Essential Package",   notes: "NYE party, need till 2am",              event_type: "New Year Party",    created_at: "2026-12-08" },
  { id: "i9j0-k1l2", customer: "Nadia Fernando",     email: "nadia@example.com", phone: "+94 76 345 6789", date: "2027-01-05", guests: 350, amount: 120000, status: "confirmed",   package: "Festival Package",    notes: "",                                      event_type: "Corporate Gala",    created_at: "2026-12-07" },
  { id: "m3n4-o5p6", customer: "Ravi Tissera",       email: "ravi@example.com",  phone: "+94 72 456 7890", date: "2026-12-20", guests: 60,  amount: 28000,  status: "completed",   package: "Hourly (3hrs)",       notes: "Badminton tournament",                  event_type: "Sports Event",      created_at: "2026-12-01" },
  { id: "q7r8-s9t0", customer: "Amara Liyanage",     email: "amara@example.com", phone: "+94 70 567 8901", date: "2026-12-18", guests: 150, amount: 65000,  status: "cancelled",   package: "Weekend Package",     notes: "Customer cancelled due to travel",      event_type: "Birthday Party",    created_at: "2026-11-28" },
  { id: "u1v2-w3x4", customer: "Senith Jayasinghe",  email: "senith@example.com",phone: "+94 77 678 9012", date: "2026-12-28", guests: 120, amount: 52000,  status: "pending",     package: "Pro Night",           notes: "DJ for engagement party",               event_type: "Engagement",        created_at: "2026-12-09" },
  { id: "y5z6-a7b8", customer: "Malsha Rodrigo",     email: "malsha@example.com",phone: "+94 71 789 0123", date: "2027-01-12", guests: 500, amount: 250000, status: "in_progress", package: "Grand Wedding",       notes: "Full decoration + catering combo",      event_type: "Wedding",           created_at: "2026-12-05" },
  { id: "c9d0-e1f2", customer: "Dulanka Weerasekara",email: "dulanka@example.com",phone: "+94 76 890 1234",date: "2026-12-15", guests: 90,  amount: 35000,  status: "refunded",    package: "Buffet Classic",      notes: "Refunded — event postponed",            event_type: "Corporate Lunch",   created_at: "2026-11-25" },
  { id: "g3h4-i5j6", customer: "Thisara Bandara",    email: "thisara@example.com",phone: "+94 72 901 2345",date: "2027-01-20", guests: 75,  amount: 42000,  status: "pending",     package: "Basic Package",       notes: "Birthday, prefer outdoor setup",        event_type: "Birthday",          created_at: "2026-12-11" },
];

function BookingDetailDrawer({ booking, onClose, onAction, showToast }) {
  const [note, setNote] = useState("");
  if (!booking) return null;

  const actions = [
    booking.status === "pending"     && { id: "approve",  label: "Approve Booking",   color: B.success, icon: "✅" },
    booking.status === "pending"     && { id: "reject",   label: "Reject Booking",    color: B.danger,  icon: "❌" },
    booking.status === "confirmed"   && { id: "complete", label: "Mark Completed",    color: B.info,    icon: "🎉" },
    ["pending","confirmed"].includes(booking.status) && { id: "reschedule", label: "Reschedule", color: B.warning, icon: "📅" },
    ["confirmed","completed"].includes(booking.status) && { id: "refund", label: "Issue Refund", color: B.danger, icon: "↩️" },
  ].filter(Boolean);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(12,22,40,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: B.surface, zIndex: 700, display: "flex", flexDirection: "column", boxShadow: "-12px 0 48px rgba(0,0,0,0.2)", animation: "slideInRight .25s ease" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: B.textMuted }}>
            <Icon.X />
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Booking #{shortId(booking.id)}</div>
            <div style={{ fontSize: 11, color: B.textMuted }}>Created {formatDate(booking.created_at)}</div>
          </div>
          <div style={{ marginLeft: "auto" }}><StatusBadge status={booking.status} /></div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Customer info */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Customer</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: B.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>{booking.customer}</div>
                <div style={{ fontSize: 12, color: B.textMuted }}>{booking.email}</div>
                <div style={{ fontSize: 12, color: B.textMuted }}>{booking.phone}</div>
              </div>
            </div>
          </div>

          {/* Event details */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Event Details</div>
            {[
              ["Event Type",  booking.event_type],
              ["Event Date",  formatDate(booking.date)],
              ["Guests",      `${booking.guests} guests`],
              ["Package",     booking.package],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${B.border}` }}>
                <span style={{ fontSize: 12, color: B.textMuted }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{v}</span>
              </div>
            ))}
            {booking.notes && (
              <div style={{ marginTop: 10, padding: "10px", background: B.bg, borderRadius: 8, fontSize: 12, color: B.textMuted, lineHeight: 1.5 }}>
                📝 {booking.notes}
              </div>
            )}
          </div>

          {/* Payment */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Payment</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: B.textMuted }}>Total Amount</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: B.accent }}>{formatMoney(booking.amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: B.textMuted, marginTop: 6 }}>
              <span>Platform fee (5%)</span><span>{formatMoney(Math.round(booking.amount * 0.05))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: B.success, marginTop: 6 }}>
              <span>Your earnings</span><span>{formatMoney(Math.round(booking.amount * 0.95))}</span>
            </div>
          </div>

          {/* Message to customer */}
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Send Message</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write a message to the customer..."
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${B.border}`, background: B.bg, fontSize: 13, color: B.text, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={() => { if (note.trim()) { showToast("Message sent to customer!"); setNote(""); } }}
              disabled={!note.trim()}
              style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 9, background: B.primary, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: note.trim() ? "pointer" : "not-allowed", opacity: note.trim() ? 1 : 0.5 }}
            >
              Send Message 💬
            </button>
          </div>
        </div>

        {/* Action buttons footer */}
        {actions.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${B.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map(a => (
              <button
                key={a.id}
                onClick={() => onAction(booking.id, a.id)}
                style={{ width: "100%", padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", background: a.id === "approve" || a.id === "complete" ? a.color : a.id === "reject" || a.id === "refund" ? `${a.color}15` : B.bg, color: a.id === "approve" || a.id === "complete" ? "#fff" : a.color, border: `1.5px solid ${a.id === "approve" || a.id === "complete" ? a.color : `${a.color}40`}` }}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function VendorBookings({ vendor, showToast }) {
  const [statusFilter, setStatusFilter]   = useState("all");
  const [search, setSearch]               = useState("");
  const [bookings, setBookings]           = useState(MOCK_BOOKINGS);
  const [selected, setSelected]           = useState(null);
  const [confirm, setConfirm]             = useState(null); // { bookingId, action }

  const filtered = useMemo(() => {
    let list = bookings;
    if (statusFilter !== "all") list = list.filter(b => b.status === statusFilter);
    if (search.trim()) list = list.filter(b =>
      b.customer.toLowerCase().includes(search.toLowerCase()) ||
      shortId(b.id).toLowerCase().includes(search.toLowerCase()) ||
      b.event_type?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [bookings, statusFilter, search]);

  const handleAction = (bookingId, action) => {
    const statusMap = { approve: "confirmed", reject: "cancelled", complete: "completed", refund: "refunded" };
    if (action === "reschedule") { showToast("Reschedule flow — coming soon!", "info"); return; }
    const newStatus = statusMap[action];
    if (!newStatus) return;

    const confirmMessages = {
      reject:   { title: "Reject Booking?",  desc: "The customer will be notified and any payment refunded.",   danger: true  },
      refund:   { title: "Issue Refund?",     desc: "This will refund the customer and cannot be undone.",       danger: true  },
      approve:  { title: "Approve Booking?",  desc: "The customer will be notified that their booking is confirmed.", danger: false },
      complete: { title: "Mark Completed?",   desc: "This will release the escrow payment to your account.",    danger: false },
    };
    const msg = confirmMessages[action];
    if (msg) { setConfirm({ bookingId, action, newStatus, ...msg }); return; }

    applyAction(bookingId, newStatus);
  };

  const applyAction = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    if (selected?.id === bookingId) setSelected(prev => ({ ...prev, status: newStatus }));
    setConfirm(null);
    showToast(`Booking updated to "${newStatus}"!`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="Booking Management" sub={`${bookings.length} total bookings`} />

      {/* Status tab filter */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: statusFilter === t.id ? B.primary : B.surface, color: statusFilter === t.id ? "#fff" : B.textMuted, border: `1.5px solid ${statusFilter === t.id ? B.primary : B.border}` }}
          >
            {t.label}
            {t.count && <span style={{ background: statusFilter === t.id ? "rgba(255,255,255,0.2)" : B.bg, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: B.surface, border: `1.5px solid ${B.border}`, borderRadius: 10, padding: "9px 13px" }}>
        <Icon.Search />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customer, event type, booking ID..."
          style={{ flex: 1, border: "none", background: "none", fontSize: 13, color: B.text, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted }}><Icon.X /></button>}
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <EmptyState emoji="📋" title="No bookings found" desc="Try adjusting your filter or search query." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(b => (
            <div
              key={b.id}
              onClick={() => setSelected(b)}
              style={{ ...cardStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "box-shadow .15s" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>{b.customer}</div>
                  <span style={{ fontSize: 10, color: B.textMuted, background: B.bg, padding: "2px 6px", borderRadius: 6 }}>#{shortId(b.id)}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: B.textMuted, flexWrap: "wrap" }}>
                  <span>📅 {formatDate(b.date)}</span>
                  <span>👥 {b.guests} guests</span>
                  <span>🎉 {b.event_type}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: B.text, marginBottom: 5 }}>{formatMoney(b.amount)}</div>
                <StatusBadge status={b.status} />
              </div>
              <Icon.ChevRight />
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <BookingDetailDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          showToast={showToast}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          desc={confirm.desc}
          danger={confirm.danger}
          onConfirm={() => applyAction(confirm.bookingId, confirm.newStatus)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
