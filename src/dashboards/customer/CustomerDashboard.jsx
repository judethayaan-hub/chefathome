/**
 * dashboards/customer/CustomerDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer-facing portal. Simpler than vendor/admin — no dynamic module
 * registry needed; all tabs are known and fixed for customers.
 */

import { useState, useCallback } from "react";
import {
  B, StatusBadge, SectionHeader, EmptyState, StatCard,
  Icon, Toast, formatDate, formatMoney, shortId, cardStyle, inputStyle, labelStyle,
} from "../shared/tokens.js";

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MY_BOOKINGS = [
  { id:"b1a2-c3d4", vendor:"The Grand Monarch Hall",   category:"wedding",  date:"2026-12-24", amount:85000,  status:"confirmed",   guests:200, package:"Grand Wedding" },
  { id:"b5e6-f7g8", vendor:"DJ Sonix Events",           category:"djs",      date:"2026-12-31", amount:45000,  status:"confirmed",   guests:80,  package:"Pro Night"     },
  { id:"b9i0-j1k2", vendor:"Royal Feast Catering",      category:"catering", date:"2027-01-05", amount:120000, status:"pending",     guests:350, package:"Buffet Royal"  },
  { id:"b3m4-n5o6", vendor:"Velocity Badminton Arena",  category:"sports",   date:"2026-12-20", amount:28000,  status:"completed",   guests:60,  package:"Hourly (3hrs)" },
  { id:"b7q8-r9s0", vendor:"Skyline Party Lounge",      category:"party",    date:"2026-11-18", amount:65000,  status:"cancelled",   guests:150, package:"Weekend Pkg"   },
];

const SAVED_VENDORS = [
  { id:"v1", name:"The Grand Monarch Hall",   category:"wedding",  location:"Negombo",    base_price:350000, rating:"4.8" },
  { id:"v4", name:"DJ Sonix Events",          category:"djs",      location:"Colombo 06", base_price:35000,  rating:"5.0" },
  { id:"v7", name:"Lens & Light Photography", category:"photographers",location:"Colombo", base_price:45000, rating:"4.7" },
];

const CAT_EMOJI = { wedding:"💒", djs:"🎧", catering:"🍽️", sports:"🏸", party:"🎉", photographers:"📷" };
const CAT_LABEL = { wedding:"Wedding Hall", djs:"DJ & Music", catering:"Catering", sports:"Sports Ground", party:"Party Hall", photographers:"Photography" };

// ─── Sidebar tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id:"bookings",   label:"My Bookings",    icon:"📅" },
  { id:"favorites",  label:"Saved Vendors",  icon:"❤️" },
  { id:"messages",   label:"Messages",       icon:"💬" },
  { id:"payments",   label:"Payment History",icon:"💳" },
  { id:"reviews",    label:"My Reviews",     icon:"⭐" },
  { id:"profile",    label:"My Profile",     icon:"👤" },
  { id:"settings",   label:"Settings",       icon:"⚙️" },
];

