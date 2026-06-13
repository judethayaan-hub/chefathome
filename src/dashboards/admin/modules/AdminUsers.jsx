/**
 * Admin module collection
 * Each exported component is a full admin panel module.
 */

import { useState, useMemo } from "react";
import {
  B, StatusBadge, SectionHeader, EmptyState, ConfirmDialog,
  StatCard, MiniBarChart, Icon, formatDate, formatMoney, shortId, cardStyle, inputStyle, labelStyle,
} from "../../shared/tokens.jsx";

// ─── Shared search bar ─────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, background:B.surface, border:`1.5px solid ${B.border}`, borderRadius:10, padding:"9px 13px" }}>
      <Icon.Search />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex:1, border:"none", background:"none", fontSize:13, color:B.text, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
      {value && <button onClick={() => onChange("")} style={{ background:"none", border:"none", cursor:"pointer", color:B.textMuted }}><Icon.X /></button>}
    </div>
  );
}

// ─── Shared data table ─────────────────────────────────────────────────────────
function DataTable({ cols, rows, onRowClick }) {
  return (
    <div style={{ ...cardStyle, padding:0, overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:B.bg }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.7, whiteSpace:"nowrap", borderBottom:`1px solid ${B.border}` }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(row)} style={{ borderBottom:`1px solid ${B.border}`, cursor:onRowClick?"pointer":"default", transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background=B.bg}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              {cols.map(c => (
                <td key={c.key} style={{ padding:"11px 14px", color:B.text, whiteSpace:"nowrap" }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 24px", color:B.textMuted, fontSize:13 }}>No records found</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminUsers
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  { id:"u1", name:"Priya Subramaniam",  email:"priya@example.com",  role:"customer",      status:"active",    joined:"2026-08-12", bookings:4,  spend:305000 },
  { id:"u2", name:"Kamal Perera",       email:"kamal@example.com",  role:"customer",      status:"active",    joined:"2026-09-05", bookings:3,  spend:180000 },
  { id:"u3", name:"Nadia Fernando",     email:"nadia@example.com",  role:"event_planner", status:"active",    joined:"2026-07-20", bookings:6,  spend:540000 },
  { id:"u4", name:"Ravi Tissera",       email:"ravi@example.com",   role:"customer",      status:"suspended", joined:"2026-10-01", bookings:2,  spend:56000  },
  { id:"u5", name:"Amara Liyanage",     email:"amara@example.com",  role:"customer",      status:"active",    joined:"2026-11-14", bookings:1,  spend:65000  },
  { id:"u6", name:"Judeth Antony",      email:"judeth@example.com", role:"super_admin",   status:"active",    joined:"2026-01-01", bookings:0,  spend:0      },
  { id:"u7", name:"Sampath Silva",      email:"sampath@example.com",role:"support",       status:"active",    joined:"2026-03-10", bookings:0,  spend:0      },
];
const ROLE_LABEL = { customer:"Customer", event_planner:"Event Planner", super_admin:"Super Admin", admin:"Admin", support:"Support", sports_owner:"Sports Owner", wedding_owner:"Wedding Owner" };

export function AdminUsers({ showToast }) {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() =>
    users.filter(u =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    ), [users, search, roleFilter]);

  const suspendUser = (id) => {
    setUsers(prev => prev.map(u => u.id===id ? {...u, status: u.status==="suspended"?"active":"suspended"} : u));
    setConfirm(null);
    showToast("User status updated.");
  };

  const cols = [
    { key:"name",     label:"Name",     render:(v,r) => <div><div style={{ fontWeight:700 }}>{v}</div><div style={{ fontSize:11, color:B.textMuted }}>{r.email}</div></div> },
    { key:"role",     label:"Role",     render:v => <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:v==="super_admin"?"rgba(212,175,106,0.15)":B.bg, color:v==="super_admin"?B.accent:B.textMuted }}>{ROLE_LABEL[v]||v}</span> },
    { key:"status",   label:"Status",   render:v => <StatusBadge status={v} /> },
    { key:"bookings", label:"Bookings", render:v => v },
    { key:"spend",    label:"Lifetime Spend", render:v => formatMoney(v) },
    { key:"joined",   label:"Joined",   render:v => formatDate(v) },
    { key:"id",       label:"Actions",  render:(v,r) => (
      <button onClick={e => { e.stopPropagation(); setConfirm({ id:v, name:r.name, suspended:r.status==="suspended" }); }}
        style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, background:r.status==="suspended"?"rgba(26,155,108,0.1)":"rgba(217,64,64,0.1)", color:r.status==="suspended"?B.success:B.danger, border:"none", cursor:"pointer" }}>
        {r.status==="suspended"?"Restore":"Suspend"}
      </button>
    )},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="User Management" sub={`${users.length} registered users`} />
        <button onClick={() => showToast("Invite user — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}><Icon.Plus /> Invite User</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <StatCard label="Total Users"     value={users.length}                             icon="👥" accent={B.primary} />
        <StatCard label="Active"          value={users.filter(u=>u.status==="active").length} icon="✅" accent={B.success} />
        <StatCard label="Suspended"       value={users.filter(u=>u.status==="suspended").length} icon="⛔" accent={B.danger} />
        <StatCard label="Staff"           value={users.filter(u=>["admin","support","super_admin"].includes(u.role)).length} icon="🛡️" accent={B.accent} />
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:240 }}><SearchBar value={search} onChange={setSearch} placeholder="Search users..." /></div>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ ...inputStyle, width:"auto", minWidth:150 }}>
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <DataTable cols={cols} rows={filtered} />
      {confirm && <ConfirmDialog title={`${confirm.suspended?"Restore":"Suspend"} ${confirm.name}?`} desc={confirm.suspended?"User will regain full access.":"User will lose access to the platform."} danger={!confirm.suspended} onConfirm={() => suspendUser(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminVendors
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_VENDORS = [
  { id:"v1", name:"Velocity Badminton Arena",  category:"sports",   owner:"Ravi T.",    status:"approved",  rating:4.9, revenue:980000,  bookings:112, joined:"2026-03-15", verified:true  },
  { id:"v2", name:"The Grand Monarch Hall",     category:"wedding",  owner:"Priya S.",   status:"approved",  rating:4.8, revenue:1820000, bookings:48,  joined:"2026-01-10", verified:true  },
  { id:"v3", name:"Royal Feast Catering",       category:"catering", owner:"Nadia F.",   status:"pending",   rating:0,   revenue:0,       bookings:0,   joined:"2026-12-08", verified:false },
  { id:"v4", name:"DJ Sonix Events",            category:"djs",      owner:"Senith J.",  status:"approved",  rating:5.0, revenue:760000,  bookings:54,  joined:"2026-04-20", verified:true  },
  { id:"v5", name:"Skyline Party Lounge",       category:"party",    owner:"Amara L.",   status:"suspended", rating:4.6, revenue:400000,  bookings:28,  joined:"2026-05-01", verified:true  },
  { id:"v6", name:"Chef Malith Private Dining", category:"chefs",    owner:"Malith R.",  status:"pending",   rating:0,   revenue:0,       bookings:0,   joined:"2026-12-10", verified:false },
  { id:"v7", name:"Lens & Light Photography",   category:"photographers",owner:"Dulanka W.",status:"approved",rating:4.7,revenue:520000, bookings:38,  joined:"2026-02-28", verified:true  },
];
const CAT_EMOJI_MAP = { sports:"🏸", wedding:"💒", catering:"🍽️", djs:"🎧", party:"🎉", chefs:"👨‍🍳", photographers:"📷", vendors:"🎪" };

export function AdminVendors({ showToast }) {
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() =>
    vendors.filter(v =>
      (statusFilter === "all" || v.status === statusFilter) &&
      (v.name.toLowerCase().includes(search.toLowerCase()) || v.owner.toLowerCase().includes(search.toLowerCase()))
    ), [vendors, search, statusFilter]);

  const updateStatus = (id, newStatus) => {
    setVendors(prev => prev.map(v => v.id===id ? {...v, status:newStatus} : v));
    setConfirm(null);
    showToast(`Vendor ${newStatus}!`);
  };
  const toggleVerify = (id) => {
    setVendors(prev => prev.map(v => v.id===id ? {...v, verified:!v.verified} : v));
    showToast("Verification status updated.");
  };

  const cols = [
    { key:"name",     label:"Vendor",   render:(v,r) => (
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>{CAT_EMOJI_MAP[r.category]||"🎪"}</span>
        <div><div style={{ fontWeight:700 }}>{v}</div><div style={{ fontSize:11, color:B.textMuted }}>{r.owner}</div></div>
      </div>
    )},
    { key:"status",   label:"Status",   render:v => <StatusBadge status={v} /> },
    { key:"verified", label:"Verified", render:(v,r) => (
      <button onClick={e => { e.stopPropagation(); toggleVerify(r.id); }} style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:v?"rgba(26,155,108,0.1)":"rgba(217,64,64,0.1)", color:v?B.success:B.danger, border:"none", cursor:"pointer" }}>
        {v?"✓ Verified":"✗ Unverified"}
      </button>
    )},
    { key:"rating",   label:"Rating",   render:v => v ? `${v} ★` : "—" },
    { key:"revenue",  label:"Revenue",  render:v => formatMoney(v) },
    { key:"bookings", label:"Bookings", render:v => v },
    { key:"joined",   label:"Joined",   render:v => formatDate(v) },
    { key:"id",       label:"Actions",  render:(v,r) => (
      <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
        {r.status==="pending"  && <button onClick={() => updateStatus(v,"approved")} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(26,155,108,0.1)", color:B.success, border:"none", cursor:"pointer" }}>Approve</button>}
        {r.status==="pending"  && <button onClick={() => setConfirm({id:v,name:r.name,action:"reject"})} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(217,64,64,0.1)", color:B.danger, border:"none", cursor:"pointer" }}>Reject</button>}
        {r.status==="approved" && <button onClick={() => setConfirm({id:v,name:r.name,action:"suspend"})} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(217,119,6,0.1)", color:B.warning, border:"none", cursor:"pointer" }}>Suspend</button>}
        {r.status==="suspended"&& <button onClick={() => updateStatus(v,"approved")} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(26,155,108,0.1)", color:B.success, border:"none", cursor:"pointer" }}>Restore</button>}
      </div>
    )},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Vendor Management" sub={`${vendors.length} vendors on platform`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
        {[["Pending",vendors.filter(v=>v.status==="pending").length,B.warning],["Approved",vendors.filter(v=>v.status==="approved").length,B.success],["Suspended",vendors.filter(v=>v.status==="suspended").length,B.danger],["Verified",vendors.filter(v=>v.verified).length,B.accent]].map(([label,val,color]) => (
          <StatCard key={label} label={label} value={val} accent={color} />
        ))}
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:240 }}><SearchBar value={search} onChange={setSearch} placeholder="Search vendors..." /></div>
        <div style={{ display:"flex", gap:6 }}>
          {["all","pending","approved","suspended"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", background:statusFilter===s?B.primary:B.surface, color:statusFilter===s?"#fff":B.textMuted, border:`1.5px solid ${statusFilter===s?B.primary:B.border}` }}>
              {s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <DataTable cols={cols} rows={filtered} />
      {confirm && <ConfirmDialog title={`${confirm.action==="reject"?"Reject":"Suspend"} ${confirm.name}?`} desc={confirm.action==="reject"?"Vendor will be notified their application was rejected.":"Vendor listing will be hidden from customers."} danger onConfirm={() => updateStatus(confirm.id, confirm.action==="reject"?"rejected":"suspended")} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminBookings
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_ALL_BOOKINGS = [
  { id:"b1a2-c3d4", customer:"Priya S.",  vendor:"Grand Monarch Hall",     category:"wedding",  date:"2026-12-24", amount:85000,  status:"confirmed",   commission:8500  },
  { id:"b5e6-f7g8", customer:"Kamal P.",  vendor:"DJ Sonix Events",        category:"djs",      date:"2026-12-31", amount:45000,  status:"confirmed",   commission:4500  },
  { id:"b9i0-j1k2", customer:"Nadia F.",  vendor:"Royal Feast Catering",   category:"catering", date:"2027-01-05", amount:120000, status:"pending",     commission:14400 },
  { id:"b3m4-n5o6", customer:"Ravi T.",   vendor:"Velocity Badminton",     category:"sports",   date:"2026-12-20", amount:28000,  status:"completed",   commission:2240  },
  { id:"b7q8-r9s0", customer:"Amara L.",  vendor:"Skyline Party Lounge",   category:"party",    date:"2026-12-18", amount:65000,  status:"cancelled",   commission:0     },
  { id:"b1u2-v3w4", customer:"Senith J.", vendor:"DJ Sonix Events",        category:"djs",      date:"2026-12-28", amount:52000,  status:"pending",     commission:5200  },
  { id:"b5y6-z7a8", customer:"Malsha R.", vendor:"Grand Monarch Hall",     category:"wedding",  date:"2027-01-12", amount:250000, status:"in_progress", commission:25000 },
];

export function AdminBookings({ showToast }) {
  const [bookings, setBookings] = useState(MOCK_ALL_BOOKINGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() =>
    bookings.filter(b =>
      (statusFilter==="all" || b.status===statusFilter) &&
      (b.customer.toLowerCase().includes(search.toLowerCase()) || b.vendor.toLowerCase().includes(search.toLowerCase()) || shortId(b.id).toLowerCase().includes(search.toLowerCase()))
    ), [bookings, search, statusFilter]);

  const cols = [
    { key:"id",       label:"ID",       render:v => <code style={{ fontSize:11, background:B.bg, padding:"2px 6px", borderRadius:5 }}>#{shortId(v)}</code> },
    { key:"customer", label:"Customer", render:v => <span style={{ fontWeight:600 }}>{v}</span> },
    { key:"vendor",   label:"Vendor",   render:v => v },
    { key:"date",     label:"Date",     render:v => formatDate(v) },
    { key:"amount",   label:"Amount",   render:v => formatMoney(v) },
    { key:"commission",label:"Comm.",  render:v => v>0?<span style={{ color:B.success, fontWeight:700 }}>{formatMoney(v)}</span>:"—" },
    { key:"status",   label:"Status",   render:v => <StatusBadge status={v} /> },
    { key:"id",       label:"Actions",  render:(v,r) => (
      <div style={{ display:"flex", gap:5 }} onClick={e=>e.stopPropagation()}>
        {r.status==="pending" && <button onClick={() => { setBookings(prev=>prev.map(b=>b.id===v?{...b,status:"confirmed"}:b)); showToast("Booking force-confirmed."); }} style={{ padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:700, background:"rgba(26,155,108,0.1)", color:B.success, border:"none", cursor:"pointer" }}>Force Confirm</button>}
        {["confirmed","in_progress"].includes(r.status) && <button onClick={() => { setBookings(prev=>prev.map(b=>b.id===v?{...b,status:"refunded"}:b)); showToast("Refund issued.", "info"); }} style={{ padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:700, background:"rgba(217,64,64,0.1)", color:B.danger, border:"none", cursor:"pointer" }}>Refund</button>}
      </div>
    )},
  ];

  const totalGMV = bookings.filter(b=>["confirmed","completed","in_progress"].includes(b.status)).reduce((s,b)=>s+b.amount,0);
  const totalComm = bookings.reduce((s,b)=>s+b.commission,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="All Bookings" sub="Platform-wide booking management" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <StatCard label="Total GMV"       value={formatMoney(totalGMV)}   accent={B.accent} />
        <StatCard label="Platform Revenue"value={formatMoney(totalComm)}  accent={B.success} />
        <StatCard label="Total Bookings"  value={bookings.length}          accent={B.primary} />
        <StatCard label="Pending"         value={bookings.filter(b=>b.status==="pending").length} accent={B.warning} />
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200 }}><SearchBar value={search} onChange={setSearch} placeholder="Search customer, vendor, ID..." /></div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["all","pending","confirmed","in_progress","completed","cancelled","refunded"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding:"7px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", background:statusFilter===s?B.primary:B.surface, color:statusFilter===s?"#fff":B.textMuted, border:`1.5px solid ${statusFilter===s?B.primary:B.border}` }}>
              {s==="all"?"All":s.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>
      <DataTable cols={cols} rows={filtered} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminPayments
// ═══════════════════════════════════════════════════════════════════════════════
const PAYMENT_TRANSACTIONS = [
  { id:"p1",  type:"escrow",     vendor:"Grand Monarch Hall",   amount:85000,  status:"paid",              date:"2026-12-10", booking:"b1a2" },
  { id:"p2",  type:"escrow",     vendor:"DJ Sonix Events",      amount:45000,  status:"released",          date:"2026-12-08", booking:"b5e6" },
  { id:"p3",  type:"payout",     vendor:"Velocity Badminton",   amount:26600,  status:"completed",         date:"2026-12-05", booking:"b3m4" },
  { id:"p4",  type:"refund",     vendor:"Skyline Party Lounge", amount:65000,  status:"completed",         date:"2026-12-02", booking:"b7q8" },
  { id:"p5",  type:"commission", vendor:"Platform",             amount:8500,   status:"completed",         date:"2026-12-01", booking:"b1a2" },
  { id:"p6",  type:"escrow",     vendor:"Royal Feast Catering", amount:120000, status:"release_requested", date:"2026-11-28", booking:"b9i0" },
  { id:"p7",  type:"payout",     vendor:"DJ Sonix Events",      amount:62000,  status:"completed",         date:"2026-11-25", booking:"—"    },
];
const TYPE_ICON = { escrow:"🔒", payout:"💸", refund:"↩️", commission:"📊" };

export function AdminPayments({ showToast }) {
  const [txns, setTxns] = useState(PAYMENT_TRANSACTIONS);
  const cols = [
    { key:"id",     label:"ID",     render:v => <code style={{ fontSize:11, background:B.bg, padding:"2px 6px", borderRadius:5 }}>{v.toUpperCase()}</code> },
    { key:"type",   label:"Type",   render:v => <span style={{ display:"flex", gap:5, alignItems:"center" }}><span>{TYPE_ICON[v]}</span><span style={{ textTransform:"capitalize", fontWeight:600 }}>{v}</span></span> },
    { key:"vendor", label:"Vendor", render:v => v },
    { key:"date",   label:"Date",   render:v => formatDate(v) },
    { key:"amount", label:"Amount", render:(v,r) => <span style={{ fontWeight:700, color:r.type==="refund"?B.danger:r.type==="commission"?B.success:B.text }}>{r.type==="refund"?"-":"+"}LKR {v.toLocaleString()}</span> },
    { key:"status", label:"Status", render:v => <StatusBadge status={v} /> },
    { key:"id",     label:"Action", render:(v,r) => (
      r.status==="release_requested"
        ? <button onClick={e => { e.stopPropagation(); setTxns(prev=>prev.map(t=>t.id===v?{...t,status:"released"}:t)); showToast("Payment released to vendor!"); }} style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(26,155,108,0.1)", color:B.success, border:"none", cursor:"pointer" }}>Release</button>
        : null
    )},
  ];

  const escrowHeld = txns.filter(t=>t.type==="escrow"&&t.status==="paid").reduce((s,t)=>s+t.amount,0);
  const payoutsTotal = txns.filter(t=>t.type==="payout").reduce((s,t)=>s+t.amount,0);
  const commTotal = txns.filter(t=>t.type==="commission").reduce((s,t)=>s+t.amount,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Payment Management" sub="Escrow, payouts, refunds & commissions" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
        <StatCard label="In Escrow"         value={formatMoney(escrowHeld)} accent={B.warning} icon="🔒" />
        <StatCard label="Payouts Released"  value={formatMoney(payoutsTotal)} accent={B.success} icon="💸" />
        <StatCard label="Commission Earned" value={formatMoney(commTotal)} accent={B.accent} icon="📊" />
        <StatCard label="Pending Releases"  value={txns.filter(t=>t.status==="release_requested").length} accent={B.danger} icon="⚠️" />
      </div>
      <DataTable cols={cols} rows={txns} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminCommissions
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminCommissions({ showToast }) {
  const [rules, setRules] = useState([
    { id:1, scope:"category", target:"Wedding Hall",   type:"percent", rate:10, active:true  },
    { id:2, scope:"category", target:"Catering",       type:"percent", rate:12, active:true  },
    { id:3, scope:"category", target:"Sports Ground",  type:"percent", rate:8,  active:true  },
    { id:4, scope:"category", target:"DJ & Music",     type:"percent", rate:10, active:true  },
    { id:5, scope:"category", target:"Photography",    type:"percent", rate:10, active:true  },
    { id:6, scope:"category", target:"Party Hall",     type:"percent", rate:9,  active:true  },
    { id:7, scope:"default",  target:"All categories", type:"percent", rate:10, active:true  },
  ]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Commission Rules" sub="Platform fee configuration per category" />
        <button onClick={() => showToast("Add commission rule — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}><Icon.Plus /> Add Rule</button>
      </div>
      <div style={{ ...cardStyle, background:"rgba(212,175,106,0.05)", border:"1px solid rgba(212,175,106,0.2)" }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:4 }}>ℹ️ How commissions work</div>
        <div style={{ fontSize:12, color:B.textMuted, lineHeight:1.6 }}>When a booking is completed, Evara deducts the configured percentage from the total booking amount before releasing payment to the vendor. The deducted amount is platform revenue. More specific rules override general ones (vendor-specific &gt; category &gt; default).</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {rules.map(r => (
          <div key={r.id} style={{ ...cardStyle, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{r.target}</div>
              <div style={{ fontSize:11, color:B.textMuted, textTransform:"capitalize" }}>{r.scope} rule</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <input type="number" defaultValue={r.rate} min={0} max={50} style={{ width:64, padding:"6px 10px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:16, fontWeight:700, color:B.primary, textAlign:"center", outline:"none", fontFamily:"'DM Sans',sans-serif" }}
                onBlur={e => { setRules(prev=>prev.map(x=>x.id===r.id?{...x,rate:+e.target.value}:x)); }} />
              <div style={{ fontSize:10, color:B.textMuted, marginTop:2 }}>% commission</div>
            </div>
            <div onClick={() => { setRules(prev=>prev.map(x=>x.id===r.id?{...x,active:!x.active}:x)); showToast("Rule updated!"); }} style={{ width:40, height:22, borderRadius:11, background:r.active?B.success:"#E4E1D9", position:"relative", cursor:"pointer", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:r.active?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => showToast("Commission rules saved!")} style={{ alignSelf:"flex-start", padding:"12px 28px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Rules
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminReviews
// ═══════════════════════════════════════════════════════════════════════════════
const FLAGGED_REVIEWS = [
  { id:1, customer:"Anon User",    vendor:"DJ Sonix Events",     rating:1, text:"Fake booking, never showed up. Scammer!",        date:"2026-12-09", flagged:true,  status:"pending"  },
  { id:2, customer:"Priya S.",     vendor:"Grand Monarch Hall",   rating:5, text:"Absolutely perfect. Best venue in Colombo!",     date:"2026-12-08", flagged:false, status:"approved" },
  { id:3, customer:"Unknown",      vendor:"Velocity Badminton",  rating:1, text:"SPAM SPAM SPAM buy cheap products !!!",           date:"2026-12-07", flagged:true,  status:"pending"  },
  { id:4, customer:"Kamal P.",     vendor:"DJ Sonix Events",      rating:4, text:"Great night! Music was excellent.",              date:"2026-12-06", flagged:false, status:"approved" },
];

export function AdminReviews({ showToast }) {
  const [reviews, setReviews] = useState(FLAGGED_REVIEWS);
  const [filter, setFilter] = useState("all");

  const filtered = filter==="all"?reviews:filter==="flagged"?reviews.filter(r=>r.flagged):reviews.filter(r=>r.status===filter);
  const action = (id, newStatus) => {
    setReviews(prev=>prev.map(r=>r.id===id?{...r,status:newStatus,flagged:false}:r));
    showToast(`Review ${newStatus}.`);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Review Moderation" sub={`${reviews.filter(r=>r.flagged).length} reviews flagged for review`} />
      <div style={{ display:"flex", gap:8 }}>
        {["all","flagged","pending","approved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", background:filter===f?B.primary:B.surface, color:filter===f?"#fff":B.textMuted, border:`1.5px solid ${filter===f?B.primary:B.border}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
            {f==="flagged"&&reviews.filter(r=>r.flagged).length>0&&<span style={{ marginLeft:5, background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{reviews.filter(r=>r.flagged).length}</span>}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ ...cardStyle, border:`1.5px solid ${r.flagged?"rgba(217,64,64,0.25)":B.border}`, background:r.flagged?"rgba(217,64,64,0.02)":"transparent" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2 }}>
                  {r.flagged && <span style={{ fontSize:11, fontWeight:700, background:"rgba(217,64,64,0.1)", color:B.danger, padding:"2px 7px", borderRadius:20 }}>🚩 Flagged</span>}
                  <span style={{ fontSize:12, fontWeight:700, color:B.text }}>{r.customer}</span>
                  <span style={{ fontSize:11, color:B.textMuted }}>→ {r.vendor}</span>
                </div>
                <div style={{ display:"flex", gap:2 }}>
                  {[1,2,3,4,5].map(i=><svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i<=r.rating?"#D4AF6A":"#E4E1D9"} stroke={i<=r.rating?"#D4AF6A":"#E4E1D9"} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
              </div>
              <div style={{ fontSize:11, color:B.textMuted }}>{formatDate(r.date)}</div>
            </div>
            <div style={{ fontSize:13, color:B.textMuted, lineHeight:1.5, marginBottom:12, fontStyle:"italic" }}>"{r.text}"</div>
            {r.status==="pending" && (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => action(r.id,"approved")} style={{ flex:1, padding:"8px", borderRadius:9, background:"rgba(26,155,108,0.1)", color:B.success, fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>✅ Approve</button>
                <button onClick={() => action(r.id,"hidden")} style={{ flex:1, padding:"8px", borderRadius:9, background:"rgba(217,64,64,0.1)", color:B.danger, fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>🚫 Hide Review</button>
                <button onClick={() => action(r.id,"deleted")} style={{ flex:1, padding:"8px", borderRadius:9, background:B.bg, color:B.textMuted, fontWeight:700, fontSize:12, border:`1px solid ${B.border}`, cursor:"pointer" }}>🗑 Delete</button>
              </div>
            )}
            {r.status!=="pending" && <StatusBadge status={r.status} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminSupport
// ═══════════════════════════════════════════════════════════════════════════════
const TICKETS = [
  { id:"T-221", subject:"Booking not confirmed after payment",     user:"Priya S.",   type:"dispute",   priority:"high",   status:"open",     created:"2026-12-10" },
  { id:"T-222", subject:"Request refund for cancelled event",      user:"Kamal P.",   type:"refund",    priority:"medium", status:"pending",  created:"2026-12-09" },
  { id:"T-223", subject:"Vendor not responding to messages",       user:"Nadia F.",   type:"complaint", priority:"medium", status:"open",     created:"2026-12-08" },
  { id:"T-224", subject:"App crash on booking confirmation",       user:"Ravi T.",    type:"bug",       priority:"low",    status:"resolved", created:"2026-12-07" },
  { id:"T-225", subject:"Vendor appeal – wrongful suspension",     user:"DJ Sonix",   type:"appeal",    priority:"high",   status:"pending",  created:"2026-12-06" },
  { id:"T-226", subject:"Duplicate charge on credit card",         user:"Amara L.",   type:"payment",   priority:"high",   status:"open",     created:"2026-12-05" },
];
const PRIORITY_COLOR = { high:B.danger, medium:B.warning, low:B.textMuted };

export function AdminSupport({ showToast }) {
  const [tickets, setTickets] = useState(TICKETS);
  const [filter, setFilter] = useState("all");

  const filtered = filter==="all"?tickets:tickets.filter(t=>t.status===filter);

  const resolve = (id) => {
    setTickets(prev=>prev.map(t=>t.id===id?{...t,status:"resolved"}:t));
    showToast("Ticket marked as resolved.");
  };
  const close = (id) => {
    setTickets(prev=>prev.map(t=>t.id===id?{...t,status:"closed"}:t));
    showToast("Ticket closed.");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Support Center" sub={`${tickets.filter(t=>t.status==="open").length} open tickets`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
        {[["Open",tickets.filter(t=>t.status==="open").length,B.danger],["Pending",tickets.filter(t=>t.status==="pending").length,B.warning],["Resolved",tickets.filter(t=>t.status==="resolved").length,B.success],["High Priority",tickets.filter(t=>t.priority==="high").length,B.danger]].map(([label,val,color])=>(
          <StatCard key={label} label={label} value={val} accent={color} />
        ))}
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["all","open","pending","resolved","closed"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", background:filter===f?B.primary:B.surface, color:filter===f?"#fff":B.textMuted, border:`1.5px solid ${filter===f?B.primary:B.border}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(t => (
          <div key={t.id} style={{ ...cardStyle, display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <code style={{ fontSize:11, background:B.bg, padding:"2px 6px", borderRadius:5 }}>{t.id}</code>
                <span style={{ fontSize:11, fontWeight:700, color:PRIORITY_COLOR[t.priority], background:`${PRIORITY_COLOR[t.priority]}15`, padding:"2px 7px", borderRadius:20, textTransform:"capitalize" }}>{t.priority}</span>
                <span style={{ fontSize:11, color:B.textMuted, textTransform:"capitalize", background:B.bg, padding:"2px 7px", borderRadius:20 }}>{t.type}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:2 }}>{t.subject}</div>
              <div style={{ fontSize:11, color:B.textMuted }}>{t.user} · {formatDate(t.created)}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
              <StatusBadge status={t.status} />
              {["open","pending"].includes(t.status) && (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => resolve(t.id)} style={{ padding:"4px 9px", borderRadius:7, fontSize:11, fontWeight:700, background:"rgba(26,155,108,0.1)", color:B.success, border:"none", cursor:"pointer" }}>Resolve</button>
                  <button onClick={() => close(t.id)} style={{ padding:"4px 9px", borderRadius:7, fontSize:11, fontWeight:700, background:B.bg, color:B.textMuted, border:`1px solid ${B.border}`, cursor:"pointer" }}>Close</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminSettings
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminSettings({ showToast }) {
  const [settings, setSettings] = useState({
    platform_name:"Evara", platform_currency:"LKR", escrow_days:3, min_withdrawal:5000,
    auto_approve_vendors:false, maintenance_mode:false, review_moderation:true,
    payout_frequency:"weekly",
  });
  const set = (k,v) => setSettings(s=>({...s,[k]:v}));

  const Toggle = ({k}) => (
    <div onClick={()=>set(k,!settings[k])} style={{ width:40, height:22, borderRadius:11, background:settings[k]?B.success:"#E4E1D9", position:"relative", cursor:"pointer", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:settings[k]?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:600 }}>
      <SectionHeader title="Platform Settings" sub="Global configuration for the Evara marketplace" />

      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>General</div>
        {[
          {key:"platform_name",     label:"Platform Name",      type:"text"  },
          {key:"platform_currency", label:"Currency",           type:"text"  },
          {key:"escrow_days",       label:"Escrow Hold (days)", type:"number"},
          {key:"min_withdrawal",    label:"Min Withdrawal (LKR)",type:"number"},
        ].map(f=>(
          <div key={f.key} style={{ marginBottom:14 }}>
            <label style={labelStyle}>{f.label}</label>
            <input type={f.type} value={settings[f.key]} onChange={e=>set(f.key,e.target.value)} style={inputStyle} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>Payout Frequency</label>
          <select value={settings.payout_frequency} onChange={e=>set("payout_frequency",e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
            {["daily","weekly","biweekly","monthly"].map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Feature Flags</div>
        {[
          ["auto_approve_vendors","Auto-approve new vendors","Skip manual review for vendor applications"],
          ["review_moderation",  "Review moderation",       "Require admin approval before reviews go live"],
          ["maintenance_mode",   "Maintenance mode",        "Take platform offline for all users"],
        ].map(([key,label,desc])=>(
          <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${B.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:key==="maintenance_mode"?B.danger:B.text }}>{label}</div>
              <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>{desc}</div>
            </div>
            <Toggle k={key} />
          </div>
        ))}
      </div>

      <button onClick={() => showToast("Platform settings saved!")} style={{ alignSelf:"flex-start", padding:"12px 32px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Settings
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AdminReports
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminReports({ showToast }) {
  const REPORTS = [
    { id:1, name:"Monthly Revenue Report",        desc:"GMV, commission, and net revenue breakdown",      icon:"💰", last:"Dec 2026" },
    { id:2, name:"Vendor Performance Report",     desc:"Top vendors by bookings, revenue, and ratings",   icon:"🏢", last:"Dec 2026" },
    { id:3, name:"Booking Analytics Report",      desc:"Booking trends, cancellations, and conversions",  icon:"📅", last:"Dec 2026" },
    { id:4, name:"Customer Acquisition Report",   desc:"New users, sources, and retention rates",         icon:"👥", last:"Dec 2026" },
    { id:5, name:"Category Performance Report",   desc:"Revenue and bookings by venue category",          icon:"🏷️", last:"Dec 2026" },
    { id:6, name:"Support & Disputes Report",     desc:"Ticket volumes, resolution times, and refunds",   icon:"🎧", last:"Dec 2026" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Reports" sub="Download platform reports" />
        <button onClick={() => showToast("Scheduled reports — coming soon!", "info")} style={{ padding:"9px 16px", borderRadius:10, background:B.bg, color:B.text, fontWeight:700, fontSize:13, border:`1.5px solid ${B.border}`, cursor:"pointer" }}>
          ⏰ Schedule Reports
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
        {REPORTS.map(r => (
          <div key={r.id} style={{ ...cardStyle, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:28 }}>{r.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:3 }}>{r.name}</div>
                <div style={{ fontSize:11, color:B.textMuted, lineHeight:1.5 }}>{r.desc}</div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:`1px solid ${B.border}` }}>
              <div style={{ fontSize:11, color:B.textMuted }}>Last generated: {r.last}</div>
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={() => showToast(`Generating ${r.name}...`, "info")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:B.dark, color:"#fff", fontWeight:700, fontSize:11, border:"none", cursor:"pointer" }}>
                  <Icon.Download /> Export
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;
