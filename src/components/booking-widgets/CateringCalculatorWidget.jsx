import { useState, useMemo } from "react";

const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040", warning: "#D97706",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

const MENU_PACKAGES = [
  {
    id: "buffet_classic",
    label: "Buffet Classic",
    icon: "🍛",
    pricePerHead: 1800,
    desc: "10 dishes · warmers included · 2 servers",
  },
  {
    id: "buffet_royal",
    label: "Buffet Royal",
    icon: "🍽️",
    pricePerHead: 3200,
    desc: "20 dishes · live stations · dessert table",
    popular: true,
  },
  {
    id: "plated_dinner",
    label: "Plated Dinner",
    icon: "🥘",
    pricePerHead: 4500,
    desc: "5-course plated · full staff · tableware",
  },
  {
    id: "cocktail",
    label: "Cocktail Reception",
    icon: "🥂",
    pricePerHead: 2400,
    desc: "Finger food · mocktail bar · roaming service",
  },
];

const ADD_ONS = [
  { id: "waitstaff",   label: "Extra Waitstaff",      icon: "👨‍🍳", flatPrice: 8000,  desc: "4 additional servers" },
  { id: "chafing",     label: "Chafing Dishes Set",   icon: "🍳", flatPrice: 4500,  desc: "Full set of 12 warmers" },
  { id: "tableware",   label: "Premium Tableware",    icon: "🍴", flatPrice: 6000,  desc: "Bone china + glassware" },
  { id: "dessert",     label: "Dessert Station",       icon: "🍮", flatPrice: 12000, desc: "Chef-curated sweets table" },
  { id: "beverage",    label: "Beverage Station",      icon: "🥤", flatPrice: 9500,  desc: "Juices, mocktails & water" },
  { id: "coordinator", label: "Event Coordinator",    icon: "📋", flatPrice: 15000, desc: "On-site catering manager" },
];

const DIETARY_TAGS = ["Halal", "Vegan options", "Gluten-Free", "Keto-friendly", "Nut-Free"];

