import { useState } from "react";

const B = {
  primary: "#1C2B4B", accent: "#D4AF6A", accentSoft: "#FBF5E9",
  success: "#1A9B6C", danger: "#D94040", warning: "#D97706",
  bg: "#F5F4F1", surface: "#FFFFFF", border: "#E4E1D9",
  text: "#1C2B4B", textMuted: "#7A7D8C", textLight: "#B0B3C1", dark: "#0C1628",
};

const HOURLY_RATE = 8500; // LKR per hour

const PACKAGES = [
  {
    id: "essential",
    label: "Essential Night",
    icon: "🎵",
    price: 35000,
    hours: "3 hrs",
    features: ["Standard sound system", "Basic lighting rig", "1 DJ", "Pre-event playlist call"],
  },
  {
    id: "pro_night",
    label: "Pro Night",
    icon: "🎧",
    price: 65000,
    hours: "5 hrs",
    features: ["Premium JBL/QSC system", "LED moving lights", "1 DJ + assistant", "All genres covered", "Wireless mic for MC"],
    popular: true,
  },
  {
    id: "festival",
    label: "Festival",
    icon: "🎛️",
    price: 120000,
    hours: "Full day",
    features: ["Concert-grade sound", "Full light & haze show", "2 DJs back-to-back", "Live remixing", "MC service", "Livestream"],
  },
];

const GENRES = [
  { id: "pop",          label: "🎵 Pop / Top 40" },
  { id: "rnb",          label: "🎤 R&B / Hip-Hop" },
  { id: "edm",          label: "⚡ EDM / Electronic" },
  { id: "baila",        label: "🥁 Baila / Sinhala" },
  { id: "bollywood",    label: "🎬 Bollywood" },
  { id: "tamil",        label: "🎶 Tamil Hits" },
  { id: "latin",        label: "💃 Latin / Reggaeton" },
  { id: "old_school",   label: "📼 Old School / Retro" },
  { id: "classical",    label: "🎻 Classical / Acoustic" },
  { id: "mixed",        label: "🎚️ DJ Choice Mix" },
];

const ADD_ONS = [
  { id: "mc",          label: "MC / Bilingual Host", icon: "🎤", price: 12000 },
  { id: "haze",        label: "Haze / Fog Machine",  icon: "🌫️", price: 5000  },
  { id: "photobooth",  label: "DJ Photo Booth",       icon: "📸", price: 8000  },
  { id: "livestream",  label: "Event Livestream",     icon: "📡", price: 15000 },
  { id: "early_setup", label: "Early Setup (+2hrs)",  icon: "⏰", price: 4000  },
];

function VibeLink({ value, onChange }) {
  const isSpotify     = value.includes("spotify.com");
  const isSoundCloud  = value.includes("soundcloud.com");
  const isYoutube     = value.includes("youtube.com") || value.includes("youtu.be");
  const detected = isSpotify ? "🟢 Spotify" : isSoundCloud ? "🟠 SoundCloud" : isYoutube ? "🔴 YouTube" : null;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
        Vibe / Playlist Inspiration
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste Spotify, SoundCloud or YouTube link…"
          style={{
            width: "100%", padding: "12px 14px", paddingRight: detected ? 120 : 14,
            borderRadius: 10, border: `1.5px solid ${detected ? B.success : B.border}`,
            background: detected ? "rgba(26,155,108,0.04)" : B.bg,
            fontSize: 13, color: B.text, outline: "none", boxSizing: "border-box",
            transition: "border-color .2s",
          }}
        />
        {detected && (
          <div style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, fontWeight: 700, color: B.success, background: "rgba(26,155,108,0.1)",
            padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap",
          }}>
            {detected} ✓
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: B.textMuted, marginTop: 5 }}>
        Share a playlist so the DJ can match your vibe perfectly
      </div>
    </div>
  );
}

