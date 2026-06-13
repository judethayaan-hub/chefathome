/**
 * VendorAvailability.jsx - Universal availability manager with status blocks
 */
import { useState } from "react";
import { B, SectionHeader, cardStyle, Icon } from "../../shared/tokens.jsx";

const SLOTS = ["6AM","7AM","8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM","9PM","10PM"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function buildWeek() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const AVAIL_STATES = {
  available:   { bg:"#EDFAF4", border:"rgba(26,155,108,0.3)",  color:"#1A9B6C",  label:"Available"   },
  booked:      { bg:"#FEF2F2", border:"rgba(217,64,64,0.25)",  color:"#D94040",  label:"Booked"      },
  blocked:     { bg:"#F5F4F1", border:"#E4E1D9",               color:"#B0B3C1",  label:"Blocked"     },
  maintenance: { bg:"#FFFBEB", border:"rgba(217,119,6,0.3)",   color:"#D97706",  label:"Maintenance" },
};

function slotState(dayIdx, slotIdx) {
  const seed = (dayIdx * 11 + slotIdx * 7) % 20;
  if (seed < 5) return "booked";
  if (seed === 6 || seed === 13) return "blocked";
  if (seed === 17) return "maintenance";
  return "available";
}

export function VendorAvailability({ showToast }) {
  const week = buildWeek();
  const [selected, setSelected] = useState("available");
  const [overrides, setOverrides] = useState({});

  const getState = (di, si) => overrides[`${di}-${si}`] || slotState(di, si);
  const toggleSlot = (di, si) => {
    const key = `${di}-${si}`;
    const cur = getState(di, si);
    if (cur === "booked") return;
    setOverrides(prev => ({ ...prev, [key]: selected }));
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Availability Manager" sub="Click slots to set status" />

      {/* State selector */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {Object.entries(AVAIL_STATES).filter(([k]) => k !== "booked").map(([state, s]) => (
          <button key={state} onClick={() => setSelected(state)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", background: selected===state ? s.color : B.surface, color: selected===state ? "#fff" : s.color, border:`1.5px solid ${s.color}55` }}>
            {s.label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", fontSize:12, color:B.textMuted, alignSelf:"center" }}>
          Painting with: <strong style={{ color:AVAIL_STATES[selected].color }}>{AVAIL_STATES[selected].label}</strong>
        </div>
      </div>

      {/* Grid */}
      <div style={{ ...cardStyle, overflowX:"auto" }}>
        <div style={{ minWidth:640 }}>
          <div style={{ display:"grid", gridTemplateColumns:`60px repeat(7, 1fr)`, gap:4, marginBottom:6 }}>
            <div />
            {week.map((d, i) => (
              <div key={i} style={{ textAlign:"center", padding:"4px 0" }}>
                <div style={{ fontSize:10, color:B.textMuted, fontWeight:700, textTransform:"uppercase" }}>{DAYS_SHORT[d.getDay()]}</div>
                <div style={{ fontSize:13, fontWeight:700, color:i===0?B.accent:B.text }}>{d.getDate()}</div>
              </div>
            ))}
          </div>
          {SLOTS.map((slot, si) => (
            <div key={si} style={{ display:"grid", gridTemplateColumns:`60px repeat(7,1fr)`, gap:4, marginBottom:3 }}>
              <div style={{ fontSize:10, color:B.textMuted, fontWeight:600, alignSelf:"center", textAlign:"right", paddingRight:8 }}>{slot}</div>
              {week.map((_, di) => {
                const state = getState(di, si);
                const s = AVAIL_STATES[state];
                return (
                  <button key={di} onClick={() => toggleSlot(di, si)} style={{ height:28, borderRadius:6, border:`1px solid ${s.border}`, background:s.bg, cursor:state==="booked"?"not-allowed":"pointer", transition:"all .1s" }} title={s.label} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {Object.entries(AVAIL_STATES).map(([k, s]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:s.bg, border:`1.5px solid ${s.border}` }} />
            <span style={{ fontSize:11, color:B.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <button onClick={() => showToast("Availability saved!")} style={{ alignSelf:"flex-start", padding:"11px 28px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
        Save Changes
      </button>
    </div>
  );
}
export default VendorAvailability;
