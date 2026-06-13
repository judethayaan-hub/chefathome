/**
 * dashboards/vendor/modules/VendorDashboardHome.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Landing overview for every vendor type. Shows live stats, revenue chart,
 * recent bookings, and quick actions. All data is mock until Supabase is wired.
 */

import { useState } from "react";
import {
  B, StatCard, MiniBarChart, StatusBadge, SectionHeader,
  Icon, formatDate, formatMoney, shortId, cardStyle,
} from "../../shared/tokens.js";

// ── Mock data helpers ─────────────────────────────────────────────────────────
const RECENT_BOOKINGS = [
  { id: "a1b2c3d4", customer: "Priya S.",    date: "2026-12-24", amount: 85000, status: "confirmed", guests: 200 },
  { id: "e5f6g7h8", customer: "Kamal P.",    date: "2026-12-31", amount: 45000, status: "pending",   guests: 80  },
  { id: "i9j0k1l2", customer: "Nadia F.",    date: "2027-01-05", amount: 120000,status: "confirmed", guests: 350 },
  { id: "m3n4o5p6", customer: "Ravi T.",     date: "2026-12-20", amount: 28000, status: "completed", guests: 60  },
  { id: "q7r8s9t0", customer: "Amara L.",    date: "2026-12-18", amount: 65000, status: "cancelled", guests: 150 },
];

const REVENUE_CHART = [
  { label: "Jul", value: 185000 },
  { label: "Aug", value: 240000 },
  { label: "Sep", value: 195000 },
  { label: "Oct", value: 310000 },
  { label: "Nov", value: 280000 },
  { label: "Dec", value: 420000 },
];

const QUICK_ACTIONS = [
  { id: "add_block",    label: "Block Date",       icon: "🚫", desc: "Mark a date unavailable" },
  { id: "add_promo",    label: "Add Promotion",    icon: "🏷️", desc: "Create a discount offer" },
  { id: "view_reviews", label: "See Reviews",      icon: "⭐", desc: "3 new reviews pending" },
  { id: "payout",       label: "Request Payout",   icon: "💸", desc: "LKR 285,000 available" },
];

const UPCOMING_TASKS = [
  { label: "Reply to Kamal's booking inquiry", due: "Today", urgent: true  },
  { label: "Update December availability",      due: "Today", urgent: true  },
  { label: "Confirm catering for #A1B2",        due: "Tomorrow", urgent: false },
  { label: "Upload new venue photos",           due: "This week", urgent: false },
];

const TOP_SERVICES = [
  { label: "Weekend Slot (6PM–10PM)", pct: 78, revenue: 320000 },
  { label: "Morning Slot (6AM–10AM)", pct: 54, revenue: 180000 },
  { label: "Full Day Package",         pct: 31, revenue: 95000  },
];

export default function VendorDashboardHome({ vendor, user, showToast }) {
  const [taskDone, setTaskDone] = useState([]);

  const toggleTask = (i) =>
    setTaskDone(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const totalRevenue = RECENT_BOOKINGS.filter(b => ["confirmed","completed"].includes(b.status)).reduce((s,b) => s + b.amount, 0);
  const pendingCount = RECENT_BOOKINGS.filter(b => b.status === "pending").length;
  const confirmedCount = RECENT_BOOKINGS.filter(b => b.status === "confirmed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Greeting banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${B.dark} 0%, #1e3a6b 100%)`,
        borderRadius: 18, padding: "22px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(212,175,106,0.07)", border: "1px solid rgba(212,175,106,0.1)", pointerEvents: "none" }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{greeting}, {name} 👋</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          {vendor?.name || "Your Venue"}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Listed & Active</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.Star /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>4.9 · 127 reviews</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>🛡️ Verified</span>
          </div>
        </div>
      </div>

      {/* ── KPI stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard label="This Month Revenue"   value={formatMoney(totalRevenue)}  accent={B.accent}   icon="💰" sub="+18% vs last month" />
        <StatCard label="Pending Bookings"     value={pendingCount}               accent={B.warning}  icon="📅" sub="Needs your response" />
        <StatCard label="Confirmed Upcoming"   value={confirmedCount}             accent={B.success}  icon="✅" sub="Next 30 days" />
        <StatCard label="Profile Views"        value="1,284"                      accent={B.info}     icon="👁️" sub="+32% this week" />
      </div>

      {/* ── Revenue chart + Top services ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Revenue chart */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Revenue Trend" sub="Last 6 months" />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: B.text }}>
              {formatMoney(REVENUE_CHART.reduce((s, d) => s + d.value, 0))}
            </div>
            <div style={{ fontSize: 11, color: B.success, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon.TrendUp /> +24% vs previous period
            </div>
          </div>
          <MiniBarChart data={REVENUE_CHART} color={B.accent} />
        </div>

        {/* Top services */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Top Services" sub="By bookings" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {TOP_SERVICES.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: B.text, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: B.textMuted }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: B.bg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, borderRadius: 3, background: i === 0 ? B.accent : i === 1 ? B.primary : B.textLight, transition: "width .5s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: B.textMuted, marginTop: 3 }}>{formatMoney(s.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent bookings + To-do ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        {/* Recent bookings */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Recent Bookings" sub="Last 5 transactions"
            action={<button style={{ fontSize: 12, color: B.accent, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>View all →</button>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {RECENT_BOOKINGS.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${B.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: B.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>{b.customer}</div>
                  <div style={{ fontSize: 11, color: B.textMuted }}>{formatDate(b.date)} · {b.guests} guests</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 4 }}>{formatMoney(b.amount)}</div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task checklist */}
        <div style={{ ...cardStyle }}>
          <SectionHeader title="Action Items" sub={`${UPCOMING_TASKS.length - taskDone.length} remaining`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {UPCOMING_TASKS.map((t, i) => (
              <div
                key={i}
                onClick={() => toggleTask(i)}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: taskDone.includes(i) ? B.bg : t.urgent ? "rgba(217,106,0,0.05)" : B.surface, border: `1px solid ${t.urgent && !taskDone.includes(i) ? "rgba(217,106,0,0.2)" : B.border}` }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${taskDone.includes(i) ? B.success : B.border}`, background: taskDone.includes(i) ? B.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {taskDone.includes(i) && <Icon.Check />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: taskDone.includes(i) ? B.textLight : B.text, textDecoration: taskDone.includes(i) ? "line-through" : "none" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: t.urgent && !taskDone.includes(i) ? B.warning : B.textLight, fontWeight: t.urgent ? 700 : 400, marginTop: 2 }}>{t.due}{t.urgent ? " · Urgent" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ ...cardStyle }}>
        <SectionHeader title="Quick Actions" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => showToast(`${a.label} — coming soon!`, "info")}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "14px", borderRadius: 12, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>{a.label}</div>
              <div style={{ fontSize: 11, color: B.textMuted }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
