import { useState } from "react";
import { B, SectionHeader, cardStyle, Icon, formatDate } from "../../shared/tokens.js";

const PROMOS = [
  { id:1, code:"NEWYEAR25",   discount:25, type:"percent", minOrder:50000, uses:12, limit:50,  active:true,  expires:"2027-01-01", desc:"New Year 25% off" },
  { id:2, code:"EARLYBIRD",   discount:15000, type:"flat", minOrder:80000, uses:8,  limit:20,  active:true,  expires:"2026-12-31", desc:"Early bird flat discount" },
  { id:3, code:"CORPORATE10", discount:10, type:"percent", minOrder:100000,uses:5,  limit:null,active:false, expires:"2027-03-31", desc:"Corporate clients only" },
];

export default function VendorMarketing({ showToast }) {
  const [promos, setPromos] = useState(PROMOS);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code:"", discount:"", type:"percent", minOrder:"", limit:"", expires:"", desc:"" });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const create = () => {
    if (!form.code || !form.discount) { showToast("Code and discount are required","error"); return; }
    setPromos(prev => [...prev, { id:Date.now(), ...form, discount:+form.discount, minOrder:+form.minOrder||0, limit:form.limit?+form.limit:null, uses:0, active:true }]);
    setForm({ code:"", discount:"", type:"percent", minOrder:"", limit:"", expires:"", desc:"" });
    setCreating(false);
    showToast("Promo code created!");
  };

  const toggle = (id) => {
    setPromos(prev => prev.map(p => p.id===id ? {...p, active:!p.active} : p));
    showToast("Promo updated!");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Marketing Center" sub="Promotions, coupons & campaigns" />
        <button onClick={() => setCreating(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
          <Icon.Plus /> New Promo
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        {[
          ["Active Promos", promos.filter(p=>p.active).length, B.success],
          ["Total Uses",    promos.reduce((s,p)=>s+p.uses,0), B.primary],
          ["Conversions",   "34%",  B.accent],
        ].map(([label,val,color]) => (
          <div key={label} style={{ ...cardStyle }}>
            <div style={{ fontSize:11, color:B.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Promo list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {promos.map(p => (
          <div key={p.id} style={{ ...cardStyle, display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <div style={{ fontFamily:"monospace", fontSize:15, fontWeight:700, color:B.text, background:B.bg, padding:"3px 10px", borderRadius:7, letterSpacing:1 }}>{p.code}</div>
                <div style={{ fontSize:14, fontWeight:700, color:B.accent }}>
                  {p.type==="percent"?`${p.discount}% OFF`:`LKR ${p.discount.toLocaleString()} OFF`}
                </div>
              </div>
              <div style={{ fontSize:11, color:B.textMuted }}>{p.desc} · {p.uses} uses{p.limit?` / ${p.limit}`:""} · Expires {formatDate(p.expires)}</div>
              {p.minOrder > 0 && <div style={{ fontSize:10, color:B.textMuted, marginTop:2 }}>Min order: LKR {p.minOrder.toLocaleString()}</div>}
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", flexShrink:0 }}>
              <div onClick={() => toggle(p.id)} style={{ width:40, height:22, borderRadius:11, background:p.active?B.success:"#E4E1D9", position:"relative", transition:"background .2s", cursor:"pointer" }}>
                <div style={{ position:"absolute", top:3, left:p.active?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:p.active?B.success:B.textMuted }}>{p.active?"Active":"Off"}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Create promo modal */}
      {creating && (
        <>
          <div onClick={() => setCreating(false)} style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(12,22,40,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:800, width:"min(420px,92vw)", background:B.surface, borderRadius:18, border:`1px solid ${B.border}`, padding:24, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:16, fontWeight:700, color:B.text, marginBottom:20 }}>Create Promo Code</div>
            {[
              { key:"code",     label:"Promo Code *",       type:"text",   placeholder:"e.g. SUMMER30" },
              { key:"desc",     label:"Description",        type:"text",   placeholder:"e.g. Summer 30% discount" },
              { key:"discount", label:"Discount Amount *",  type:"number", placeholder:"e.g. 25" },
              { key:"minOrder", label:"Minimum Order (LKR)",type:"number", placeholder:"e.g. 50000" },
              { key:"limit",    label:"Usage Limit",        type:"number", placeholder:"Leave blank for unlimited" },
              { key:"expires",  label:"Expiry Date",        type:"date",   placeholder:"" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} style={{ width:"100%", padding:"10px 13px", borderRadius:9, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Discount Type</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["percent","% Percentage"],["flat","LKR Flat"]].map(([v,l]) => (
                  <button key={v} onClick={() => set("type",v)} style={{ flex:1, padding:"9px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", background:form.type===v?B.primary:B.bg, color:form.type===v?"#fff":B.textMuted, border:`1.5px solid ${form.type===v?B.primary:B.border}` }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setCreating(false)} style={{ flex:1, padding:"11px", borderRadius:10, background:B.bg, border:`1.5px solid ${B.border}`, color:B.text, fontWeight:700, fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={create} style={{ flex:2, padding:"11px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>Create Promo</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
