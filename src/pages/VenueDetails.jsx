/**
 * VenueDetails.jsx
 *
 * Mock venue/vendor detail page that demonstrates the modular
 * booking widget architecture.
 *
 * Key pattern — NO if/else or switch:
 *   const Widget = BookingWidgetMap[currentVenue.category] ?? DefaultBookingWidget;
 *
 * Props
 *   currentVenue  – venue object { id, name, category, location, base_price, ... }
 *   user          – auth user object (null if signed out)
 *   token         – auth token string
 *   onBack        – () => void
 *   onBookSuccess – (payload) => void
 */

import { useState } from "react";
import { BookingWidgetMap } from "../utils/componentMapper";

// ─── Design tokens ────────────────────────────────────────────────────────────
const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

const CAT_LABELS = {
  chefs: "Personal Chef", catering: "Catering", wedding: "Wedding Hall",
  party: "Party Hall",    sports: "Indoor Sports", djs: "DJ & Music",
  photographers: "Photography", vendors: "Event Vendor",
};
const CAT_EMOJI = {
  chefs: "👨‍🍳", catering: "🍽️", wedding: "💒", party: "🎉",
  sports: "🏸", djs: "🎧", photographers: "📷", vendors: "🎪",
};

// ─── Default fallback widget (unknown category) ────────────────────────────
function DefaultBookingWidget({ vendor, user, onBook }) {
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");

  if (submitted) return (
    <div style={{ padding: "28px 20px", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: B.text }}>
        Request Sent!
      </div>
      <div style={{ fontSize: 13, color: B.textMuted, marginTop: 8 }}>
        The vendor will contact you within 24 hours.
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: B.accentSoft, borderRadius: 14, padding: 16, border: `1px solid rgba(212,175,106,0.3)` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: B.primary, marginBottom: 4 }}>📋 General Enquiry</div>
        <div style={{ fontSize: 12, color: B.textMuted }}>
          This vendor type uses a custom enquiry flow. Describe what you need below.
        </div>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Tell the vendor about your event, date, guests and any special requirements…"
        rows={5}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.surface, fontSize: 14, color: B.text, outline: "none", resize: "none", boxSizing: "border-box" }}
      />
      <button
        disabled={!notes.trim()}
        onClick={() => { setSubmitted(true); onBook?.({ notes }); }}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          border: "none", cursor: notes.trim() ? "pointer" : "not-allowed",
          background: notes.trim() ? B.dark : B.bg,
          color: notes.trim() ? "#fff" : B.textLight,
        }}
      >
        Send Enquiry
      </button>
    </div>
  );
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
function Toast({ msg, type = "success" }) {
  const colors = {
    success: { bg: "#EDFAF4", border: "#1A9B6C", text: "#1A9B6C" },
    error:   { bg: "#FEF2F2", border: "#D94040", text: "#D94040" },
    info:    { bg: "#E8F5FF", border: "#0369A1", text: "#0369A1" },
  };
  const s = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600,
      color: s.text, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      animation: "slideUp .3s ease", whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

// ─── Demo venue switcher (for development / preview) ──────────────────────────
const DEMO_VENUES = [
  { id: "v1", name: "Velocity Badminton Arena",  category: "sports",   location: "Colombo 03", base_price: 2500,  rating: "4.9", events_count: "200+", response_time: "< 30min" },
  { id: "v2", name: "The Grand Monarch Hall",     category: "wedding",  location: "Negombo",    base_price: 350000, rating: "4.8", events_count: "120+", response_time: "< 2hrs"  },
  { id: "v3", name: "Royal Feast Catering Co.",   category: "catering", location: "Colombo 07", base_price: 180000, rating: "4.7", events_count: "300+", response_time: "< 1hr"   },
  { id: "v4", name: "DJ Sonix — Event Specialist",category: "djs",      location: "Colombo 06", base_price: 35000,  rating: "5.0", events_count: "150+", response_time: "< 1hr"   },
  { id: "v5", name: "Skyline Party Lounge",       category: "party",    location: "Rajagiriya", base_price: 15000,  rating: "4.6", events_count: "80+",  response_time: "< 2hrs"  },
  { id: "v6", name: "Chef Malith — Private Chef", category: "chefs",    location: "Colombo",    base_price: 25000,  rating: "4.9", events_count: "90+",  response_time: "< 1hr"   },
  { id: "v7", name: "Unknown Vendor Type",        category: "vendors",  location: "Sri Lanka",  base_price: 10000,  rating: "4.5", events_count: "20+",  response_time: "< 4hrs"  },
];

// ─── Main VenueDetails component ──────────────────────────────────────────────
export default function VenueDetails({ currentVenue: propVenue, user, token, onBack, onBookSuccess }) {
  // If used standalone (demo mode), allow venue switching
  const [demoVenueId, setDemoVenueId] = useState(DEMO_VENUES[0].id);
  const currentVenue = propVenue ?? DEMO_VENUES.find(v => v.id === demoVenueId);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Core pattern: dictionary lookup, zero if/else ─────────────────────
  const BookingWidget = BookingWidgetMap[currentVenue.category] ?? DefaultBookingWidget;

  const handleBook = (payload) => {
    showToast("🎉 Booking request sent successfully!");
    onBookSuccess?.(payload);
  };
  const handleInquiry = (payload) => {
    showToast("💌 Inquiry sent! Expect a reply within 24 hours.", "info");
    onBookSuccess?.(payload);
  };
  const handleTour = () => {
    showToast("🏛️ Tour request sent to venue.", "info");
  };
  const handleTasting = (payload) => {
    showToast("🍴 Tasting session request sent!", "info");
    onBookSuccess?.(payload);
  };
  const handleQuote = (payload) => {
    showToast("📋 Custom quote request sent!", "info");
    onBookSuccess?.(payload);
  };

  const emoji    = CAT_EMOJI[currentVenue.category] || "🎪";
  const catLabel = CAT_LABELS[currentVenue.category] || currentVenue.category;

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Hero banner ── */}
      <div style={{
        height: 220, background: `linear-gradient(135deg, ${B.dark} 0%, #1a3a6b 100%)`,
        position: "relative", display: "flex", alignItems: "flex-end",
      }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, opacity: 0.12 }}>
          {emoji}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ position: "absolute", top: 20, left: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <div style={{ padding: "0 20px 20px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,175,106,0.2)", borderRadius: 20, padding: "4px 12px", marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{emoji}</span>
            <span style={{ fontSize: 12, color: B.accent, fontWeight: 600 }}>{catLabel}</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
            {currentVenue.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{currentVenue.location || "Sri Lanka"}</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ background: B.surface, borderBottom: `1px solid ${B.border}`, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Rating",   value: `${currentVenue.rating || "4.8"} ★` },
            { label: "Events",   value: currentVenue.events_count || "50+" },
            { label: "Response", value: currentVenue.response_time || "< 1hr" },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: B.text }}>{value}</div>
              <div style={{ fontSize: 10, color: B.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Demo venue switcher (only visible when no propVenue is passed) ── */}
      {!propVenue && (
        <div style={{ background: "#FFFBEB", borderBottom: `1px solid rgba(212,175,106,0.3)`, padding: "10px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
            🛠 Dev Preview — Switch Venue Category
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {DEMO_VENUES.map(v => (
              <button
                key={v.id}
                onClick={() => setDemoVenueId(v.id)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  background: demoVenueId === v.id ? B.primary : "rgba(212,175,106,0.12)",
                  color: demoVenueId === v.id ? "#fff" : "#92400E",
                  border: `1px solid ${demoVenueId === v.id ? B.primary : "rgba(212,175,106,0.3)"}`,
                }}
              >
                {CAT_EMOJI[v.category]} {CAT_LABELS[v.category] || v.category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking widget (dynamically resolved) ── */}
      <div style={{ padding: "20px 16px 100px" }}>

        {/* Widget label chip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: B.text }}>Book This Venue</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: B.textMuted, background: B.bg, border: `1px solid ${B.border}`, borderRadius: 20, padding: "3px 10px" }}>
            {catLabel} Widget
          </div>
        </div>

        {/*
          ── THE KEY LINE ──────────────────────────────────────────────────────
          BookingWidget is resolved from the dictionary at render time.
          No if/else. No switch. Just a component variable.
          All widget-specific callbacks are passed; each widget uses only what
          it needs and ignores the rest.
        */}
        {user ? (
          <BookingWidget
            vendor={currentVenue}
            user={user}
            token={token}
            onBook={handleBook}
            onInquiry={handleInquiry}
            onTour={handleTour}
            onTasting={handleTasting}
            onQuote={handleQuote}
          />
        ) : (
          <div style={{ background: B.accentSoft, borderRadius: 14, padding: 20, textAlign: "center", border: `1px solid rgba(212,175,106,0.3)` }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: B.text, marginBottom: 6 }}>Sign in to book</div>
            <div style={{ fontSize: 13, color: B.textMuted, marginBottom: 14 }}>
              Create a free Evara account to book this {catLabel.toLowerCase()}.
            </div>
            <button
              onClick={() => window.__evaraShowAuth?.()}
              style={{ padding: "11px 28px", borderRadius: 12, background: B.primary, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