export default function DJMediaWidget({ vendor, user, onBook }) {
  const [mode, setMode]               = useState("package"); // "hourly" | "package"
  const [hours, setHours]             = useState(3);
  const [packageId, setPackageId]     = useState("pro_night");
  const [genres, setGenres]           = useState([]);
  const [addOns, setAddOns]           = useState([]);
  const [vibeLink, setVibeLink]       = useState("");
  const [eventType, setEventType]     = useState("wedding");
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const selectedPkg   = PACKAGES.find(p => p.id === packageId);
  const hourlyTotal   = hours * HOURLY_RATE;
  const addOnTotal    = addOns.reduce((sum, id) => sum + (ADD_ONS.find(a => a.id === id)?.price || 0), 0);
  const basePrice     = mode === "hourly" ? hourlyTotal : (selectedPkg?.price || 0);
  const grandTotal    = basePrice + addOnTotal;
  const platformFee   = Math.round(grandTotal * 0.05);
  const totalWithFee  = grandTotal + platformFee;

  const toggleGenre  = (id) => setGenres(prev => prev.includes(id)  ? prev.filter(x => x !== id)  : [...prev, id]);
  const toggleAddOn  = (id) => setAddOns(prev  => prev.includes(id)  ? prev.filter(x => x !== id)  : [...prev, id]);

  const handleBook = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setSubmitted(true);
    onBook?.({ mode, hours, packageId, genres, addOns, vibeLink, eventType, total: totalWithFee });
  };

  // ── Submitted ─────────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 16px", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(26,155,108,0.1)", border: `2px solid ${B.success}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎧</div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: B.text }}>DJ Booking Confirmed!</div>
        <div style={{ fontSize: 13, color: B.textMuted, marginTop: 8, lineHeight: 1.6 }}>
          Your booking request has been sent. The DJ will confirm within 2 hours.
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: B.accent, marginTop: 10 }}>
          LKR {totalWithFee.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>
          {mode === "hourly" ? `${hours} hrs · LKR ${HOURLY_RATE.toLocaleString()}/hr` : selectedPkg?.label}
          {addOns.length > 0 ? ` + ${addOns.length} add-on${addOns.length > 1 ? "s" : ""}` : ""}
        </div>
      </div>
      <button
        onClick={() => { setSubmitted(false); setAddOns([]); setGenres([]); setVibeLink(""); }}
        style={{ padding: "11px 28px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: `1.5px solid ${B.border}`, background: B.surface, cursor: "pointer", color: B.text }}
      >← Adjust Booking</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Mode toggle */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Booking Mode</div>
        <div style={{ display: "flex", background: B.bg, borderRadius: 12, padding: 4, gap: 4 }}>
          {[
            { id: "hourly",  label: "⏱️ Hourly Rate" },
            { id: "package", label: "📦 Full Event Package" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: "pointer", transition: "all .15s", border: "none",
                background: mode === m.id ? B.dark : "transparent",
                color: mode === m.id ? "#fff" : B.textMuted,
                boxShadow: mode === m.id ? "0 2px 8px rgba(12,22,40,0.3)" : "none",
              }}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* Hourly rate panel */}
      {mode === "hourly" && (
        <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Duration</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: B.accent }}>
              LKR {hourlyTotal.toLocaleString()}
            </div>
          </div>
          {/* Hour stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <button
              onClick={() => setHours(h => Math.max(1, h - 1))}
              style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", fontSize: 20, fontWeight: 700, color: B.text, display: "flex", alignItems: "center", justifyContent: "center" }}
            >−</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: B.text, lineHeight: 1 }}>{hours}</div>
              <div style={{ fontSize: 12, color: B.textMuted, marginTop: 2 }}>hours</div>
            </div>
            <button
              onClick={() => setHours(h => Math.min(12, h + 1))}
              style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${B.border}`, background: B.bg, cursor: "pointer", fontSize: 20, fontWeight: 700, color: B.text, display: "flex", alignItems: "center", justifyContent: "center" }}
            >+</button>
          </div>
          {/* Hour quick picks */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[2, 3, 4, 5, 6, 8].map(h => (
              <button
                key={h}
                onClick={() => setHours(h)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: hours === h ? B.primary : B.bg,
                  color: hours === h ? "#fff" : B.textMuted,
                  border: `1.5px solid ${hours === h ? B.primary : B.border}`,
                }}
              >{h}h</button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: B.textMuted }}>
            LKR {HOURLY_RATE.toLocaleString()} / hour · Minimum 2 hours
          </div>
        </div>
      )}

      {/* Package panel */}
      {mode === "package" && (
        <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Select Package</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PACKAGES.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setPackageId(pkg.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "14px",
                  borderRadius: 12, cursor: "pointer", textAlign: "left", position: "relative",
                  background: packageId === pkg.id ? "rgba(28,43,75,0.04)" : B.bg,
                  border: `1.5px solid ${packageId === pkg.id ? B.primary : B.border}`,
                }}
              >
                {pkg.popular && (
                  <div style={{ position: "absolute", top: 0, right: 0, background: B.accent, color: B.dark, fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: "0 10px 0 8px", letterSpacing: 0.5 }}>POPULAR</div>
                )}
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{pkg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>{pkg.label}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: packageId === pkg.id ? B.primary : B.textMuted }}>
                      LKR {pkg.price.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: B.accent, fontWeight: 600, marginBottom: 6 }}>{pkg.hours}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {pkg.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={B.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: 11, color: B.textMuted }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event type */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Event Type</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {[["wedding","💒 Wedding"],["birthday","🎂 Birthday"],["corporate","🏢 Corporate"],["party","🎉 Party"],["other","🎪 Other"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setEventType(val)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: eventType === val ? B.primary : B.bg,
                color: eventType === val ? "#fff" : B.textMuted,
                border: `1.5px solid ${eventType === val ? B.primary : B.border}`,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Genre selector */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Music Genres</div>
        <div style={{ fontSize: 12, color: B.textMuted, marginBottom: 10 }}>Choose as many as you like</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              style={{
                padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: genres.includes(g.id) ? "rgba(28,43,75,0.08)" : B.bg,
                color: genres.includes(g.id) ? B.primary : B.textMuted,
                border: `1.5px solid ${genres.includes(g.id) ? B.primary : B.border}`,
              }}
            >{g.label}</button>
          ))}
        </div>
      </div>

      {/* Vibe link input */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <VibeLink value={vibeLink} onChange={setVibeLink} />
      </div>

      {/* Add-ons */}
      <div style={{ background: B.surface, borderRadius: 14, border: `1px solid ${B.border}`, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Add-Ons</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ADD_ONS.map(addon => {
            const active = addOns.includes(addon.id);
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
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#9C7339" : B.textMuted, flexShrink: 0 }}>
                  +LKR {addon.price.toLocaleString()}
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

      {/* Price summary + CTA */}
      <div style={{ background: B.dark, borderRadius: 16, padding: "16px 18px", border: "1.5px solid rgba(212,175,106,0.2)" }}>
        {/* Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            <span>{mode === "hourly" ? `${hours} hrs × LKR ${HOURLY_RATE.toLocaleString()}` : selectedPkg?.label}</span>
            <span>LKR {basePrice.toLocaleString()}</span>
          </div>
          {addOns.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              <span>Add-ons ({addOns.length})</span>
              <span>+LKR {addOnTotal.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            <span>Platform fee (5%)</span>
            <span>LKR {platformFee.toLocaleString()}</span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Total</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: B.accent }}>
                LKR {totalWithFee.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Escrow protected</div>
            </div>
            <button
              onClick={handleBook}
              disabled={loading}
              style={{
                padding: "13px 22px", borderRadius: 12, fontWeight: 700, fontSize: 14,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: B.accent, color: B.dark,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Booking…" : "Book DJ 🎧"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
