import { useState, useRef, useEffect } from "react";

// ─── Design tokens (mirrors App.jsx) ─────────────────────────────────────────
const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040", warning: "#D97706",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

// Build the next 14 days starting from today
function buildDates() {
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TIME_SLOTS = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM",
  "4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM",
];

// Deterministic mock — some slots always booked, some unavailable
function getSlotStatus(dateIdx, slotIdx) {
  const seed = (dateIdx * 7 + slotIdx * 13) % 17;
  if (seed < 4) return "booked";
  if (seed === 5 || seed === 11) return "unavailable";
  return "available";
}

const SLOT_HOUR_PRICE = 2500; // LKR per hour slot

export default function SportsGridWidget({ vendor, user, onBook }) {
  const dates = buildDates();
  const scrollRef = useRef(null);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [sportType, setSportType] = useState("badminton");

  const sports = [
    { id: "badminton", label: "🏸 Badminton" },
    { id: "futsal",    label: "⚽ Futsal" },
    { id: "basketball",label: "🏀 Basketball" },
    { id: "cricket",   label: "🏏 Cricket Nets" },
  ];

  // Scroll selected date into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-idx="${selectedDateIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDateIdx]);

  const toggleSlot = (slotIdx) => {
    const status = getSlotStatus(selectedDateIdx, slotIdx);
    if (status !== "available") return;
    setSelectedSlots(prev =>
      prev.includes(slotIdx) ? prev.filter(s => s !== slotIdx) : [...prev, slotIdx]
    );
  };

  // Reset slot selection when date changes
  const changeDate = (idx) => {
    setSelectedDateIdx(idx);
    setSelectedSlots([]);
  };

  const totalPrice = selectedSlots.length * SLOT_HOUR_PRICE;
  const selectedDate = dates[selectedDateIdx];
  const formattedDate = `${DAY_SHORT[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`;

  const statusConfig = {
    available:   { bg: "#EDFAF4", border: "rgba(26,155,108,0.3)",  color: B.success,  label: "Available" },
    booked:      { bg: "#FEF2F2", border: "rgba(217,64,64,0.25)",  color: B.danger,   label: "Booked" },
    unavailable: { bg: "#F5F4F1", border: B.border,                color: B.textLight,label: "Unavailable" },
    selected:    { bg: B.accent,  border: B.accent,                color: B.dark,     label: "Selected" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sport type selector */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Sport Type</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sports.map(s => (
            <button
              key={s.id}
              onClick={() => { setSportType(s.id); setSelectedSlots([]); }}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all .15s",
                background: sportType === s.id ? B.primary : B.bg,
                color: sportType === s.id ? "#fff" : B.textMuted,
                border: `1.5px solid ${sportType === s.id ? B.primary : B.border}`,
              }}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Date scroller */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: "14px 0 14px 16px", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, paddingRight: 16 }}>Select Date</div>
        <div
          ref={scrollRef}
          style={{
            display: "flex", gap: 8, overflowX: "auto", paddingRight: 16,
            scrollbarWidth: "none", msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {dates.map((d, idx) => {
            const isToday = idx === 0;
            const isSelected = idx === selectedDateIdx;
            return (
              <button
                key={idx}
                data-idx={idx}
                onClick={() => changeDate(idx)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  minWidth: 52, height: 64, borderRadius: 12, cursor: "pointer",
                  flexShrink: 0, transition: "all .15s",
                  background: isSelected ? B.dark : isToday ? B.accentSoft : B.bg,
                  border: `1.5px solid ${isSelected ? B.dark : isToday ? B.accent : B.border}`,
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? "rgba(255,255,255,0.5)" : B.textMuted, textTransform: "uppercase" }}>
                  {isToday ? "Today" : DAY_SHORT[d.getDay()]}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: isSelected ? "#fff" : B.text, lineHeight: 1 }}>{d.getDate()}</span>
                <span style={{ fontSize: 9, color: isSelected ? B.accent : B.textLight, fontWeight: 600 }}>
                  {MONTH_SHORT[d.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot grid */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Available Slots</div>
            <div style={{ fontSize: 12, color: B.textMuted, marginTop: 2 }}>{formattedDate}</div>
          </div>
          {selectedSlots.length > 0 && (
            <button
              onClick={() => setSelectedSlots([])}
              style={{ fontSize: 12, color: B.danger, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Slots grid — pill buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {TIME_SLOTS.map((slot, slotIdx) => {
            const status = getSlotStatus(selectedDateIdx, slotIdx);
            const isSelected = selectedSlots.includes(slotIdx);
            const cfg = isSelected ? statusConfig.selected : statusConfig[status];
            return (
              <button
                key={slotIdx}
                onClick={() => toggleSlot(slotIdx)}
                disabled={status !== "available"}
                style={{
                  padding: "9px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: status !== "available" ? "not-allowed" : "pointer",
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1.5px solid ${cfg.border}`,
                  transition: "all .12s",
                  opacity: status === "unavailable" ? 0.45 : 1,
                  textDecoration: status === "booked" ? "line-through" : "none",
                  textDecorationColor: B.danger,
                }}
              >
                {slot}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: cfg.bg, border: `1.5px solid ${cfg.border}` }} />
              <span style={{ fontSize: 11, color: B.textMuted }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price summary + CTA */}
      <div style={{
        background: B.dark, borderRadius: 16, padding: "16px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        border: selectedSlots.length > 0 ? `1.5px solid rgba(212,175,106,0.3)` : `1.5px solid transparent`,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
            {selectedSlots.length > 0
              ? `${selectedSlots.length} slot${selectedSlots.length > 1 ? "s" : ""} × LKR ${SLOT_HOUR_PRICE.toLocaleString()}`
              : "Select slots to book"}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700,
            color: selectedSlots.length > 0 ? B.accent : "rgba(255,255,255,0.2)",
            transition: "color .2s",
          }}>
            {selectedSlots.length > 0 ? `LKR ${totalPrice.toLocaleString()}` : "LKR —"}
          </div>
          {selectedSlots.length > 0 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              incl. 5% platform fee · Escrow protected
            </div>
          )}
        </div>
        <button
          disabled={selectedSlots.length === 0}
          onClick={() => onBook?.({ date: formattedDate, slots: selectedSlots.map(i => TIME_SLOTS[i]), sport: sportType, amount: totalPrice })}
          style={{
            padding: "12px 22px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            border: "none", cursor: selectedSlots.length === 0 ? "not-allowed" : "pointer",
            background: selectedSlots.length > 0 ? B.accent : "rgba(255,255,255,0.08)",
            color: selectedSlots.length > 0 ? B.dark : "rgba(255,255,255,0.2)",
            transition: "all .2s",
          }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