// ─── Sub-views ─────────────────────────────────────────────────────────────────
function MyBookings({ showToast }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MY_BOOKINGS : MY_BOOKINGS.filter(b => b.status === filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="My Bookings" sub={`${MY_BOOKINGS.length} total bookings`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <StatCard label="Total Spent"     value={formatMoney(MY_BOOKINGS.filter(b=>["confirmed","completed"].includes(b.status)).reduce((s,b)=>s+b.amount,0))} accent={B.accent} icon="💰" />
        <StatCard label="Upcoming Events" value={MY_BOOKINGS.filter(b=>b.status==="confirmed").length} accent={B.success} icon="📅" />
        <StatCard label="Pending"         value={MY_BOOKINGS.filter(b=>b.status==="pending").length}   accent={B.warning} icon="⏳" />
        <StatCard label="Completed"       value={MY_BOOKINGS.filter(b=>b.status==="completed").length} accent={B.primary} icon="✅" />
      </div>
      <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
        {["all","pending","confirmed","completed","cancelled"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, background:filter===s?B.primary:B.surface, color:filter===s?"#fff":B.textMuted, border:`1.5px solid ${filter===s?B.primary:B.border}` }}>
            {s==="all"?"All Bookings":s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.length === 0 ? <EmptyState emoji="📋" title="No bookings" desc="Your bookings will appear here." /> : filtered.map(b => (
          <div key={b.id} style={{ ...cardStyle, display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{CAT_EMOJI[b.category]||"🎪"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:3 }}>{b.vendor}</div>
              <div style={{ display:"flex", gap:12, fontSize:12, color:B.textMuted, flexWrap:"wrap" }}>
                <span>📅 {formatDate(b.date)}</span>
                <span>👥 {b.guests} guests</span>
                <span>📦 {b.package}</span>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:B.text, marginBottom:5 }}>{formatMoney(b.amount)}</div>
              <StatusBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Favorites({ showToast }) {
  const [saved, setSaved] = useState(SAVED_VENDORS);
  const remove = (id) => { setSaved(prev => prev.filter(v=>v.id!==id)); showToast("Removed from favourites.", "info"); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Saved Vendors" sub={`${saved.length} saved`} />
      {saved.length === 0 ? <EmptyState emoji="❤️" title="No saved vendors" desc="Tap the heart on any listing to save it here." /> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
          {saved.map(v => (
            <div key={v.id} style={{ ...cardStyle, position:"relative" }}>
              <button onClick={() => remove(v.id)} style={{ position:"absolute", top:12, right:12, width:28, height:28, borderRadius:8, background:"rgba(217,64,64,0.1)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:B.danger, fontSize:14 }}>♥</button>
              <div style={{ width:48, height:48, borderRadius:14, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:10 }}>{CAT_EMOJI[v.category]}</div>
              <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:2 }}>{v.name}</div>
              <div style={{ fontSize:12, color:B.textMuted, marginBottom:8 }}>{CAT_LABEL[v.category]} · {v.location}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:B.accent }}>LKR {v.base_price.toLocaleString()}</div>
                <div style={{ fontSize:12, color:B.textMuted }}>{v.rating} ★</div>
              </div>
              <button onClick={() => showToast("Opening listing...", "info")} style={{ width:"100%", marginTop:12, padding:"9px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>View Listing →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentHistory() {
  const pmts = MY_BOOKINGS.map(b => ({ ...b, method:"Card ending 4242", date:b.date }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Payment History" sub="All your transactions" />
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pmts.map(p => (
          <div key={p.id} style={{ ...cardStyle, display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:40, height:40, borderRadius:11, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{CAT_EMOJI[p.category]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{p.vendor}</div>
              <div style={{ fontSize:11, color:B.textMuted }}>{p.method} · {formatDate(p.date)}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:p.status==="cancelled"?B.textLight:B.text }}>{p.status==="cancelled"?"Refunded":formatMoney(p.amount)}</div>
              <StatusBadge status={p.status==="cancelled"?"refunded":p.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyReviews({ showToast }) {
  const [reviews, setReviews] = useState([
    { id:1, vendor:"Velocity Badminton Arena", rating:5, text:"Courts were in excellent condition!", date:"2026-12-20", booking:"b3m4" },
  ]);
  const [writing, setWriting] = useState(null);
  const [draft, setDraft] = useState({ rating:5, text:"" });

  const pendingReview = MY_BOOKINGS.filter(b => b.status==="completed" && !reviews.find(r=>r.booking===shortId(b.id).toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="My Reviews" sub={`${reviews.length} reviews written`} />
      {pendingReview.length > 0 && (
        <div style={{ ...cardStyle, background:"rgba(212,175,106,0.06)", border:"1px solid rgba(212,175,106,0.25)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:10 }}>✍️ Pending Reviews</div>
          {pendingReview.map(b => (
            <div key={b.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${B.border}` }}>
              <div style={{ fontSize:13, color:B.text }}>{b.vendor}</div>
              <button onClick={() => setWriting(b)} style={{ padding:"6px 14px", borderRadius:8, background:B.dark, color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>Write Review</button>
            </div>
          ))}
        </div>
      )}
      {reviews.map(r => (
        <div key={r.id} style={{ ...cardStyle }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6 }}>
            <div style={{ fontWeight:700, fontSize:13, color:B.text }}>{r.vendor}</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i<=r.rating?"#D4AF6A":"#E4E1D9"} stroke={i<=r.rating?"#D4AF6A":"#E4E1D9"} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>
          </div>
          <div style={{ fontSize:13, color:B.textMuted, fontStyle:"italic" }}>"{r.text}"</div>
          <div style={{ fontSize:10, color:B.textLight, marginTop:6 }}>Posted {formatDate(r.date)}</div>
        </div>
      ))}
      {writing && (
        <>
          <div onClick={() => setWriting(null)} style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(12,22,40,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:800, width:"min(400px,92vw)", background:B.surface, borderRadius:18, padding:24, boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Review: {writing.vendor}</div>
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {[1,2,3,4,5].map(i=>(
                <button key={i} onClick={() => setDraft(d=>({...d,rating:i}))} style={{ fontSize:24, background:"none", border:"none", cursor:"pointer" }}>{i<=draft.rating?"⭐":"☆"}</button>
              ))}
            </div>
            <textarea value={draft.text} onChange={e=>setDraft(d=>({...d,text:e.target.value}))} placeholder="Share your experience..." rows={4} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", marginBottom:14 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setWriting(null)} style={{ flex:1, padding:"11px", borderRadius:10, background:B.bg, border:`1.5px solid ${B.border}`, color:B.text, fontWeight:700, fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => { if (draft.text.trim()) { setReviews(prev=>[...prev, {id:Date.now(),vendor:writing.vendor,rating:draft.rating,text:draft.text,date:new Date().toISOString(),booking:writing.id}]); setWriting(null); setDraft({rating:5,text:""}); showToast("Review posted!"); } }} style={{ flex:2, padding:"11px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>Post Review ⭐</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomerProfile({ user, showToast }) {
  const [form, setForm] = useState({ name:user?.user_metadata?.full_name||"", email:user?.email||"", phone:"", city:"Colombo" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
      <SectionHeader title="My Profile" sub="Manage your personal details" />
      <div style={{ ...cardStyle }}>
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff" }}>
            {form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:B.text }}>{form.name || "Your Name"}</div>
            <div style={{ fontSize:12, color:B.textMuted }}>{form.email}</div>
          </div>
        </div>
        {[
          {key:"name",  label:"Full Name *",    type:"text", placeholder:"Your full name"},
          {key:"phone", label:"Phone Number",   type:"tel",  placeholder:"+94 77 000 0000"},
          {key:"city",  label:"City",           type:"text", placeholder:"e.g. Colombo"},
        ].map(f=>(
          <div key={f.key} style={{ marginBottom:14 }}>
            <label style={labelStyle}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} style={inputStyle} />
          </div>
        ))}
        <button onClick={() => showToast("Profile updated!")} style={{ width:"100%", padding:"12px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>Save Profile</button>
      </div>
    </div>
  );
}

function CustomerSettings({ showToast }) {
  const [notifs, setNotifs] = useState({ booking_confirm:true, booking_cancel:true, promotions:false, messages:true });
  const Toggle = ({k}) => (
    <div onClick={()=>setNotifs(n=>({...n,[k]:!n[k]}))} style={{ width:40, height:22, borderRadius:11, background:notifs[k]?B.success:"#E4E1D9", position:"relative", cursor:"pointer" }}>
      <div style={{ position:"absolute", top:3, left:notifs[k]?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:480 }}>
      <SectionHeader title="Settings" sub="Notification and account preferences" />
      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Notifications</div>
        {[["booking_confirm","Booking Confirmations","When your booking is approved"],["booking_cancel","Cancellation Alerts","When a booking is cancelled"],["messages","Messages","New messages from vendors"],["promotions","Promotions & Offers","Deals and special offers"]].map(([k,label,desc])=>(
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${B.border}` }}>
            <div><div style={{ fontSize:13, fontWeight:600, color:B.text }}>{label}</div><div style={{ fontSize:11, color:B.textMuted }}>{desc}</div></div>
            <Toggle k={k} />
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle, border:"1px solid rgba(217,64,64,0.2)" }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.danger, marginBottom:10 }}>Account</div>
        <button onClick={() => showToast("Deletion request submitted.", "info")} style={{ padding:"9px 18px", borderRadius:9, background:"rgba(217,64,64,0.08)", color:B.danger, fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>Delete My Account</button>
      </div>
    </div>
  );
}

function ComingSoonTab({ label }) {
  return <EmptyState emoji="🚧" title={`${label} Coming Soon`} desc="This feature is being built." />;
}

const TAB_VIEWS = {
  bookings:  MyBookings,
  favorites: Favorites,
  payments:  PaymentHistory,
  reviews:   MyReviews,
  profile:   CustomerProfile,
  settings:  CustomerSettings,
  messages:  () => <ComingSoonTab label="Messages" />,
};

// ─── Customer Dashboard Shell ──────────────────────────────────────────────────
export default function CustomerDashboard({ user, token, sb, onSignOut, onBackToMarketplace }) {
  const [active, setActive]         = useState("bookings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const ActiveView = TAB_VIEWS[active] || (() => <ComingSoonTab label={active} />);
  const activeMeta = TABS.find(t => t.id === active);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";
  const init = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:B.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:B.dark }}>{init}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Customer Account</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto", scrollbarWidth:"none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActive(t.id); setSidebarOpen(false); }} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:2, textAlign:"left", fontFamily:"'DM Sans',sans-serif", background:active===t.id?"rgba(212,175,106,0.12)":"none", color:active===t.id?B.accent:"rgba(255,255,255,0.5)", fontWeight:active===t.id?700:500, fontSize:13 }}>
            <span style={{ fontSize:15, width:22, textAlign:"center" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        {onBackToMarketplace && <button onClick={onBackToMarketplace} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:10, border:"none", cursor:"pointer", background:"none", color:"rgba(255,255,255,0.35)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}><Icon.ChevLeft /> Explore Marketplace</button>}
        <button onClick={onSignOut} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:10, border:"none", cursor:"pointer", background:"none", color:"rgba(217,64,64,0.7)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}><Icon.LogOut /> Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:B.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:220, flexShrink:0, background:B.dark, position:"fixed", top:0, left:0, bottom:0, zIndex:300, display:"flex", flexDirection:"column" }} className="cust-sidebar">
        <SidebarContent />
      </div>
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(12,22,40,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", top:0, left:0, bottom:0, width:240, background:B.dark, zIndex:500, display:"flex", flexDirection:"column" }}><SidebarContent /></div>
        </>
      )}
      <div style={{ flex:1, marginLeft:220, display:"flex", flexDirection:"column" }} className="cust-main">
        <div style={{ background:B.surface, borderBottom:`1px solid ${B.border}`, padding:"0 20px", position:"sticky", top:0, zIndex:200, display:"flex", alignItems:"center", height:56, gap:12 }}>
          <button onClick={() => setSidebarOpen(o=>!o)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textMuted, display:"none" }} className="cust-menu-btn"><Icon.Menu /></button>
          <div style={{ flex:1, fontSize:15, fontWeight:700, color:B.text }}>{activeMeta?.icon} {activeMeta?.label}</div>
          <div style={{ width:34, height:34, borderRadius:10, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{init}</div>
        </div>
        <div style={{ flex:1, padding:"24px 24px 40px", maxWidth:960, width:"100%", margin:"0 auto" }}>
          <ActiveView user={user} showToast={showToast} />
        </div>
      </div>
      <Toast toast={toast} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .cust-sidebar { display:flex !important; } .cust-main { margin-left:220px !important; }
        @media (max-width:768px) { .cust-sidebar { display:none !important; } .cust-main { margin-left:0 !important; } .cust-menu-btn { display:flex !important; } }
      `}</style>
    </div>
  );
}
