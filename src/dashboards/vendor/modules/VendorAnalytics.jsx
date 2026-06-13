import { useState } from "react";
import { B, SectionHeader, StatCard, MiniBarChart, cardStyle, Icon, formatMoney } from "../../shared/tokens.js";

const REVENUE_DATA = [
  {label:"Jul",value:185000},{label:"Aug",value:240000},{label:"Sep",value:195000},
  {label:"Oct",value:310000},{label:"Nov",value:280000},{label:"Dec",value:420000},
];
const BOOKINGS_DATA = [
  {label:"Jul",value:12},{label:"Aug",value:18},{label:"Sep",value:14},
  {label:"Oct",value:22},{label:"Nov",value:19},{label:"Dec",value:28},
];
const TOP_SOURCES = [
  { label:"Direct search",      pct:42 },
  { label:"Category browse",    pct:28 },
  { label:"Referral / share",   pct:18 },
  { label:"Returning customer", pct:12 },
];
const PEAK_HOURS = ["6PM–7PM","7PM–8PM","8PM–9PM","5PM–6PM","9PM–10PM"].map((l,i)=>({label:l,value:[68,74,71,55,42][i]}));

export default function VendorAnalytics() {
  const [period, setPeriod] = useState("6m");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Analytics" sub="Performance overview" />
        <div style={{ display:"flex", background:B.bg, borderRadius:10, padding:3, gap:3 }}>
          {["1m","3m","6m","1y"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:period===p?B.surface:"transparent", color:period===p?B.primary:B.textMuted, boxShadow:period===p?"0 1px 4px rgba(0,0,0,0.1)":"none" }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label="Total Revenue"     value={formatMoney(1630000)} accent={B.accent}  icon="💰" sub="+24% vs last period" />
        <StatCard label="Total Bookings"    value="113"                  accent={B.primary} icon="📅" sub="Confirmed + completed" />
        <StatCard label="Occupancy Rate"    value="78%"                  accent={B.success} icon="📊" sub="+5pp vs last period" />
        <StatCard label="Avg. Booking Value" value={formatMoney(14425)} accent={B.info}    icon="💎" sub="Per booking" />
        <StatCard label="Repeat Customers"  value="41%"                  accent={B.warning} icon="🔄" sub="Booked more than once" />
        <StatCard label="Conversion Rate"   value="6.8%"                 accent={B.text}    icon="🎯" sub="Views → bookings" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Revenue" sub="Monthly" />
          <MiniBarChart data={REVENUE_DATA} color={B.accent} />
        </div>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Bookings" sub="Monthly" />
          <MiniBarChart data={BOOKINGS_DATA} color={B.primary} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Traffic Sources" sub="How customers find you" />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {TOP_SOURCES.map(s => (
              <div key={s.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:B.text, fontWeight:600 }}>{s.label}</span>
                  <span style={{ fontSize:11, color:B.textMuted }}>{s.pct}%</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:B.bg }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:B.accent, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Peak Hours" sub="Most popular booking times" />
          <MiniBarChart data={PEAK_HOURS} color={B.primary} />
        </div>
      </div>
    </div>
  );
}
