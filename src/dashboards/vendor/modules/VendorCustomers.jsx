import { useState } from "react";
import { B, SectionHeader, EmptyState, StatusBadge, cardStyle, Icon, formatDate, formatMoney } from "../../shared/tokens.jsx";

const CUSTOMERS = [
  { id:1, name:"Priya Subramaniam",  email:"priya@example.com",  phone:"+94 77 123 4567", totalSpend:305000, bookings:4, lastBooking:"2026-12-24", preferred:"Wedding Hall",  status:"vip",    notes:"Prefers weekend events, vegetarian menu" },
  { id:2, name:"Kamal Perera",       email:"kamal@example.com",  phone:"+94 71 234 5678", totalSpend:180000, bookings:3, lastBooking:"2026-12-31", preferred:"DJ Package",    status:"regular",notes:"NYE regular, always books Dec" },
  { id:3, name:"Nadia Fernando",     email:"nadia@example.com",  phone:"+94 76 345 6789", totalSpend:540000, bookings:6, lastBooking:"2027-01-05", preferred:"Full Package",  status:"vip",    notes:"Corporate events, needs invoice" },
  { id:4, name:"Ravi Tissera",       email:"ravi@example.com",   phone:"+94 72 456 7890", totalSpend:56000,  bookings:2, lastBooking:"2026-12-20", preferred:"Sports Slots",  status:"regular",notes:"" },
  { id:5, name:"Amara Liyanage",     email:"amara@example.com",  phone:"+94 70 567 8901", totalSpend:65000,  bookings:1, lastBooking:"2026-12-18", preferred:"Party Hall",    status:"new",    notes:"Cancelled last time, follow up" },
  { id:6, name:"Senith Jayasinghe",  email:"senith@example.com", phone:"+94 77 678 9012", totalSpend:97000,  bookings:2, lastBooking:"2026-12-28", preferred:"DJ Pro Night",  status:"regular",notes:"" },
];

const STATUS_BADGE = {
  vip:     { bg:"rgba(212,175,106,0.15)", color:"#9C7339", label:"VIP" },
  regular: { bg:"rgba(28,43,75,0.08)",    color:B.primary, label:"Regular" },
  new:     { bg:"rgba(26,155,108,0.1)",   color:"#1A9B6C", label:"New" },
};

export default function VendorCustomers({ showToast }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const CustomerDetail = ({ c }) => (
    <>
      <div onClick={() => setSelected(null)} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(12,22,40,0.5)", backdropFilter:"blur(3px)" }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(400px,100vw)", background:B.surface, zIndex:700, display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,0.18)", animation:"slideInRight .2s ease" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setSelected(null)} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:B.textMuted }}><Icon.X /></button>
          <div style={{ fontWeight:700, fontSize:15, color:B.text }}>Customer Profile</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          {/* Avatar + name */}
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#fff", fontWeight:700 }}>
              {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:B.text }}>{c.name}</div>
              <div style={{ fontSize:12, color:B.textMuted, marginTop:2 }}>{c.email}</div>
              <div style={{ fontSize:12, color:B.textMuted }}>{c.phone}</div>
            </div>
            <div style={{ marginLeft:"auto" }}>
              <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:STATUS_BADGE[c.status].bg, color:STATUS_BADGE[c.status].color }}>{STATUS_BADGE[c.status].label}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
            {[
              ["Total Spend", formatMoney(c.totalSpend), B.accent],
              ["Bookings",    c.bookings,                B.primary],
              ["Last Visit",  formatDate(c.lastBooking), B.textMuted],
            ].map(([label, val, color]) => (
              <div key={label} style={{ ...cardStyle, textAlign:"center", padding:12 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color }}>{val}</div>
                <div style={{ fontSize:10, color:B.textMuted, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Preferred service */}
          <div style={{ ...cardStyle, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Preferred Service</div>
            <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{c.preferred}</div>
          </div>

          {/* CRM notes */}
          <div style={{ ...cardStyle, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>CRM Notes</div>
            {c.notes && <div style={{ fontSize:12, color:B.textMuted, marginBottom:10, lineHeight:1.5, background:B.bg, borderRadius:8, padding:"8px 10px" }}>{c.notes}</div>}
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note about this customer..." rows={3} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
            <button onClick={() => { showToast("Note saved!"); setNote(""); }} disabled={!note.trim()} style={{ marginTop:8, width:"100%", padding:"9px", borderRadius:9, background:B.primary, color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:note.trim()?"pointer":"not-allowed", opacity:note.trim()?1:0.5 }}>Save Note</button>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button onClick={() => showToast("Message sent!")} style={{ padding:"10px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>💬 Send Message</button>
            <button onClick={() => showToast("Follow-up scheduled!", "info")} style={{ padding:"10px", borderRadius:10, background:B.bg, color:B.text, fontWeight:700, fontSize:13, border:`1.5px solid ${B.border}`, cursor:"pointer" }}>📅 Schedule Follow-Up</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Customer CRM" sub={`${CUSTOMERS.length} customers`} />

      {/* Summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        {[
          ["Total Customers", CUSTOMERS.length,   B.primary, "👥"],
          ["VIP Customers",   CUSTOMERS.filter(c=>c.status==="vip").length,     B.accent, "⭐"],
          ["New This Month",  CUSTOMERS.filter(c=>c.status==="new").length,     B.success, "🆕"],
          ["Total Revenue",   formatMoney(CUSTOMERS.reduce((s,c)=>s+c.totalSpend,0)), B.text, "💰"],
        ].map(([label, val, color, icon]) => (
          <div key={label} style={{ ...cardStyle }}>
            <div style={{ fontSize:11, color:B.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:10, background:B.surface, border:`1.5px solid ${B.border}`, borderRadius:10, padding:"9px 13px" }}>
        <Icon.Search />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." style={{ flex:1, border:"none", background:"none", fontSize:13, color:B.text, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
      </div>

      {/* Customer list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} style={{ ...cardStyle, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:B.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff", fontWeight:700, flexShrink:0 }}>
              {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{c.name}</div>
              <div style={{ fontSize:11, color:B.textMuted, marginTop:2 }}>{c.preferred} · {c.bookings} bookings</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:4 }}>{formatMoney(c.totalSpend)}</div>
              <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:STATUS_BADGE[c.status].bg, color:STATUS_BADGE[c.status].color }}>{STATUS_BADGE[c.status].label}</span>
            </div>
            <Icon.ChevRight />
          </div>
        ))}
      </div>
      {selected && <CustomerDetail c={selected} />}
      <style>{`@keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>
    </div>
  );
}
