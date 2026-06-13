import { useState } from "react";

const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040", warning: "#D97706",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// Deterministic mock blocked dates for a given month/year
function getBlockedDays(year, month) {
  const seed = year * 12 + month;
  return [
    (seed % 28) + 1,
    ((seed * 3) % 27) + 2,
    ((seed * 7) % 26) + 3,
    ((seed * 11) % 25) + 4,
    ((seed * 13) % 24) + 5,
  ];
}

function CalendarMonth({ year, month, selectedDay, onSelectDay }) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blocked = getBlockedDays(year, month);
  const today = new Date();
  const todayMark = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to full grid
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: B.textMuted, padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isBlocked = blocked.includes(day);
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedDay?.day === day && selectedDay?.month === month && selectedDay?.year === year;
          const isToday = day === todayMark;
          const disabled = isBlocked || isPast;

          let bg = B.bg, color = B.text, border = "transparent", cursor = "pointer";
          if (disabled) { bg = B.bg; color = B.textLight; cursor = "default"; }
          if (isBlocked && !isPast) { bg = "#FEF2F2"; color = B.danger; }
          if (isSelected) { bg = B.dark; color = "#fff"; border = B.dark; }
          if (isToday && !isSelected) { border = B.accent; }

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onSelectDay({ day, month, year })}
              style={{
                aspectRatio: "1", borderRadius: 8, fontSize: 12, fontWeight: isSelected ? 700 : 500,
                background: bg, color, border: `1.5px solid ${border}`, cursor,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .12s", opacity: isPast ? 0.35 : 1,
                position: "relative",
              }}
            >
              {day}
              {isBlocked && !isPast && (
                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: B.danger }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DECORATION_OPTIONS = [
  "Floral arrangements",
  "Draping & fabric",
  "LED uplighting",
  "Centrepieces",
  "Stage & backdrop",
  "Photo booth area",
];

export default function WeddingInquiryWidget({ vendor, user, onInquiry, onTour }) {
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [step, setStep] = useState("calendar"); // "calendar" | "form" | "submitted"
  const [decorations, setDecorations] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", guests: "", ceremony: "reception", notes: "" });
  const [loading, setLoading] = useState(false);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const toggleDecoration = (dec) =>
    setDecorations(prev => prev.includes(dec) ? prev.filter(d => d !== dec) : [...prev, dec]);

  const handleCheckAvailability = () => {
    if (!selectedDay) return;
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.guests) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API
    setLoading(false);
    setStep("submitted");
    onInquiry?.({ ...form, date: selectedDay, decorations });
  };

  const selectedLabel = selectedDay
    ? `${selectedDay.day} ${MONTH_NAMES[selectedDay.month]} ${selectedDay.year}`
    : null;

  // ── Step: Calendar ────────────────────────────────────────────────────────
  if (step === "calendar") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Romantic header */}
      <div style={{
        background: `linear-gradient(135deg, ${B.dark} 0%, #2a1a42 100%)`,
        borderRadius: 16, padding: "18px 18px 16px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 36 }}>💒</span>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>
            Check Availability
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
            Dates marked in red are already reserved
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: B.text }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <CalendarMonth year={calYear} month={calMonth} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { bg: B.bg, border: B.accent, label: "Today" },
            { bg: "#FEF2F2", border: "rgba(217,64,64,0.3)", label: "Reserved" },
            { bg: B.dark, border: B.dark, label: "Selected" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
              <span style={{ fontSize: 11, color: B.textMuted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected date display */}
      {selectedDay && (
        <div style={{
          background: "rgba(212,175,106,0.08)", borderRadius: 12, padding: "12px 16px",
          border: `1px solid rgba(212,175,106,0.3)`, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Selected Date</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: B.accent, fontWeight: 700, marginTop: 2 }}>{selectedLabel}</div>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          disabled={!selectedDay}
          onClick={handleCheckAvailability}
          style={{
            flex: 2, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            border: "none", cursor: selectedDay ? "pointer" : "not-allowed",
            background: selectedDay ? B.dark : B.bg,
            color: selectedDay ? "#fff" : B.textLight,
            transition: "all .2s",
          }}
        >
          Check Availability →
        </button>
        <button
          onClick={() => onTour?.()}
          style={{
            flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 13,
            border: `1.5px solid ${B.accent}`, cursor: "pointer",
            background: B.accentSoft, color: B.primary,
          }}
        >
          🏛️ Book Tour
        </button>
      </div>
    </div>
  );

  // ── Step: Lead capture form ───────────────────────────────────────────────
  if (step === "form") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setStep("calendar")} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.textMuted} strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.text }}>Your Inquiry</div>
          <div style={{ fontSize: 12, color: B.accent, fontWeight: 600 }}>{selectedLabel}</div>
        </div>
      </div>

      {[
        { key: "name",   label: "Full Name *",        type: "text",   placeholder: "Your name" },
        { key: "phone",  label: "Phone Number *",     type: "tel",    placeholder: "+94 77 123 4567" },
        { key: "guests", label: "Expected Guest Count *", type: "number", placeholder: "e.g. 250" },
      ].map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
          <input
            type={type}
            value={form[key]}
            placeholder={placeholder}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.surface, fontSize: 14, color: B.text, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      ))}

      {/* Ceremony type */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Ceremony Type</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["reception","🥂 Reception"],["ceremony","💍 Ceremony"],["both","💒 Both"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setForm(f => ({ ...f, ceremony: val }))}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: form.ceremony === val ? B.primary : B.surface,
                color: form.ceremony === val ? "#fff" : B.text,
                border: `1.5px solid ${form.ceremony === val ? B.primary : B.border}`,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Decoration interests */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Decoration Interests (optional)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {DECORATION_OPTIONS.map(dec => (
            <button
              key={dec}
              onClick={() => toggleDecoration(dec)}
              style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: decorations.includes(dec) ? "rgba(212,175,106,0.15)" : B.bg,
                color: decorations.includes(dec) ? "#9C7339" : B.textMuted,
                border: `1.5px solid ${decorations.includes(dec) ? B.accent : B.border}`,
              }}
            >{dec}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Additional Notes</div>
        <textarea
          value={form.notes}
          placeholder="Any special requirements or questions for the venue..."
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.surface, fontSize: 14, color: B.text, outline: "none", resize: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          disabled={!form.name || !form.phone || !form.guests || loading}
          onClick={handleSubmit}
          style={{
            flex: 2, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            border: "none", cursor: (form.name && form.phone && form.guests && !loading) ? "pointer" : "not-allowed",
            background: (form.name && form.phone && form.guests) ? B.dark : B.bg,
            color: (form.name && form.phone && form.guests) ? "#fff" : B.textLight,
          }}
        >
          {loading ? "Sending…" : "Send Inquiry 💌"}
        </button>
        <button
          onClick={() => onTour?.()}
          style={{
            flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 13,
            border: `1.5px solid ${B.accent}`, cursor: "pointer",
            background: B.accentSoft, color: B.primary,
          }}
        >
          Schedule Tour
        </button>
      </div>
    </div>
  );

  // ── Step: Submitted ───────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 16px", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(26,155,108,0.1)", border: `2px solid ${B.success}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
        ✅
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: B.text }}>Inquiry Sent!</div>
        <div style={{ fontSize: 13, color: B.textMuted, marginTop: 8, lineHeight: 1.6 }}>
          The venue team will contact you within 24 hours to confirm availability for <strong style={{ color: B.accent }}>{selectedLabel}</strong>.
        </div>
      </div>
      <div style={{ background: B.accentSoft, borderRadius: 14, padding: "14px 18px", border: `1px solid rgba(212,175,106,0.3)`, width: "100%", textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Inquiry Summary</div>
        {[
          ["Date", selectedLabel],
          ["Name", form.name],
          ["Guests", form.guests],
          ["Type", form.ceremony],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid rgba(212,175,106,0.15)` }}>
            <span style={{ color: B.textMuted }}>{k}</span>
            <span style={{ fontWeight: 600, color: B.text, textTransform: "capitalize" }}>{v}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => { setStep("calendar"); setSelectedDay(null); setForm({ name: "", phone: "", guests: "", ceremony: "reception", notes: "" }); setDecorations([]); }}
        style={{ padding: "11px 28px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", color: B.text }}
      >
        ← Check Another Date
      </button>
    </div>
  );
}
