import { useState } from "react";
import { B, StatusBadge, SectionHeader, Icon, formatMoney, cardStyle } from "../../shared/tokens.jsx";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Mock events keyed by YYYY-MM-DD
const MOCK_EVENTS = {
  "2026-12-15": [{ id:1, customer:"Dulanka W.", type:"Corporate Lunch", amount:35000, status:"completed" }],
  "2026-12-18": [{ id:2, customer:"Amara L.",   type:"Birthday Party",  amount:65000, status:"cancelled" }],
  "2026-12-20": [{ id:3, customer:"Ravi T.",    type:"Sports Event",    amount:28000, status:"completed" }],
  "2026-12-24": [{ id:4, customer:"Priya S.",   type:"Wedding Reception",amount:85000,status:"confirmed" }],
  "2026-12-28": [{ id:5, customer:"Senith J.",  type:"Engagement Party",amount:52000, status:"pending"   }],
  "2026-12-31": [{ id:6, customer:"Kamal P.",   type:"New Year Party",  amount:45000, status:"confirmed" }],
  "2027-01-05": [{ id:7, customer:"Nadia F.",   type:"Corporate Gala",  amount:120000,status:"confirmed" }],
  "2027-01-12": [{ id:8, customer:"Malsha R.",  type:"Wedding",         amount:250000,status:"in_progress"}],
};
const BLOCKED_DATES = ["2026-12-25","2026-12-26","2027-01-01","2027-01-02"];

const STATUS_DOT = { confirmed:"#1A9B6C", pending:"#D97706", completed:"#0369A1", cancelled:"#D94040", in_progress:"#7C3AED" };

function toKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function MonthView({ year, month, selectedDay, onSelectDay }) {
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();
  const todayKey    = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: B.textMuted, padding: "6px 0", textTransform: "uppercase" }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key       = toKey(year, month, day);
          const events    = MOCK_EVENTS[key] || [];
          const isBlocked = BLOCKED_DATES.includes(key);
          const isToday   = key === todayKey;
          const isSelected= selectedDay === key;
          const isPast    = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <button
              key={i}
              onClick={() => onSelectDay(key)}
              style={{
                minHeight: 64, borderRadius: 10, border: `1.5px solid ${isSelected ? B.primary : isToday ? B.accent : isBlocked ? "rgba(217,64,64,0.3)" : B.border}`,
                background: isSelected ? B.primary : isBlocked ? "rgba(217,64,64,0.04)" : B.surface,
                cursor: "pointer", padding: "6px 5px", display: "flex", flexDirection: "column", alignItems: "flex-start",
                opacity: isPast && !events.length ? 0.4 : 1,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday || isSelected ? 700 : 500, color: isSelected ? "#fff" : isToday ? B.accent : isBlocked ? B.danger : B.text, marginBottom: 3, alignSelf: "flex-end" }}>{day}</div>
              {isBlocked && <div style={{ fontSize: 8, color: B.danger, fontWeight: 700, background: "rgba(217,64,64,0.1)", borderRadius: 4, padding: "1px 4px", marginBottom: 2 }}>BLOCKED</div>}
              {events.slice(0, 2).map((ev, ei) => (
                <div key={ei} style={{ width: "100%", background: `${STATUS_DOT[ev.status] || B.accent}18`, borderLeft: `2px solid ${STATUS_DOT[ev.status] || B.accent}`, borderRadius: "0 3px 3px 0", padding: "2px 4px", marginBottom: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: STATUS_DOT[ev.status] || B.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.customer}</div>
                </div>
              ))}
              {events.length > 2 && <div style={{ fontSize: 8, color: B.textMuted, fontWeight: 700 }}>+{events.length - 2} more</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ year, month }) {
  const entries = Object.entries(MOCK_EVENTS)
    .filter(([k]) => k.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
    .sort(([a],[b]) => a.localeCompare(b));

  if (!entries.length) return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: B.textMuted, fontSize: 13 }}>
      No events this month
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {entries.map(([dateKey, events]) => (
        <div key={dateKey}>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>
            {new Date(dateKey).toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {events.map(ev => (
            <div key={ev.id} style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: STATUS_DOT[ev.status] || B.accent, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>{ev.customer}</div>
                <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{ev.type}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 4 }}>{formatMoney(ev.amount)}</div>
                <StatusBadge status={ev.status} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function VendorCalendar({ showToast }) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [view, setView]     = useState("month"); // month | agenda
  const [selected, setSelected] = useState(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selectedEvents = selected ? (MOCK_EVENTS[selected] || []) : [];
  const isBlocked      = selected ? BLOCKED_DATES.includes(selected) : false;

  const toggleBlock = () => {
    showToast(isBlocked ? "Date unblocked!" : "Date blocked — customers can't book this day.", "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="Booking Calendar" sub="Click any date to view or manage events" />

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: B.textMuted }}><Icon.ChevLeft /></button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: B.text, minWidth: 160, textAlign: "center" }}>{MONTHS[month]} {year}</div>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: B.textMuted }}><Icon.ChevRight /></button>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: B.bg, borderRadius: 10, padding: 3, gap: 3 }}>
          {[["month","📅 Month"],["agenda","📋 Agenda"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: view === id ? B.surface : "transparent", color: view === id ? B.primary : B.textMuted, boxShadow: view === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>{label}</button>
          ))}
        </div>

        {/* Today + Block date */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", color: B.text }}>Today</button>
          {selected && <button onClick={toggleBlock} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1.5px solid ${B.danger}44`, background: "rgba(217,64,64,0.05)", cursor: "pointer", color: B.danger }}>{isBlocked ? "Unblock Date" : "Block Date"}</button>}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["confirmed","Confirmed"],["pending","Pending"],["completed","Completed"],["cancelled","Cancelled"]].map(([s,l]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_DOT[s] }} />
            <span style={{ fontSize: 11, color: B.textMuted }}>{l}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(217,64,64,0.1)", border: "1.5px solid rgba(217,64,64,0.3)" }} />
          <span style={{ fontSize: 11, color: B.textMuted }}>Blocked</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr", gap: 16 }}>
        {/* Calendar */}
        <div style={{ ...cardStyle }}>
          {view === "month" && <MonthView year={year} month={month} selectedDay={selected} onSelectDay={setSelected} />}
          {view === "agenda" && <AgendaView year={year} month={month} />}
        </div>

        {/* Day detail panel */}
        {selected && (
          <div style={{ ...cardStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>
                {new Date(selected).toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "short" })}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted }}><Icon.X /></button>
            </div>
            {isBlocked && (
              <div style={{ background: "rgba(217,64,64,0.06)", border: "1px solid rgba(217,64,64,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: B.danger, fontWeight: 600, marginBottom: 10 }}>
                🚫 This date is blocked
              </div>
            )}
            {selectedEvents.length === 0 && !isBlocked && (
              <div style={{ textAlign: "center", padding: "24px 0", color: B.textMuted, fontSize: 12 }}>
                No bookings — this date is available
              </div>
            )}
            {selectedEvents.map(ev => (
              <div key={ev.id} style={{ padding: "12px 0", borderBottom: `1px solid ${B.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 4 }}>{ev.customer}</div>
                <div style={{ fontSize: 11, color: B.textMuted, marginBottom: 6 }}>{ev.type}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: B.accent }}>{formatMoney(ev.amount)}</span>
                  <StatusBadge status={ev.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
