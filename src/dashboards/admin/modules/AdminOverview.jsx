import { useState } from "react";
import {
  B, StatCard, MiniBarChart, StatusBadge, SectionHeader,
  Icon, formatDate, formatMoney, shortId, cardStyle,
} from "../../shared/tokens.jsx";

const REVENUE_TREND = [
  {label:"Jul",value:2850000},{label:"Aug",value:3420000},{label:"Sep",value:2980000},
  {label:"Oct",value:4100000},{label:"Nov",value:3760000},{label:"Dec",value:5200000},
];
const BOOKING_TREND = [
  {label:"Jul",value:142},{label:"Aug",value:198},{label:"Sep",value:167},
  {label:"Oct",value:234},{label:"Nov",value:211},{label:"Dec",value:289},
];
const VENDOR_GROWTH = [
  {label:"Jul",value:34},{label:"Aug",value:42},{label:"Sep",value:38},
  {label:"Oct",value:55},{label:"Nov",value:61},{label:"Dec",value:74},
];

const RECENT_ACTIVITY = [
  { icon:"🏢", msg:"New vendor registered: Grand Palace Hotel",       time:"2m ago",   type:"vendor"  },
  { icon:"📅", msg:"Booking #F3A2 confirmed for Dec 31 – LKR 85,000",time:"14m ago",  type:"booking" },
  { icon:"⭐", msg:"New 1-star review flagged for abuse",              time:"32m ago",  type:"review"  },
  { icon:"💳", msg:"Payout released to DJ Sonix – LKR 62,000",        time:"1h ago",   type:"payment" },
  { icon:"🚨", msg:"Support ticket #T-224 opened by Kamal P.",         time:"2h ago",   type:"support" },
  { icon:"✅", msg:"Velocity Badminton Arena verified",                time:"3h ago",   type:"vendor"  },
  { icon:"↩️", msg:"Refund issued for booking #D9B1 – LKR 28,000",    time:"5h ago",   type:"refund"  },
  { icon:"📝", msg:"Category 'Photography' listing updated",           time:"6h ago",   type:"system"  },
];

const TOP_CATEGORIES = [
  { cat:"wedding",    label:"Wedding Hall",  revenue:1820000, bookings:48, pct:35 },
  { cat:"catering",   label:"Catering",      revenue:1240000, bookings:67, pct:24 },
  { cat:"sports",     label:"Sports Ground", revenue:980000,  bookings:112,pct:19 },
  { cat:"djs",        label:"DJ & Music",    revenue:760000,  bookings:54, pct:15 },
  { cat:"party",      label:"Party Hall",    revenue:400000,  bookings:28, pct:7  },
];

const CAT_EMOJI = { wedding:"💒", catering:"🍽️", sports:"🏸", djs:"🎧", party:"🎉" };

const PENDING_ACTIONS = [
  { label:"Vendors pending approval",  count:7,  urgency:"high",   action:"Review vendors →" },
  { label:"Listings pending review",   count:12, urgency:"medium", action:"Review listings →" },
  { label:"Open support tickets",      count:4,  urgency:"high",   action:"View tickets →" },
  { label:"Flagged reviews",           count:3,  urgency:"medium", action:"Moderate →" },
  { label:"Refund requests",           count:2,  urgency:"high",   action:"Process →" },
];

export default function AdminOverview({ showToast }) {
  const [period, setPeriod] = useState("30d");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Platform banner */}
      <div style={{ background:`linear-gradient(135deg, ${B.dark} 0%, #1a3060 100%)`, borderRadius:18, padding:"22px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(212,175,106,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:150, height:150, borderRadius:"50%", background:"rgba(212,175,106,0.04)", pointerEvents:"none" }} />
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>Platform Overview</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"#fff", marginBottom:12 }}>Evara Marketplace</div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {[
            ["Total GMV",    "LKR 22.4M", B.accent],
            ["Active Vendors","847",       "#4ADE80"],
            ["Customers",    "12,381",     "#60A5FA"],
            ["Avg Rating",   "4.7 ★",     B.accent],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'Playfair Display',serif" }}>{val}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:0.6 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending actions alert */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
        {PENDING_ACTIONS.map(a => (
          <div key={a.label} style={{ ...cardStyle, borderLeft:`3px solid ${a.urgency==="high"?B.danger:B.warning}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:a.urgency==="high"?B.danger:B.warning }}>{a.count}</div>
              <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>{a.label}</div>
            </div>
            <button onClick={() => showToast(`${a.label} — navigating...`, "info")} style={{ fontSize:11, fontWeight:700, color:B.accent, background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>{a.action}</button>
          </div>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:16, fontWeight:700, color:B.text }}>Platform Metrics</div>
        <div style={{ display:"flex", background:B.surface, borderRadius:10, border:`1px solid ${B.border}`, padding:3, gap:2 }}>
          {["7d","30d","90d","1y"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding:"5px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:period===p?B.dark:"transparent", color:period===p?"#fff":B.textMuted }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label="Platform Revenue" value={formatMoney(1265000)} accent={B.accent} icon="💰" sub="+22% vs last period" />
        <StatCard label="Total GMV"        value={formatMoney(5200000)} accent={B.primary} icon="📊" sub="Gross merchandise value" />
        <StatCard label="New Bookings"     value="289"                  accent={B.success} icon="📅" sub="+18% vs last period" />
        <StatCard label="New Vendors"      value="74"                   accent={B.info}    icon="🏢" sub="This month" />
        <StatCard label="New Customers"    value="1,284"                accent={B.warning} icon="👥" sub="Registered users" />
        <StatCard label="Conversion Rate"  value="7.2%"                 accent={B.text}    icon="🎯" sub="Browse → Book" />
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Revenue" sub="Monthly GMV" />
          <MiniBarChart data={REVENUE_TREND} color={B.accent} />
        </div>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Bookings" sub="Monthly" />
          <MiniBarChart data={BOOKING_TREND} color={B.primary} />
        </div>
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Vendor Growth" sub="New vendors / month" />
          <MiniBarChart data={VENDOR_GROWTH} color={B.success} />
        </div>
      </div>

      {/* Category performance + Recent activity */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Category performance */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Category Performance" sub="Revenue share" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {TOP_CATEGORIES.map(c => (
              <div key={c.cat}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:14 }}>{CAT_EMOJI[c.cat]}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:B.text }}>{c.label}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:B.text }}>{formatMoney(c.revenue)}</div>
                    <div style={{ fontSize:10, color:B.textMuted }}>{c.bookings} bookings</div>
                  </div>
                </div>
                <div style={{ height:6, borderRadius:3, background:B.bg }}>
                  <div style={{ height:"100%", width:`${c.pct}%`, background:B.accent, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity feed */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Recent Activity" sub="Live platform events" />
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:`1px solid ${B.border}` }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:B.text, lineHeight:1.4 }}>{a.msg}</div>
                  <div style={{ fontSize:10, color:B.textLight, marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