function GuestCounter({ value, onChange }) {
  const presets = [50, 100, 150, 200, 300, 500];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onChange(Math.max(10, value - 10))}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", fontSize: 20, fontWeight: 700, color: B.text, display: "flex", alignItems: "center", justifyContent: "center" }}
        >−</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <input
            type="number"
            value={value}
            onChange={e => onChange(Math.max(10, Math.min(2000, +e.target.value || 10)))}
            style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1.5px solid ${B.accent}`, background: B.accentSoft, fontSize: 24, fontWeight: 700, color: B.primary, textAlign: "center", outline: "none" }}
          />
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 3 }}>guests</div>
        </div>
        <button
          onClick={() => onChange(Math.min(2000, value + 10))}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", fontSize: 20, fontWeight: 700, color: B.text, display: "flex", alignItems: "center", justifyContent: "center" }}
        >+</button>
      </div>
      {/* Quick presets */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: value === p ? B.primary : B.bg,
              color: value === p ? "#fff" : B.textMuted,
              border: `1.5px solid ${value === p ? B.primary : B.border}`,
            }}
          >{p}</button>
        ))}
      </div>
    </div>
  );
}

export default function CateringCalculatorWidget({ vendor, user, onQuote, onTasting }) {
  const [guests, setGuests]         = useState(100);
  const [menuId, setMenuId]         = useState("buffet_royal");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [dietary, setDietary]       = useState([]);
  const [step, setStep]             = useState("calculator"); // "calculator" | "submitted"
  const [loading, setLoading]       = useState(false);

  const selectedMenu = MENU_PACKAGES.find(m => m.id === menuId);
  const baseTotal    = (selectedMenu?.pricePerHead || 0) * guests;
  const addOnTotal   = selectedAddOns.reduce((sum, id) => {
    const addon = ADD_ONS.find(a => a.id === id);
    return sum + (addon?.flatPrice || 0);
  }, 0);
  const grandTotal   = baseTotal + addOnTotal;
  const platformFee  = Math.round(grandTotal * 0.05);
  const totalWithFee = grandTotal + platformFee;

  const toggleAddOn = (id) =>
    setSelectedAddOns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleDietary = (tag) =>
    setDietary(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);

  const handleGetQuote = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setStep("submitted");
    onQuote?.({ guests, menu: selectedMenu, addOns: selectedAddOns, dietary, total: totalWithFee });
  };

  if (step === "submitted") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 16px", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(26,155,108,0.1)", border: `2px solid ${B.success}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: B.text }}>Quote Requested!</div>
        <div style={{ fontSize: 13, color: B.textMuted, marginTop: 8, lineHeight: 1.6 }}>
          The catering team will send a detailed quote within 4 hours. Your estimated total is:
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: B.accent, marginTop: 10 }}>
          LKR {totalWithFee.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>for {guests} guests · {selectedMenu?.label}</div>
      </div>
      <button
        onClick={() => { setStep("calculator"); setSelectedAddOns([]); setDietary([]); }}
        style={{ padding: "11px 28px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", color: B.text }}
      >← Adjust Quote</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Guest counter */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Number of Guests</div>
        <GuestCounter value={guests} onChange={setGuests} />
      </div>

      {/* Menu packages */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Menu Package</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MENU_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => setMenuId(pkg.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12, cursor: "pointer", textAlign: "left", position: "relative",
                background: menuId === pkg.id ? "rgba(28,43,75,0.04)" : B.bg,
                border: `1.5px solid ${menuId === pkg.id ? B.primary : B.border}`,
              }}
            >
              {pkg.popular && (
                <div style={{ position: "absolute", top: 0, right: 0, background: B.accent, color: B.dark, fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: "0 10px 0 8px", letterSpacing: 0.5 }}>POPULAR</div>
              )}
              <span style={{ fontSize: 24, flexShrink: 0 }}>{pkg.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: B.text }}>{pkg.label}</div>
                <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{pkg.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: menuId === pkg.id ? B.primary : B.textMuted }}>
                  LKR {pkg.pricePerHead.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: B.textLight }}>per head</div>
              </div>
              {menuId === pkg.id && (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: B.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live price breakdown */}
      <div style={{ background: "rgba(28,43,75,0.04)", borderRadius: 14, border: `1px solid ${B.border}`, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Live Price Breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: B.text }}>
            <span>{selectedMenu?.label} × {guests} guests</span>
            <span style={{ fontWeight: 600 }}>LKR {baseTotal.toLocaleString()}</span>
          </div>
          {selectedAddOns.map(id => {
            const a = ADD_ONS.find(x => x.id === id);
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: B.textMuted }}>
                <span>+ {a?.label}</span>
                <span>LKR {a?.flatPrice.toLocaleString()}</span>
              </div>
            );
          })}
          <div style={{ height: 1, background: B.border, margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: B.textMuted }}>
            <span>Subtotal</span>
            <span>LKR {grandTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: B.textMuted }}>
            <span>Platform fee (5%)</span>
            <span>LKR {platformFee.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: B.text, marginTop: 2 }}>
            <span>Total Estimate</span>
            <span style={{ fontFamily: "'Playfair Display', serif", color: B.primary }}>LKR {totalWithFee.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>
            ≈ LKR {Math.round(totalWithFee / guests).toLocaleString()} per guest
          </div>
        </div>
      </div>

      {/* Add-ons */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Add-Ons (optional)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ADD_ONS.map(addon => {
            const active = selectedAddOns.includes(addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => toggleAddOn(addon.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: active ? "rgba(212,175,106,0.08)" : B.bg,
                  border: `1.5px solid ${active ? B.accent : B.border}`,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{addon.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{addon.label}</div>
                  <div style={{ fontSize: 11, color: B.textMuted, marginTop: 1 }}>{addon.desc}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#9C7339" : B.textMuted }}>
                    +LKR {addon.flatPrice.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: active ? B.accent : B.surface,
                  border: `1.5px solid ${active ? B.accent : B.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.dark} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary requirements */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Dietary Requirements</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {DIETARY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleDietary(tag)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: dietary.includes(tag) ? "rgba(26,155,108,0.1)" : B.bg,
                color: dietary.includes(tag) ? B.success : B.textMuted,
                border: `1.5px solid ${dietary.includes(tag) ? B.success : B.border}`,
              }}
            >{tag}</button>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleGetQuote}
          disabled={loading}
          style={{
            flex: 2, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: B.dark, color: "#fff",
          }}
        >
          {loading ? "Sending…" : "Get Custom Quote 📋"}
        </button>
        <button
          onClick={() => onTasting?.({ guests, menu: selectedMenu })}
          style={{
            flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 13,
            border: `1.5px solid ${B.accent}`, cursor: "pointer",
            background: B.accentSoft, color: B.primary,
          }}
        >
          🍴 Tasting
        </button>
      </div>
    </div>
  );
}
