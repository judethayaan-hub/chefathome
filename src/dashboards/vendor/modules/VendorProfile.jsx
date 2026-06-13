import { useState } from "react";
import { B, SectionHeader, cardStyle, inputStyle, labelStyle, Icon, CAT_LABELS, CAT_EMOJI } from "../../shared/tokens.jsx";

// ─── VendorProfile ─────────────────────────────────────────────────────────────
export function VendorProfile({ vendor, showToast }) {
  const [form, setForm] = useState({
    name: vendor?.name || "My Venue",
    category: vendor?.category || "sports",
    location: vendor?.location || "Colombo 03, Sri Lanka",
    base_price: vendor?.base_price || 25000,
    description: vendor?.description || "",
    phone: "+94 77 000 0000",
    website: "",
    instagram: "",
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:640 }}>
      <SectionHeader title="Venue Profile" sub="This information appears on your public listing" />

      {/* Profile header */}
      <div style={{ background:B.dark, borderRadius:16, padding:"20px 22px", display:"flex", gap:16, alignItems:"center" }}>
        <div style={{ width:64, height:64, borderRadius:16, background:"rgba(212,175,106,0.15)", border:"1px solid rgba(212,175,106,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>
          {CAT_EMOJI[form.category] || "🎪"}
        </div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#fff" }}>{form.name}</div>
          <div style={{ fontSize:12, color:B.accent, marginTop:2 }}>{CAT_LABELS[form.category] || form.category}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{form.location}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ADE80" }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Active Listing</span>
        </div>
      </div>

      {/* Form fields */}
      <div style={{ ...cardStyle }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { key:"name",       label:"Venue Name *",         type:"text",   placeholder:"e.g. Grand Royal Banquet Hall" },
            { key:"location",   label:"Location *",           type:"text",   placeholder:"e.g. Colombo 03, Sri Lanka" },
            { key:"base_price", label:"Starting Price (LKR)", type:"number", placeholder:"e.g. 25000" },
            { key:"phone",      label:"Contact Phone",        type:"tel",    placeholder:"+94 77 000 0000" },
            { key:"website",    label:"Website",              type:"url",    placeholder:"https://myvenue.lk" },
            { key:"instagram",  label:"Instagram Handle",     type:"text",   placeholder:"@myvenue" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Describe your venue's unique features, capacity, facilities..." rows={4} style={{ ...inputStyle, resize:"vertical" }} />
          </div>
        </div>
      </div>

      <button onClick={() => showToast("Profile saved!")} style={{ alignSelf:"flex-start", padding:"12px 32px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Profile
      </button>
    </div>
  );
}

// ─── VendorSettings ───────────────────────────────────────────────────────────
export function VendorSettings({ showToast }) {
  const [notifs, setNotifs] = useState({ new_booking:true, cancellation:true, new_review:true, payment:true, messages:false });
  const [autoApprove, setAutoApprove] = useState(false);
  const [minNotice, setMinNotice] = useState("48");
  const toggle = (k) => setNotifs(n => ({...n,[k]:!n[k]}));

  const Toggle = ({ on, onToggle }) => (
    <div onClick={onToggle} style={{ width:40, height:22, borderRadius:11, background:on?B.success:"#E4E1D9", position:"relative", transition:"background .2s", cursor:"pointer", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:on?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:560 }}>
      <SectionHeader title="Settings" sub="Manage your account and notification preferences" />

      {/* Booking settings */}
      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Booking Preferences</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${B.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:B.text }}>Auto-approve bookings</div>
              <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>Automatically confirm bookings without manual review</div>
            </div>
            <Toggle on={autoApprove} onToggle={() => setAutoApprove(a=>!a)} />
          </div>
          <div>
            <label style={labelStyle}>Minimum Advance Notice (hours)</label>
            <select value={minNotice} onChange={e=>setMinNotice(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              {["12","24","48","72","168"].map(h => <option key={h} value={h}>{h === "168" ? "7 days" : `${h} hours`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notification settings */}
      <div style={{ ...cardStyle }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Notification Preferences</div>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {[
            ["new_booking",   "New Booking",          "When a customer makes a booking"],
            ["cancellation",  "Cancellation",         "When a booking is cancelled"],
            ["new_review",    "New Review",            "When you receive a review"],
            ["payment",       "Payment Updates",       "Escrow releases and withdrawals"],
            ["messages",      "Messages",              "New customer messages"],
          ].map(([key, label, desc]) => (
            <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${B.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{label}</div>
                <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>{desc}</div>
              </div>
              <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...cardStyle, border:`1px solid rgba(217,64,64,0.2)`, background:"rgba(217,64,64,0.02)" }}>
        <div style={{ fontSize:13, fontWeight:700, color:B.danger, marginBottom:12 }}>Danger Zone</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:B.text }}>Pause my listing</div>
            <div style={{ fontSize:11, color:B.textMuted }}>Temporarily hide your listing from customers</div>
          </div>
          <button onClick={() => showToast("Listing paused — customers can't see you now.", "info")} style={{ padding:"8px 16px", borderRadius:9, background:"rgba(217,64,64,0.1)", color:B.danger, fontWeight:700, fontSize:12, border:`1px solid rgba(217,64,64,0.2)`, cursor:"pointer" }}>Pause</button>
        </div>
      </div>

      <button onClick={() => showToast("Settings saved!")} style={{ alignSelf:"flex-start", padding:"12px 32px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Settings
      </button>
    </div>
  );
}

// ─── VendorPricingRules ────────────────────────────────────────────────────────
export function VendorPricingRules({ showToast }) {
  const [rules, setRules] = useState([
    { id:1, type:"weekday",  label:"Weekday Rate",    price:2500,  unit:"per hour",  active:true  },
    { id:2, type:"weekend",  label:"Weekend Rate",    price:3500,  unit:"per hour",  active:true  },
    { id:3, type:"holiday",  label:"Public Holiday",  price:4500,  unit:"per hour",  active:true  },
    { id:4, type:"peak",     label:"Peak Hours (6–9PM)", price:4000, unit:"per hour", active:true  },
    { id:5, type:"fullday",  label:"Full Day Package", price:18000, unit:"flat",      active:false },
    { id:6, type:"earlybird",label:"Early Bird (–15%)",price:-15,  unit:"percent",   active:true  },
  ]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Pricing Rules" sub="Set rates for different times and conditions" />
        <button onClick={() => showToast("Custom rule builder — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
          <Icon.Plus /> Add Rule
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {rules.map(r => (
          <div key={r.id} style={{ ...cardStyle, display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:2 }}>{r.label}</div>
              <div style={{ fontSize:12, color:B.textMuted }}>
                {r.unit === "percent"
                  ? `${r.price > 0 ? "+" : ""}${r.price}% adjustment`
                  : `LKR ${r.price.toLocaleString()} / ${r.unit}`}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <input
                type="number"
                defaultValue={r.price}
                style={{ width:90, padding:"7px 10px", borderRadius:8, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:13, color:B.text, outline:"none", textAlign:"right", fontFamily:"'DM Sans',sans-serif" }}
                onBlur={e => {
                  setRules(prev => prev.map(x => x.id===r.id ? {...x, price:+e.target.value} : x));
                }}
              />
              <div onClick={() => { setRules(prev => prev.map(x => x.id===r.id?{...x,active:!x.active}:x)); showToast("Rule updated!"); }} style={{ width:40, height:22, borderRadius:11, background:r.active?B.success:"#E4E1D9", position:"relative", transition:"background .2s", cursor:"pointer", flexShrink:0 }}>
                <div style={{ position:"absolute", top:3, left:r.active?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => showToast("Pricing rules saved!")} style={{ alignSelf:"flex-start", padding:"12px 32px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Pricing
      </button>
    </div>
  );
}

// ─── VendorPackages ────────────────────────────────────────────────────────────
export function VendorPackages({ showToast }) {
  const [packages, setPackages] = useState([
    { id:1, name:"Essential",  price:35000, duration:"3 hrs", features:["Basic sound","Standard lighting","1 DJ"],           popular:false },
    { id:2, name:"Pro Night",  price:65000, duration:"5 hrs", features:["Premium JBL","LED lights","1 DJ + assistant","Mic"], popular:true  },
    { id:3, name:"Festival",   price:120000,duration:"Full",  features:["Concert sound","Full light show","2 DJs","MC"],      popular:false },
  ]);
  const [editing, setEditing] = useState(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Package Builder" sub="Create and manage your service packages" />
        <button onClick={() => showToast("Package editor — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
          <Icon.Plus /> New Package
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{ ...cardStyle, position:"relative", border:`1.5px solid ${pkg.popular?B.accent:B.border}` }}>
            {pkg.popular && (
              <div style={{ position:"absolute", top:0, right:0, background:B.accent, color:B.dark, fontSize:9, fontWeight:700, padding:"3px 10px", borderRadius:"0 12px 0 8px", letterSpacing:0.5 }}>POPULAR</div>
            )}
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:B.text, marginBottom:4 }}>{pkg.name}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:B.accent, marginBottom:2 }}>LKR {pkg.price.toLocaleString()}</div>
            <div style={{ fontSize:11, color:B.textMuted, marginBottom:12 }}>{pkg.duration}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
              {pkg.features.map(f => (
                <div key={f} style={{ display:"flex", gap:7, alignItems:"center", fontSize:12, color:B.textMuted }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.success} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => showToast("Edit package — coming soon!", "info")} style={{ flex:1, padding:"8px", borderRadius:9, background:B.bg, color:B.text, fontWeight:700, fontSize:12, border:`1px solid ${B.border}`, cursor:"pointer" }}>✏️ Edit</button>
              <button onClick={() => { setPackages(p => p.map(x => x.id===pkg.id?{...x,popular:!x.popular}:x)); showToast("Package updated!"); }} style={{ flex:1, padding:"8px", borderRadius:9, background:pkg.popular?"rgba(212,175,106,0.1)":B.bg, color:pkg.popular?B.accent:B.textMuted, fontWeight:700, fontSize:12, border:`1px solid ${pkg.popular?B.accent:B.border}`, cursor:"pointer" }}>
                {pkg.popular?"★ Popular":"☆ Set Popular"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VendorMenuBuilder ─────────────────────────────────────────────────────────
export function VendorMenuBuilder({ showToast }) {
  const [items, setItems] = useState([
    { id:1, cat:"Rice & Curry",  name:"Traditional Rice & Curry",    price:850,  dietary:["Veg","Halal"], active:true  },
    { id:2, cat:"Rice & Curry",  name:"Special Fish Ambul Thiyal",   price:950,  dietary:["Halal"],       active:true  },
    { id:3, cat:"Appetisers",    name:"Spring Rolls (12 pcs)",       price:650,  dietary:["Veg"],         active:true  },
    { id:4, cat:"Appetisers",    name:"Chicken Cutlets",             price:700,  dietary:["Halal"],       active:false },
    { id:5, cat:"Desserts",      name:"Watalappan",                  price:400,  dietary:["Veg","Halal"], active:true  },
    { id:6, cat:"Desserts",      name:"Creme Caramel",               price:380,  dietary:["Veg"],         active:true  },
  ]);

  const categories = [...new Set(items.map(i => i.cat))];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Menu Builder" sub="Manage your food items and categories" />
        <button onClick={() => showToast("Add item — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
          <Icon.Plus /> Add Item
        </button>
      </div>

      {categories.map(cat => (
        <div key={cat} style={{ ...cardStyle }}>
          <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, paddingBottom:10, borderBottom:`1px solid ${B.border}` }}>{cat}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {items.filter(i => i.cat === cat).map(item => (
              <div key={item.id} style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:item.active?B.text:B.textLight, textDecoration:item.active?"none":"line-through" }}>{item.name}</div>
                  <div style={{ display:"flex", gap:5, marginTop:3 }}>
                    {item.dietary.map(d => (
                      <span key={d} style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:20, background:"rgba(26,155,108,0.1)", color:B.success }}>{d}</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:B.accent, flexShrink:0 }}>LKR {item.price}</div>
                <div onClick={() => { setItems(prev => prev.map(x => x.id===item.id?{...x,active:!x.active}:x)); showToast("Menu updated!"); }} style={{ width:36, height:20, borderRadius:10, background:item.active?B.success:"#E4E1D9", position:"relative", cursor:"pointer", flexShrink:0 }}>
                  <div style={{ position:"absolute", top:2, left:item.active?17:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── VendorSlots ──────────────────────────────────────────────────────────────
export function VendorSlots({ showToast }) {
  const SLOT_TIMES = ["6AM","7AM","8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM","9PM"];
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(2500);
  const [slots, setSlots] = useState(SLOT_TIMES.map(t => ({ time:t, enabled:true, price:2500 })));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionHeader title="Slot Management" sub="Configure bookable time slots and per-slot pricing" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Slot Duration</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[30,60,90,120].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", background:duration===d?B.primary:B.bg, color:duration===d?"#fff":B.textMuted, border:`1.5px solid ${duration===d?B.primary:B.border}` }}>{d}min</button>
            ))}
          </div>
        </div>
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize:11, fontWeight:700, color:B.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Default Price (LKR)</div>
          <input type="number" value={price} onChange={e => { setPrice(+e.target.value); setSlots(s => s.map(x => ({...x, price:+e.target.value}))); }} style={{ width:"100%", padding:"10px 13px", borderRadius:9, border:`1.5px solid ${B.border}`, background:B.bg, fontSize:16, fontWeight:700, color:B.primary, outline:"none", textAlign:"center", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
          {slots.map((s, i) => (
            <div key={s.time} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${s.enabled?B.border:"rgba(217,64,64,0.2)"}`, background:s.enabled?B.surface:"rgba(217,64,64,0.03)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:s.enabled?B.text:B.textLight }}>{s.time}</div>
                <div style={{ fontSize:11, color:B.textMuted }}>LKR {s.price.toLocaleString()}</div>
              </div>
              <div onClick={() => { setSlots(prev => prev.map((x,xi) => xi===i?{...x,enabled:!x.enabled}:x)); }} style={{ width:32, height:18, borderRadius:9, background:s.enabled?B.success:"#E4E1D9", position:"relative", cursor:"pointer" }}>
                <div style={{ position:"absolute", top:2, left:s.enabled?14:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => showToast("Slot configuration saved!")} style={{ alignSelf:"flex-start", padding:"12px 32px", borderRadius:11, background:B.dark, color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        Save Slots
      </button>
    </div>
  );
}

// ─── VendorGrounds ─────────────────────────────────────────────────────────────
export function VendorGrounds({ showToast }) {
  const [courts, setCourts] = useState([
    { id:1, name:"Court A – Badminton", sport:"Badminton", capacity:4,  condition:"Excellent", active:true  },
    { id:2, name:"Court B – Badminton", sport:"Badminton", capacity:4,  condition:"Good",      active:true  },
    { id:3, name:"Futsal Ground",       sport:"Futsal",    capacity:10, condition:"Good",      active:true  },
    { id:4, name:"Basketball Court",    sport:"Basketball",capacity:10, condition:"Fair",      active:false },
  ]);

  const COND_COLOR = { Excellent:B.success, Good:B.info, Fair:B.warning, Poor:B.danger };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <SectionHeader title="Ground & Court Management" sub="Manage individual courts and facilities" />
        <button onClick={() => showToast("Add court — coming soon!", "info")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:B.dark, color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
          <Icon.Plus /> Add Court
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
        {courts.map(court => (
          <div key={court.id} style={{ ...cardStyle, border:`1.5px solid ${court.active?B.border:"rgba(217,64,64,0.2)"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:court.active?B.text:B.textLight }}>{court.name}</div>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${COND_COLOR[court.condition]}15`, color:COND_COLOR[court.condition] }}>{court.condition}</span>
            </div>
            <div style={{ fontSize:12, color:B.textMuted, marginBottom:4 }}>🏅 {court.sport}</div>
            <div style={{ fontSize:12, color:B.textMuted, marginBottom:12 }}>👥 {court.capacity} players max</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => showToast("Editing court — coming soon!", "info")} style={{ flex:1, padding:"7px", borderRadius:8, background:B.bg, color:B.text, fontWeight:700, fontSize:11, border:`1px solid ${B.border}`, cursor:"pointer" }}>✏️ Edit</button>
              <div onClick={() => { setCourts(prev => prev.map(x => x.id===court.id?{...x,active:!x.active}:x)); showToast("Court status updated!"); }} style={{ width:36, height:30, borderRadius:8, background:court.active?B.success:"#E4E1D9", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorProfile;
