import { useState } from "react";
import { B, SectionHeader, StatusBadge, cardStyle, Icon, formatDate, formatMoney } from "../../shared/tokens.jsx";

const TRANSACTIONS = [
  { id:"TXN-001", type:"booking",    desc:"Wedding Reception – Priya S.",    amount:+80750, status:"completed", date:"2026-12-10" },
  { id:"TXN-002", type:"booking",    desc:"New Year Party – Kamal P.",        amount:+42750, status:"completed", date:"2026-12-08" },
  { id:"TXN-003", type:"withdrawal", desc:"Bank Transfer – Sampath Bank",     amount:-80000, status:"completed", date:"2026-12-05" },
  { id:"TXN-004", type:"booking",    desc:"Corporate Gala – Nadia F.",        amount:+114000,status:"pending",   date:"2026-12-03" },
  { id:"TXN-005", type:"refund",     desc:"Refund – Dulanka W. (cancelled)",  amount:-33250, status:"completed", date:"2026-11-28" },
  { id:"TXN-006", type:"booking",    desc:"Sports Event – Ravi T.",           amount:+26600, status:"completed", date:"2026-11-25" },
  { id:"TXN-007", type:"withdrawal", desc:"Bank Transfer – Sampath Bank",     amount:-60000, status:"completed", date:"2026-11-20" },
  { id:"TXN-008", type:"commission", desc:"Platform fee – Nov earnings",       amount:-14200, status:"completed", date:"2026-11-15" },
];

const TYPE_CONFIG = {
  booking:    { icon:"💳", color:B.success  },
  withdrawal: { icon:"🏦", color:B.primary  },
  refund:     { icon:"↩️", color:B.danger   },
  commission: { icon:"📊", color:B.warning  },
};

export default function VendorPayments({ showToast }) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails] = useState({ bank:"Sampath Bank", account:"1234567890", name:"My Venue Ltd" });

  const available = 155100;
  const pending   = 114000;
  const total     = 489600;

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 5000) { showToast("Minimum withdrawal is LKR 5,000", "error"); return; }
    if (amt > available)   { showToast("Insufficient available balance", "error"); return; }
    showToast(`Withdrawal of LKR ${amt.toLocaleString()} requested! Arrives in 1-2 days.`);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Payment Center" sub="Earnings, withdrawals & transaction history" />

      {/* Balance cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
        <div style={{ background:B.dark, borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"rgba(212,175,106,0.08)" }} />
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Available to Withdraw</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:B.accent }}>{formatMoney(available)}</div>
          <button onClick={() => setShowWithdrawModal(true)} style={{ marginTop:12, padding:"8px 18px", borderRadius:9, background:B.accent, color:B.dark, fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>Request Withdrawal</button>
        </div>
        {[
          ["Pending (Escrow)", formatMoney(pending),  B.warning, "⏳"],
          ["Total Earned",     formatMoney(total),    B.success,  "📈"],
          ["This Month",       formatMoney(237500),   B.info,     "📅"],
        ].map(([label, val, color, icon]) => (
          <div key={label} style={{ ...cardStyle }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ fontSize:11, color:B.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>{label}</div>
              <span style={{ fontSize:18 }}>{icon}</span>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Commission info */}
      <div style={{ background:"rgba(212,175,106,0.06)", borderRadius:14, padding:"14px 18px", border:`1px solid rgba(212,175,106,0.2)`, display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ fontSize:24 }}>ℹ️</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:2 }}>Commission & Payout Rules</div>
          <div style={{ fontSize:12, color:B.textMuted, lineHeight:1.6 }}>Evara deducts 5% platform commission per booking. Payments are held in escrow until event completion. Minimum withdrawal: LKR 5,000. Funds arrive 1–2 business days.</div>
        </div>
      </div>

      {/* Bank account */}
      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Bank Account</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{bankDetails.bank}</div>
            <div style={{ fontSize:12, color:B.textMuted }}>•••• •••• {bankDetails.account.slice(-4)} · {bankDetails.name}</div>
          </div>
          <button onClick={() => showToast("Bank details update — coming soon!", "info")} style={{ fontSize:12, fontWeight:700, color:B.accent, background:"none", border:"none", cursor:"pointer" }}>Change →</button>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ ...cardStyle }}>
        <SectionHeader title="Transaction History" sub="All time" />
        <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
          {TRANSACTIONS.map(t => {
            const cfg = TYPE_CONFIG[t.type] || { icon:"💰", color:B.textMuted };
            const isNeg = t.amount < 0;
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${B.border}` }}>
                <div style={{ width:36, height:36, borderRadius:10, background:isNeg?"rgba(217,64,64,0.08)":"rgba(26,155,108,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{cfg.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{t.desc}</div>
                  <div style={{ fontSize:11, color:B.textMuted }}>{t.id} · {formatDate(t.date)}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:isNeg?B.danger:B.success }}>
                    {isNeg?"-":"+"}LKR {Math.abs(t.amount).toLocaleString()}
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Withdrawal modal */}
      {showWithdrawModal && (
        <>
          <div onClick={() => setShowWithdrawModal(false)} style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(12,22,40,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:800, width:"min(380px,92vw)", background:B.surface, borderRadius:18, border:`1px solid ${B.border}`, padding:24, boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:B.text, marginBottom:4 }}>Request Withdrawal</div>
            <div style={{ fontSize:12, color:B.textMuted, marginBottom:16 }}>Available: <strong style={{ color:B.success }}>{formatMoney(available)}</strong></div>
            <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Amount (LKR)</div>
            <input type="number" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} placeholder="e.g. 50000" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:16, color:B.text, outline:"none", marginBottom:16, boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {[20000,50000,80000,available].map(amt => (
                <button key={amt} onClick={() => setWithdrawAmount(String(amt))} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:B.bg, color:B.textMuted, border:`1px solid ${B.border}`, cursor:"pointer" }}>
                  {amt===available?"Max":formatMoney(amt)}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowWithdrawModal(false)} style={{ flex:1, padding:"11px", borderRadius:10, background:B.bg, border:`1.5px solid ${B.border}`, color:B.text, fontWeight:700, fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleWithdraw} style={{ flex:2, padding:"11px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>Withdraw</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
