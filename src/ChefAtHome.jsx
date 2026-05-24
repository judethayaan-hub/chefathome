import { useState, useEffect, useRef, createContext, useContext } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

// ─── Supabase Client ──────────────────────────────────────────────────────────
// Replace these with your actual Supabase project values from https://app.supabase.com
// Settings → API → Project URL and anon/public key
const SUPABASE_URL = "https://fhvwafasykldkuaqrelz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YQEb39B1Xxp5qdSYX5ZeAw_cxPQlyyJ";

// Minimal Supabase JS client (no npm required — works in browser/React)
const supabaseClient = (() => {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const request = async (path, method = "GET", body = null, extraHeaders = {}) => {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: { ...headers, ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  };

  return {
    auth: {
      // Sign up with email + password (Supabase sends a confirmation email automatically)
      signUp: (email, password, metadata = {}) =>
        request("/auth/v1/signup", "POST", { email, password, data: metadata }),

      // Sign in with email + password
      signIn: (email, password) =>
        request("/auth/v1/token?grant_type=password", "POST", { email, password }),

      // OAuth redirect — opens Google sign-in page
      signInWithGoogle: () => {
        const redirectTo = encodeURIComponent(window.location.href);
        window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
      },

      // Sign out
      signOut: (accessToken) =>
        request("/auth/v1/logout", "POST", null, { Authorization: `Bearer ${accessToken}` }),

      // Get user from access token
      getUser: (accessToken) =>
        request("/auth/v1/user", "GET", null, { Authorization: `Bearer ${accessToken}` }),

      // Send password reset email
      resetPassword: (email) =>
        request("/auth/v1/recover", "POST", { email }),

      // Exchange OAuth code for session (handles ?code= in URL after Google redirect)
      exchangeCodeForSession: async (code) => {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
          method: "POST",
          headers,
          body: JSON.stringify({ auth_code: code }),
        });
        return res.json();
      },
    },

    // Database helpers
    from: (table) => ({
      select: (cols = "*") => ({
        eq: (col, val) =>
          request(`/rest/v1/${table}?select=${cols}&${col}=eq.${val}`),
        all: () =>
          request(`/rest/v1/${table}?select=${cols}`),
      }),
      insert: (row) =>
        request(`/rest/v1/${table}`, "POST", row, { Prefer: "return=representation" }),
      update: (col, val, data) =>
        request(`/rest/v1/${table}?${col}=eq.${val}`, "PATCH", data, { Prefer: "return=representation" }),
    }),

    // Send custom email via Supabase Edge Functions (optional — set up edge fn "send-login-alert")
    functions: {
      invoke: (fnName, body) =>
        request(`/functions/v1/${fnName}`, "POST", body),
    },
  };
})();

// Session storage helpers
const SESSION_KEY = "chefathome_session";
const saveSession = (session) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
};
const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
};

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount: restore session from localStorage and handle OAuth callback
  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback — Supabase redirects back with ?code=
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        try {
          const data = await supabaseClient.auth.exchangeCodeForSession(code);
          if (data.access_token) {
            saveSession(data);
            setSession(data);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            const userData = await supabaseClient.auth.getUser(data.access_token);
            setUser(formatUser(userData));
            // Send login alert email for OAuth logins
            await sendLoginAlert(userData, data.access_token);
          }
        } catch (e) { console.error("OAuth exchange failed", e); }
        setAuthLoading(false);
        return;
      }

      // Restore from storage
      const stored = loadSession();
      if (stored?.access_token) {
        try {
          const userData = await supabaseClient.auth.getUser(stored.access_token);
          setSession(stored);
          setUser(formatUser(userData));
        } catch { saveSession(null); }
      }
      setAuthLoading(false);
    };
    init();
  }, []);

  const formatUser = (userData) => ({
    id: userData.id,
    email: userData.email,
    name: userData.user_metadata?.full_name ||
          userData.user_metadata?.name ||
          userData.email?.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    avatar: userData.user_metadata?.avatar_url || null,
    role: userData.user_metadata?.role || "customer",
    provider: userData.app_metadata?.provider || "email",
  });

  const sendLoginAlert = async (userData, accessToken) => {
    // Option 1: Via Supabase Edge Function (set up separately — see README in the file)
    // Option 2: Supabase already sends auth emails for signup (enable in Dashboard → Auth → Email Templates)
    try {
      await supabaseClient.functions.invoke("send-login-alert", {
        email: userData.email,
        name: userData.user_metadata?.full_name || userData.email,
        provider: userData.app_metadata?.provider || "email",
        timestamp: new Date().toISOString(),
        ip: "N/A", // Edge fn can detect IP server-side
      });
    } catch (e) {
      // Edge fn not set up yet — that's fine, login still works
      console.info("Login alert edge function not configured (optional):", e?.message);
    }
  };

  const signIn = async (email, password) => {
    const data = await supabaseClient.auth.signIn(email, password);
    if (!data.access_token) throw new Error(data.error_description || "Login failed");
    saveSession(data);
    setSession(data);
    const userData = await supabaseClient.auth.getUser(data.access_token);
    const formatted = formatUser(userData);
    setUser(formatted);
    // Send login alert
    await sendLoginAlert(userData, data.access_token).catch(() => {});
    return formatted;
  };

  const signUp = async (email, password, name, role) => {
    const data = await supabaseClient.auth.signUp(email, password, { full_name: name, role });
    if (data.error) throw new Error(data.error.message || "Signup failed");
    // After signup, Supabase sends a confirmation email automatically (configure in Dashboard)
    // If email confirmation is disabled, auto-login
    if (data.access_token) {
      saveSession(data);
      setSession(data);
      const userData = await supabaseClient.auth.getUser(data.access_token);
      setUser(formatUser(userData));
    }
    return data;
  };

  const signInWithGoogle = () => supabaseClient.auth.signInWithGoogle();

  const signOut = async () => {
    if (session?.access_token) {
      await supabaseClient.auth.signOut(session.access_token).catch(() => {});
    }
    saveSession(null);
    setSession(null);
    setUser(null);
  };

  const resetPassword = (email) => supabaseClient.auth.resetPassword(email);

  return (
    <AuthContext.Provider value={{ session, user, authLoading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

const COLORS = {
  primary: "#E8743B",
  primaryDark: "#C95E28",
  primaryLight: "#FFF1EB",
  dark: "#1C1917",
  darkNav: "#111827",
  text: "#292524",
  textMuted: "#78716C",
  textLight: "#A8A29E",
  surface: "#FAFAF9",
  white: "#FFFFFF",
  border: "#E7E5E4",
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  info: "#2563EB",
  infoLight: "#DBEAFE",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  gold: "#F59E0B",
};

const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', 'Segoe UI', sans-serif",
};

const chefs = [
  { id: 1, name: "Chef Sampath Perera", type: "premium", rating: 4.9, reviews: 120, experience: "8+ Years", location: "Colombo, Sri Lanka", specialties: ["Sri Lankan", "Indian", "BBQ", "Seafood", "Italian"], price: 45000, image: "SP", dinners: 1000, badge: "Top Rated", bio: "Former head chef at Cinnamon Grand Colombo with expertise in fine dining and premium private events.", menus: ["Seafood Experience", "Romantic Dinner", "Italian Night", "Luxury BBQ", "Sri Lankan Feast"] },
  { id: 2, name: "Chef Tharindu Silva", type: "premium", rating: 4.8, reviews: 98, experience: "6 Years", location: "Mount Lavinia", specialties: ["Seafood", "Continental", "Fusion"], price: 35000, image: "TS", dinners: 650, badge: "Premium", bio: "Specialist in coastal cuisine with a creative twist. Trained at a luxury resort in Maldives.", menus: ["Fresh Seafood Platter", "Coastal BBQ", "Fusion Tasting Menu"] },
  { id: 3, name: "Chef Danushka Fernando", type: "premium", rating: 4.9, reviews: 88, experience: "5 Years", location: "Rajagiriya", specialties: ["Italian", "Mediterranean", "Desserts"], price: 32000, image: "DF", dinners: 480, badge: "Premium", bio: "Italian cuisine expert trained in Florence. Creates authentic pasta, risotto and tiramisu experiences.", menus: ["Italian Night", "Mediterranean Feast", "Dessert Experience"] },
  { id: 4, name: "Chef Nimesh Bandara", type: "local", rating: 4.7, reviews: 76, experience: "4 Years", location: "Battaramulla", specialties: ["Biriyani", "Sri Lankan", "BBQ"], price: 12000, image: "NB", dinners: 380, badge: "Verified", bio: "Master of traditional Sri Lankan cuisine and authentic biriyani. Perfect for family gatherings.", menus: ["Biriyani Feast", "Sri Lankan Home Food", "BBQ Night"] },
  { id: 5, name: "Chef Priya Wickramasinghe", type: "local", rating: 4.6, reviews: 54, experience: "3 Years", location: "Nugegoda", specialties: ["Sri Lankan", "Vegetarian", "South Indian"], price: 8000, image: "PW", dinners: 220, badge: "Verified", bio: "Passionate about traditional recipes passed down through generations. Specializes in vegetarian and healthy options.", menus: ["Traditional Rice & Curry", "South Indian Feast", "Vegetarian Spread"] },
  { id: 6, name: "Chef Kasun Rathnayake", type: "local", rating: 4.8, reviews: 61, experience: "4 Years", location: "Nawala", specialties: ["BBQ", "Burgers", "Grills"], price: 15000, image: "KR", dinners: 290, badge: "Verified", bio: "BBQ and grill specialist who transforms backyards into restaurant-quality dining experiences.", menus: ["BBQ Party", "Grill Night", "Family BBQ"] },
];

const experiences = [
  { name: "Biriyani Feast", price: 18000, rating: 4.9, count: 120, chef: "Chef Nimesh", type: "local", emoji: "🍛" },
  { name: "Romantic Dinner", price: 45000, rating: 4.8, count: 89, chef: "Chef Sampath", type: "premium", emoji: "🕯️" },
  { name: "BBQ Party", price: 25000, rating: 4.7, count: 84, chef: "Chef Kasun", type: "local", emoji: "🔥" },
  { name: "Family Gathering", price: 25000, rating: 4.9, count: 91, chef: "Chef Tharindu", type: "premium", emoji: "🍽️" },
];

const bookings = [
  { id: "B001", customer: "Nimal Perera", experience: "Biriyani Feast (All Inclusive)", chef: "Chef Sampath", date: "Today, 7:00 PM", location: "Nawala, Colombo 05", amount: 25000, status: "confirmed", guests: 4 },
  { id: "B002", customer: "Aisha Fernando", experience: "Romantic Dinner (Cook-at-Home)", chef: "Chef Tharindu", date: "Tomorrow, 6:30 PM", location: "Rajagiriya, Colombo 07", amount: 12000, status: "pending", guests: 2 },
  { id: "B003", customer: "David Smith", experience: "BBQ Party (All Inclusive)", chef: "Chef Danushka", date: "May 25, 2026", location: "Mount Lavinia", amount: 30000, status: "confirmed", guests: 8 },
  { id: "B004", customer: "Chamari Silva", experience: "Family Gathering (All Inclusive)", chef: "Chef Nimesh", date: "May 26, 2026", location: "Battaramulla", amount: 28000, status: "confirmed", guests: 10 },
];

const revenueData = [
  { month: "Jan", revenue: 320000, bookings: 18 },
  { month: "Feb", revenue: 480000, bookings: 24 },
  { month: "Mar", revenue: 560000, bookings: 31 },
  { month: "Apr", revenue: 720000, bookings: 42 },
  { month: "May", revenue: 1250000, bookings: 128 },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${FONTS.body}; color: ${COLORS.text}; background: ${COLORS.surface}; }
  button { cursor: pointer; font-family: ${FONTS.body}; border: none; }
  input, select, textarea { font-family: ${FONTS.body}; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; }
  ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
  .nav-link { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; padding: 6px 0; cursor: pointer; }
  .nav-link:hover { color: white; }
  .btn-primary { background: ${COLORS.primary}; color: white; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: all 0.2s; border: none; }
  .btn-primary:hover { background: ${COLORS.primaryDark}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(232,116,59,0.4); }
  .btn-outline { background: transparent; color: ${COLORS.primary}; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 2px solid ${COLORS.primary}; transition: all 0.2s; }
  .btn-outline:hover { background: ${COLORS.primary}; color: white; }
  .btn-ghost { background: rgba(255,255,255,0.15); color: white; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: all 0.2s; border: none; }
  .btn-ghost:hover { background: rgba(255,255,255,0.25); }
  .card { background: white; border-radius: 16px; border: 1px solid ${COLORS.border}; overflow: hidden; transition: all 0.3s; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
  .badge-premium { background: linear-gradient(135deg, #B45309, #D97706); color: white; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
  .badge-local { background: ${COLORS.successLight}; color: ${COLORS.success}; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-verified { background: ${COLORS.infoLight}; color: ${COLORS.info}; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .star { color: ${COLORS.gold}; }
  .input { width: 100%; padding: 10px 14px; border: 1.5px solid ${COLORS.border}; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s; background: white; }
  .input:focus { border-color: ${COLORS.primary}; }
  .label { font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; margin-bottom: 6px; display: block; letter-spacing: 0.3px; }
  .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 8px; color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .sidebar-link:hover { background: rgba(255,255,255,0.1); color: white; }
  .sidebar-link.active { background: ${COLORS.primary}; color: white; }
  .status-confirmed { background: ${COLORS.successLight}; color: ${COLORS.success}; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-pending { background: ${COLORS.warningLight}; color: ${COLORS.warning}; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-cancelled { background: ${COLORS.dangerLight}; color: ${COLORS.danger}; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .tab { padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: transparent; color: ${COLORS.textMuted}; }
  .tab.active { background: ${COLORS.primary}; color: white; }
  .tab:hover:not(.active) { background: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.5s ease forwards; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal { background: white; border-radius: 20px; padding: 36px; width: 440px; max-width: 95vw; position: relative; animation: fadeUp 0.3s ease; max-height: 90vh; overflow-y: auto; }
  @media (max-width: 768px) { 
    .hide-mobile { display: none !important; }
    .show-mobile { display: flex !important; }
    .mobile-stack { flex-direction: column !important; }
    .mobile-full { width: 100% !important; }
    .mobile-padding { padding: 16px !important; }
    .mobile-text-sm { font-size: 14px !important; }
    .grid-mobile-1 { grid-template-columns: 1fr !important; }
    .hero-grid { grid-template-columns: 1fr !important; padding: 40px 20px !important; min-height: auto !important; }
    .modal { width: 95vw !important; padding: 24px !important; }
    .booking-grid { grid-template-columns: 1fr !important; }
    .chef-profile-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .features-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (min-width: 769px) {
    .show-mobile { display: none !important; }
  }
  .ai-bubble { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 20px; color: white; border: 1px solid rgba(232,116,59,0.3); }
  .typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.primary}; margin: 0 2px; animation: pulse 1s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
`;

// ─── Utility Components ────────────────────────────────────────────────────

function Avatar({ initials, size = 48, color = COLORS.primary }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.35, fontFamily: FONTS.body, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Star({ count = 5, value = 5 }) {
  return (
    <span>{Array.from({ length: count }, (_, i) => <span key={i} className="star">{i < Math.floor(value) ? "★" : "☆"}</span>)}</span>
  );
}

function Badge({ type }) {
  const map = { premium: "badge-premium", local: "badge-local", verified: "badge-verified", "Top Rated": "badge-premium", Premium: "badge-premium", Verified: "badge-verified" };
  return <span className={map[type] || "badge-local"}>{type}</span>;
}

function StatusBadge({ status }) {
  return <span className={`status-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function MetricCard({ label, value, sub, color = COLORS.primary }) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "20px 24px" }}>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: FONTS.heading }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.success, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── AI Menu Suggestion Feature ────────────────────────────────────────────

function AIMenuAssistant() {
  const [occasion, setOccasion] = useState("");
  const [guests, setGuests] = useState("4");
  const [budget, setBudget] = useState("premium");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSuggestion = async () => {
    if (!occasion) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a private dining consultant for ChefAtHome, Sri Lanka's premier private chef booking platform. 
A customer needs a menu recommendation.

Occasion: ${occasion}
Guests: ${guests} people
Budget tier: ${budget === "premium" ? "Premium (LKR 30,000–100,000+)" : "Budget (LKR 5,000–25,000)"}

Respond ONLY with a JSON object, no preamble, no markdown, exactly this structure:
{
  "menuName": "short catchy name",
  "chefType": "Premium Chef" or "Local Chef",
  "estimatedPrice": "LKR XX,XXX",
  "packageType": "All Inclusive" or "Cook-at-Home",
  "courses": ["Course 1", "Course 2", "Course 3", "Course 4"],
  "chefTip": "one sentence tip from the chef",
  "ambiance": "brief ambiance description"
}`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch (e) {
      setResult({ menuName: "Sri Lankan Feast", chefType: "Premium Chef", estimatedPrice: "LKR 45,000", packageType: "All Inclusive", courses: ["Pol Roti with Seeni Sambol", "Fresh Lagoon Prawns Curry", "Lamb Biryani with Raita", "Watalappan Dessert"], chefTip: "Book at least 48 hours in advance for freshest ingredients.", ambiance: "Candlelit home dining with elegant table setup" });
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "white", borderRadius: 20, border: `1px solid ${COLORS.border}`, padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #1e293b, #E8743B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✨</div>
        <div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700 }}>AI Menu Planner</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Get a personalized menu recommendation for your occasion</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
        <div>
          <label className="label">What's the occasion?</label>
          <input className="input" placeholder="e.g. Romantic anniversary dinner, Birthday party, Corporate lunch..." value={occasion} onChange={e => setOccasion(e.target.value)} onKeyDown={e => e.key === "Enter" && getSuggestion()} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="label">Number of Guests</label>
            <select className="input" value={guests} onChange={e => setGuests(e.target.value)}>
              {["2","4","6","8","10","15","20+"].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget Tier</label>
            <select className="input" value={budget} onChange={e => setBudget(e.target.value)}>
              <option value="budget">Budget (LKR 5K–25K)</option>
              <option value="premium">Premium (LKR 30K–100K+)</option>
            </select>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={getSuggestion} disabled={loading || !occasion}>
        {loading ? "✨ Crafting your perfect menu..." : "✨ Get AI Menu Recommendation"}
      </button>

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 12 }}>Our AI is crafting the perfect menu for you...</div>
        </div>
      )}

      {result && !loading && (
        <div className="fade-up" style={{ marginTop: 24 }}>
          <div className="ai-bubble">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: FONTS.heading, fontSize: 22, color: "white", marginBottom: 4 }}>{result.menuName}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{result.ambiance}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONTS.heading, fontSize: 20, color: COLORS.primary, fontWeight: 700 }}>{result.estimatedPrice}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{result.packageType}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {(result.courses || []).map((course, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{course}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(232,116,59,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(232,116,59,0.3)" }}>
              <span style={{ color: COLORS.primary, fontWeight: 600, fontSize: 13 }}>👨‍🍳 Chef's Tip: </span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{result.chefTip}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                <span style={{ color: COLORS.gold }}>✨ {result.chefType}</span> · {result.packageType}
              </div>
              <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Book Now →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({ page, setPage, user, setUser, setShowAuth }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const SUPER_ADMIN_EMAIL = "judethayaan@gmail.com";
  const isAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === "admin";
  const isChef = user?.role === "chef";

  return (
    <nav style={{ background: COLORS.darkNav, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(0,0,0,0.2)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        {/* Logo */}
        <div onClick={() => { setPage("home"); setMobileOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, color: COLORS.primary }}>🍽️</span>
          <span style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 20, color: "white" }}>Chef<span style={{ color: COLORS.primary }}>at</span>Home</span>
        </div>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[["home","Home"],["chefs","Chefs"],["experiences","Experiences"],["pricing","Pricing"],["ai-menu","✨ AI Menu"]].map(([p, label]) => (
            <span key={p} className="nav-link" onClick={() => setPage(p)} style={{ color: page === p ? COLORS.primary : undefined }}>{label}</span>
          ))}
          <span className="nav-link" onClick={() => setPage("about")}>About</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              <button className="btn-primary" style={{ fontSize: 13, padding: "7px 14px" }} onClick={() => setPage(isAdmin ? "admin" : isChef ? "chef-panel" : "dashboard")}>
                {isAdmin ? "⚙️ Admin" : isChef ? "👨‍🍳 Panel" : "📋 Dashboard"}
              </button>
              <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar initials={user.name?.split(" ").map(n => n[0]).join("").slice(0,2) || "U"} size={34} />
                <button onClick={() => setUser(null)} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", padding: "6px 10px", borderRadius: 6, fontSize: 12, border: "none" }}>Logout</button>
              </div>
            </>
          ) : (
            <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setShowAuth("login")}>Log In</button>
          )}
          {/* Mobile hamburger */}
          <button className="show-mobile" onClick={() => setMobileOpen(o => !o)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "8px 10px", borderRadius: 6, fontSize: 18 }}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div style={{ background: "#1a2332", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px 20px" }}>
          {[["home","🏠 Home"],["chefs","👨‍🍳 Chefs"],["experiences","🍽️ Experiences"],["pricing","💰 Pricing"],["ai-menu","✨ AI Menu"],["about","ℹ️ About"]].map(([p, label]) => (
            <div key={p} onClick={() => { setPage(p); setMobileOpen(false); }} style={{ padding: "12px 0", color: page === p ? COLORS.primary : "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              {label}
            </div>
          ))}
          {user && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, padding: "10px" }} onClick={() => { setPage(isAdmin ? "admin" : isChef ? "chef-panel" : "dashboard"); setMobileOpen(false); }}>
                {isAdmin ? "⚙️ Admin Panel" : isChef ? "👨‍🍳 My Panel" : "📋 Dashboard"}
              </button>
              <button onClick={() => { setUser(null); setMobileOpen(false); }} style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "10px 16px", borderRadius: 8, border: "none", fontSize: 13 }}>Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({ setPage }) {
  return (
    <section style={{ background: `linear-gradient(135deg, ${COLORS.dark} 0%, #2D1810 50%, #3D1F0D 100%)`, minHeight: "88vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 50%, rgba(232,116,59,0.15) 0%, transparent 60%)" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }} className="hero-grid">
        <div className="fade-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(232,116,59,0.2)", border: "1px solid rgba(232,116,59,0.4)", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
            <span style={{ color: COLORS.primary, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>✦ PREMIUM PRIVATE DINING · SRI LANKA</span>
          </div>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: "clamp(28px,5vw,54px)", fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 16 }}>
            Book a Private Chef for <em style={{ color: COLORS.primary, fontStyle: "italic" }}>Unforgettable</em> Home Dining
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            Restaurant-quality meals at home, prepared by verified professional chefs across Sri Lanka.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            <button className="btn-primary" style={{ padding: "13px 26px", fontSize: 15 }} onClick={() => setPage("chefs")}>Book a Chef →</button>
            <button className="btn-ghost" style={{ padding: "13px 26px", fontSize: 15 }} onClick={() => setPage("ai-menu")}>✨ AI Menu Planner</button>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[["✓ Verified Chefs","Background-checked"],["🛡️ Hygienic","Certified standards"],["⭐ 4.8/5","1,000+ reviews"]].map(([title, sub]) => (
              <div key={title}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{title}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hide-mobile" style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 380, height: 440, borderRadius: 24, background: "linear-gradient(135deg, #3D2010, #5C3020)", border: "1px solid rgba(232,116,59,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, padding: 36 }}>
              <div style={{ fontSize: 72 }}>👨‍🍳</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONTS.heading, fontSize: 20, color: "white", marginBottom: 6 }}>Premium Private Chef</div>
                <div style={{ color: COLORS.primary, fontSize: 14, marginBottom: 14 }}>⭐ 4.9 · Verified · 8+ Years</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {["Sri Lankan", "Seafood", "Italian"].map(s => (
                    <span key={s} style={{ background: "rgba(232,116,59,0.2)", color: COLORS.primary, padding: "4px 10px", borderRadius: 20, fontSize: 12, border: "1px solid rgba(232,116,59,0.3)" }}>{s}</span>
                  ))}
                </div>
              </div>
              <button className="btn-primary" style={{ width: "100%", padding: "12px" }} onClick={() => setPage("chefs")}>Browse Chefs</button>
            </div>
            <div style={{ position: "absolute", top: -16, right: -16, background: COLORS.primary, borderRadius: 12, padding: "10px 14px", color: "white", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(232,116,59,0.4)" }}>🎉 Just booked!</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesRow() {
  return (
    <div style={{ background: COLORS.dark, padding: "28px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {[["✓","Verified Chefs","Background-checked & experienced"],["🥗","Premium Ingredients","Ingredients powered by Keells"],["🍽️","Custom Experiences","Personalized menus for any occasion"],["🧹","Hassle-Free","We cook, serve & clean up for you"]].map(([icon,title,desc]) => (
          <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 0" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{title}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PopularExperiences({ setPage }) {
  return (
    <section style={{ padding: "80px 24px", background: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <div style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>✦ EXPERIENCES</div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 36, fontWeight: 700 }}>Popular Experiences</h2>
          </div>
          <button className="btn-outline" style={{ fontSize: 13 }} onClick={() => setPage("experiences")}>View All</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {experiences.map(exp => (
            <div key={exp.name} className="card" style={{ cursor: "pointer" }} onClick={() => setPage("chefs")}>
              <div style={{ height: 160, background: `linear-gradient(135deg, ${COLORS.dark}22, ${COLORS.primary}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{exp.emoji}</div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>by {exp.chef}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><Star value={exp.rating} /><span style={{ fontSize: 12, color: COLORS.textMuted }}> ({exp.count})</span></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>LKR {exp.price.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section style={{ padding: "80px 24px", background: COLORS.surface }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>✦ PROCESS</div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 36, fontWeight: 700 }}>How It Works</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {[["🔍","Choose Experience","Select a chef and menu you love"],["📦","Select Package","Choose All Inclusive or Cook-at-Home"],["✅","Confirm Booking","Secure payment & booking confirmation"],["🍽️","Enjoy Your Meal","Chef cooks, serves & cleans up"]].map((s, i) => (
            <div key={s[1]} style={{ textAlign: "center", padding: "28px 20px", background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, position: "relative" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>{s[0]}</div>
              <div style={{ position: "absolute", top: 16, left: 16, width: 24, height: 24, borderRadius: "50%", background: COLORS.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{s[1]}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>{s[2]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsRow() {
  return (
    <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, #2D1810)`, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }}>
        {[["500+","Happy Customers"],["50+","Professional Chefs"],["1000+","Completed Bookings"],["4.9/5","Customer Rating"]].map(([val, label]) => (
          <div key={label}>
            <div style={{ fontFamily: FONTS.heading, fontSize: 36, fontWeight: 700, color: COLORS.primary }}>{val}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustSection() {
  return (
    <div style={{ background: COLORS.dark, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16, textAlign: "center" }}>
        {[["🛡️","Verified & Trusted","All chefs are background checked."],["🔒","Secure Payments","Multiple secure payment options."],["⭐","Real Reviews","Genuine ratings you can trust."],["🕐","24/7 Support","We're here to help every step."],["🧼","Hygienic & Safe","Strict hygiene standards enforced."],["🏆","Best Quality","Premium ingredients guaranteed."]].map(([icon,title,desc]) => (
          <div key={title}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer({ setPage }) {
  return (
    <footer style={{ background: COLORS.dark, color: "rgba(255,255,255,0.6)", padding: "48px 24px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: FONTS.heading, fontSize: 22, color: "white", marginBottom: 12 }}>Chef<span style={{ color: COLORS.primary }}>at</span>Home</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>Restaurant-quality private dining at home with trusted ingredients. Sri Lanka's premier private chef booking platform.</p>
          </div>
          {[["Platform",["Browse Chefs","Experiences","Pricing","AI Menu Planner"]],["Support",["Help Centre","FAQs","Refund Policy","WhatsApp Chat"]],["Legal",["Terms & Conditions","Privacy Policy","Chef Policy","Food Safety"]]].map(([title, links]) => (
            <div key={title}>
              <div style={{ color: "white", fontWeight: 600, marginBottom: 14, fontSize: 14 }}>{title}</div>
              {links.map(l => <div key={l} style={{ fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span>© 2026 ChefAtHome. All rights reserved.</span>
          <span>Made with ❤️ in Sri Lanka 🇱🇰</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Chefs Page ───────────────────────────────────────────────────────────────

function ChefCard({ chef, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, #2D1810)`, height: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: 20, position: "relative" }}>
        <Avatar initials={chef.image} size={72} color={chef.type === "premium" ? "#B45309" : COLORS.primary} />
        <div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 18, color: "white", fontWeight: 600 }}>{chef.name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>{chef.location}</div>
          <div style={{ marginTop: 8 }}><Badge type={chef.badge} /></div>
        </div>
        {chef.type === "premium" && <div style={{ position: "absolute", top: 12, right: 12, background: COLORS.gold, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, color: "#78350F" }}>PREMIUM</div>}
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div><Star value={chef.rating} /><span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{chef.rating}</span><span style={{ fontSize: 13, color: COLORS.textMuted }}> ({chef.reviews})</span></div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{chef.experience}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {chef.specialties.slice(0, 3).map(s => <span key={s} style={{ background: COLORS.primaryLight, color: COLORS.primary, padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{s}</span>)}
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Starting from</span>
            <div style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.primary }}>LKR {chef.price.toLocaleString()}</div>
          </div>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Book Chef</button>
        </div>
      </div>
    </div>
  );
}

function ChefsPage({ setPage, setSelectedChef }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = chefs.filter(c => (filter === "all" || c.type === filter) && (c.name.toLowerCase().includes(search.toLowerCase()) || c.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))));
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>✦ OUR CHEFS</div>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 40, fontWeight: 700, marginBottom: 12 }}>Find Your Perfect Chef</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 16 }}>Browse our verified chefs and book your ideal private dining experience</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input className="input" placeholder="Search chefs or cuisines..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {["all","premium","local"].map(f => <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
        {filtered.map(chef => <ChefCard key={chef.id} chef={chef} onClick={() => { setSelectedChef(chef); setPage("chef-profile"); }} />)}
      </div>
    </div>
  );
}

// ─── Chef Profile ─────────────────────────────────────────────────────────────

function ChefProfile({ chef, setPage, setBookingChef }) {
  const [activeTab, setActiveTab] = useState("menu");
  if (!chef) return <div style={{ padding: 40, textAlign: "center" }}>Chef not found.</div>;
  const icons = ["🍛","🦞","🔥","🍝","🍜","🥘"];
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <button onClick={() => setPage("chefs")} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 14, marginBottom: 24, cursor: "pointer" }}>← Back to Chefs</button>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 32 }} className="chef-profile-grid">
        <div>
          <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden", position: "sticky", top: 80 }}>
            <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, #2D1810)`, padding: "36px 24px", textAlign: "center" }}>
              <Avatar initials={chef.image} size={88} color={chef.type === "premium" ? "#B45309" : COLORS.primary} />
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: "white", marginTop: 16, marginBottom: 4 }}>{chef.name}</h2>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 12 }}>📍 {chef.location}</div>
              <Badge type={chef.badge} />
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ textAlign: "center", padding: 12, background: COLORS.surface, borderRadius: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>{chef.dinners}+</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Dinners Cooked</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: COLORS.surface, borderRadius: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>98%</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Positive Reviews</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                {[["Rating", <><Star value={chef.rating} /> {chef.rating}</>],["Experience", chef.experience],["Specialties", chef.specialties.slice(0,2).join(", ")]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 13, color: COLORS.textMuted }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ width: "100%", padding: "14px", marginTop: 16, fontSize: 15 }} onClick={() => { setBookingChef(chef); setPage("booking"); }}>Book Chef</button>
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {["menu","reviews","photos"].map(t => <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
          </div>
          {activeTab === "menu" && (
            <div>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 6 }}>About</h3>
              <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 28 }}>{chef.bio}</p>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 22, marginBottom: 16 }}>Menu Highlights</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
                {chef.menus.map((menu, i) => (
                  <div key={menu} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{icons[i % icons.length]}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{menu}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 20, background: COLORS.primaryLight, borderRadius: 12, border: `1px solid rgba(232,116,59,0.3)` }}>
                <h4 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 8 }}>Select Your Package</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[{ name: "All Inclusive Package", tag: "Ingredients Powered by Keells", price: "LKR 25,000", items: ["Chef brings all ingredients","Live cooking","Serving","Cleanup","Premium experience"], color: COLORS.primary },
                    { name: "Cook-at-Home Service", tag: "You Provide Ingredients", price: "LKR 8,000", items: ["Chef service","Live cooking","Menu guidance","Basic cleanup"], color: COLORS.success }].map(pkg => (
                    <div key={pkg.name} style={{ background: "white", borderRadius: 12, border: `2px solid ${pkg.color}`, padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: pkg.color }}>{pkg.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{pkg.tag}</div>
                      {pkg.items.map(item => <div key={item} style={{ fontSize: 13, marginBottom: 4 }}>✓ {item}</div>)}
                      <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: pkg.color, marginTop: 14, marginBottom: 12 }}>{pkg.price}</div>
                      <button style={{ width: "100%", background: pkg.color, color: "white", padding: "10px", borderRadius: 8, fontWeight: 600, fontSize: 13, border: "none" }} onClick={() => { setBookingChef(chef); setPage("booking"); }}>Select Package</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === "reviews" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, padding: 24, background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 48, fontWeight: 700, color: COLORS.primary }}>{chef.rating}</div>
                  <Star value={chef.rating} />
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{chef.reviews} reviews</div>
                </div>
                <div style={{ flex: 1, marginLeft: 20 }}>
                  {[5,4,3,2,1].map(n => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, width: 16 }}>{n}</span>
                      <span className="star">★</span>
                      <div style={{ flex: 1, background: COLORS.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${n===5?75:n===4?18:n===3?5:2}%`, background: COLORS.gold, height: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {[["Nimal P.","Amazing experience! Professional, punctual, and absolutely delicious. Highly recommend!",5,0],["Sarah M.","Booked for our anniversary — the romantic setup and food quality were outstanding!",5,1],["Aisha K.","Great service, tasty food, chef was friendly and cleanup was perfect. Booking again!",4,2]].map(([name,text,rating,i]) => (
                <div key={name} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <Avatar initials={name.split(" ").map(n=>n[0]).join("")} size={36} color={["#E8743B","#16A34A","#2563EB"][i]} />
                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div><Star value={rating} /></div>
                  </div>
                  <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6 }}>{text}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "photos" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {["🍛 Chicken Biriyani","🦞 Seafood Platter","🔥 BBQ Mix Grill","🍰 Chocolate Lava","🥘 Rice & Curry","🍝 Pasta Night"].map(item => (
                <div key={item} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ fontSize: 36 }}>{item.split(" ")[0]}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", padding: "0 8px" }}>{item.slice(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Booking Page ─────────────────────────────────────────────────────────────

function BookingPage({ chef, setPage, user, setShowAuth }) {
  const [step, setStep] = useState(1);
  const [pkg, setPkg] = useState("all-inclusive");
  const [guests, setGuests] = useState(4);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [special, setSpecial] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [done, setDone] = useState(false);

  const price = pkg === "all-inclusive" ? 25000 : 8000;
  const total = price + (guests > 4 ? (guests - 4) * 2000 : 0);

  if (!user) return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
      <h2 style={{ fontFamily: FONTS.heading, fontSize: 28, marginBottom: 12 }}>Login Required</h2>
      <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>Please login or sign up to complete your booking.</p>
      <button className="btn-primary" style={{ padding: "12px 28px" }} onClick={() => setShowAuth("login")}>Login to Continue</button>
    </div>
  );

  if (done) return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 40, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: COLORS.successLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px" }}>✅</div>
      <h2 style={{ fontFamily: FONTS.heading, fontSize: 32, marginBottom: 12 }}>Booking Confirmed!</h2>
      <p style={{ color: COLORS.textMuted, marginBottom: 8 }}>Your booking with <strong>{chef?.name}</strong> has been confirmed.</p>
      <p style={{ color: COLORS.textMuted, marginBottom: 32 }}>You'll receive a confirmation via email and WhatsApp shortly.</p>
      <div style={{ background: COLORS.successLight, borderRadius: 12, padding: 24, marginBottom: 28, textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["Experience", pkg === "all-inclusive" ? "All Inclusive" : "Cook-at-Home"],["Date", date || "Not set"],["Time", time],["Guests", guests],["Location", location || "To be confirmed"],["Total", `LKR ${total.toLocaleString()}`]].map(([k, v]) => (
            <div key={k}><div style={{ fontSize: 12, color: COLORS.textMuted }}>{k}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div></div>
          ))}
        </div>
      </div>
      <button className="btn-primary" style={{ padding: "12px 28px" }} onClick={() => { setPage("dashboard"); setDone(false); }}>Go to Dashboard</button>
    </div>
  );

  const steps = ["Package","Details","Payment"];
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <button onClick={() => step === 1 ? setPage("chef-profile") : setStep(s => s - 1)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 14, marginBottom: 24, cursor: "pointer" }}>← Back</button>
      <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 40 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: step > i ? COLORS.success : step === i+1 ? COLORS.primary : COLORS.border, color: step > i || step === i+1 ? "white" : COLORS.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{step > i ? "✓" : i+1}</div>
              <span style={{ fontSize: 12, color: step === i+1 ? COLORS.primary : COLORS.textMuted, fontWeight: step === i+1 ? 600 : 400 }}>{s}</span>
            </div>
            {i < steps.length-1 && <div style={{ width: 80, height: 2, background: step > i+1 ? COLORS.success : COLORS.border, margin: "0 8px", marginBottom: 18 }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }} className="booking-grid">
        <div>
          {step === 1 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 24 }}>Select Your Package</h2>
              {[{ id: "all-inclusive", name: "All Inclusive Package", tag: "Ingredients Powered by Keells", price: 25000, items: ["Chef brings all ingredients","Live cooking","Serving & Cleanup","Premium experience","Table setup"], color: COLORS.primary },
                { id: "cook-at-home", name: "Cook-at-Home Service", tag: "You Provide Ingredients", price: 8000, items: ["Chef service only","Live cooking","Menu guidance","Basic cleanup"], color: COLORS.success }].map(p => (
                <div key={p.id} onClick={() => setPkg(p.id)} style={{ border: `2px solid ${pkg === p.id ? p.color : COLORS.border}`, borderRadius: 14, padding: 24, marginBottom: 16, cursor: "pointer", background: pkg === p.id ? (p.id==="all-inclusive"?COLORS.primaryLight:COLORS.successLight) : "white", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: p.color }}>{p.name}</div>
                    <div style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: p.color }}>LKR {p.price.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{p.tag}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {p.items.map(item => <div key={item} style={{ fontSize: 13 }}>✓ {item}</div>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 24 }}>Booking Details</h2>
              <div style={{ display: "grid", gap: 18 }}>
                <div><label className="label">Date</label><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label className="label">Time</label><input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} /></div>
                <div><label className="label">Number of Guests</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => setGuests(g => Math.max(1, g-1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${COLORS.border}`, background: "white", fontSize: 20, fontWeight: 700 }}>-</button>
                    <span style={{ fontSize: 18, fontWeight: 700, minWidth: 30, textAlign: "center" }}>{guests}</span>
                    <button onClick={() => setGuests(g => Math.min(20, g+1))} style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.primary, color: "white", fontSize: 20, fontWeight: 700, border: "none" }}>+</button>
                  </div>
                </div>
                <div><label className="label">Location / Address</label><input className="input" placeholder="Enter your full address..." value={location} onChange={e => setLocation(e.target.value)} /></div>
                <div><label className="label">Special Requests (Optional)</label><textarea className="input" rows={3} placeholder="Any dietary requirements, special occasions..." style={{ resize: "none" }} value={special} onChange={e => setSpecial(e.target.value)} /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 24 }}>Payment</h2>
              {/* PayHere Banner */}
              <div style={{ background: "#1A3C6E", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 32 }}>🔵</div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>PayHere — Sri Lanka's #1 Payment Gateway</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Visa, Mastercard, Amex · eZ Cash · mCash · Bank Transfer · Koko</div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Select Payment Method</label>
                {[
                  ["payhere_card","💳","Credit / Debit Card","Visa, Mastercard, Amex — via PayHere"],
                  ["payhere_ez","📱","eZ Cash / mCash","Dialog & Mobitel mobile payments"],
                  ["payhere_koko","🟡","Koko (Buy Now Pay Later)","Pay in 3 interest-free instalments"],
                  ["payhere_bank","🏦","Bank Transfer","Direct bank transfer via PayHere"],
                ].map(([id,icon,label,sub]) => (
                  <div key={id} onClick={() => setPayMethod(id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `2px solid ${payMethod===id?COLORS.primary:COLORS.border}`, borderRadius: 12, marginBottom: 10, cursor: "pointer", background: payMethod===id?COLORS.primaryLight:"white", transition: "all 0.2s" }}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>{sub}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payMethod===id?COLORS.primary:COLORS.border}`, background: payMethod===id?COLORS.primary:"white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {payMethod===id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                    </div>
                  </div>
                ))}
              </div>
              {(payMethod === "payhere_card") && (
                <div style={{ background: COLORS.surface, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>Card details are entered securely on PayHere's payment page after you click confirm. Your card info is never stored on our servers.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["💳 VISA","💳 Mastercard","💳 Amex"].map(c => <span key={c} style={{ padding: "4px 10px", background: "white", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }}>{c}</span>)}
                  </div>
                </div>
              )}
              <div style={{ padding: "14px 16px", background: COLORS.infoLight, borderRadius: 10, fontSize: 13, color: COLORS.info, marginBottom: 16 }}>
                🔒 Payments are processed securely by <strong>PayHere</strong> · PCI DSS Compliant · 256-bit SSL
              </div>
            </div>
          )}
          <div style={{ marginTop: 28 }}>
            {step < 3 ? (
              <button className="btn-primary" style={{ padding: "14px 36px", fontSize: 15, width: "100%" }} onClick={() => setStep(s => s+1)}>Continue →</button>
            ) : (
              <button className="btn-primary" style={{ padding: "14px 36px", fontSize: 15, width: "100%", background: "#1A3C6E" }} onClick={() => setDone(true)}>🔵 Pay LKR {total.toLocaleString()} via PayHere →</button>
            )}
          </div>
        </div>
        <div style={{ position: "sticky", top: 80, height: "fit-content" }}>
          <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, #2D1810)`, padding: 20 }}>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 }}>Booking Summary</div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 20, color: "white" }}>{chef?.name}</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16, marginBottom: 16 }}>
                {[["Experience",pkg==="all-inclusive"?"All Inclusive":"Cook-at-Home"],["Date & Time",date?`${date}, ${time}`:"Not selected"],["Guests",`${guests} People`],["Location",location||"Not provided"]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: COLORS.textMuted }}>{k}</span>
                    <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: COLORS.textMuted }}>Base Price (4 pax)</span><span>LKR {price.toLocaleString()}</span>
              </div>
              {guests > 4 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: COLORS.textMuted }}>Extra guests ({guests-4} × 2,000)</span><span>LKR {((guests-4)*2000).toLocaleString()}</span>
                </div>
              )}
              <div style={{ borderTop: `2px solid ${COLORS.border}`, paddingTop: 12, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>Total Amount</span>
                <span style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.primary }}>LKR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>🔒 Secure Payment · No hidden fees</div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────

function CustomerDashboard({ user }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ width: 220, background: COLORS.darkNav, padding: "24px 12px", flexShrink: 0 }}>
        <div style={{ padding: "0 8px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
          <Avatar initials={user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"U"} size={44} />
          <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginTop: 10 }}>{user?.name}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Customer</div>
        </div>
        {[["overview","🏠","Dashboard"],["bookings","📅","My Bookings"],["payments","💳","Payments"],["reviews","⭐","My Reviews"],["support","💬","Support"]].map(([id,icon,label]) => (
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={() => setTab(id)}>
            <span>{icon}</span><span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32, background: COLORS.surface, overflowY: "auto" }}>
        {tab === "overview" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 4 }}>Good Morning, {user?.name?.split(" ")[0]} 👋</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 28 }}>Here's what's happening with your bookings today.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Bookings" value="3" sub="+1 this month" />
              <MetricCard label="Total Spent" value="LKR 65K" sub="+18% vs last month" color={COLORS.info} />
              <MetricCard label="Upcoming" value="1" sub="Next: Tomorrow" color={COLORS.warning} />
              <MetricCard label="Avg. Rating Given" value="4.8" sub="Across all bookings" color={COLORS.gold} />
            </div>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 20, marginBottom: 16 }}>Recent Bookings</h3>
            {bookings.slice(0, 3).map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🍽️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{b.experience}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.date} · {b.chef}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.primary, marginBottom: 4 }}>LKR {b.amount.toLocaleString()}</div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "bookings" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>My Bookings</h2>
            {bookings.map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{b.experience}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                  {[["Chef",b.chef],["Date",b.date],["Guests",b.guests],["Amount",`LKR ${b.amount.toLocaleString()}`]].map(([k,v]) => (
                    <div key={k}><div style={{ fontSize: 12, color: COLORS.textMuted }}>{k}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "payments" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Payment History</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Spent" value="LKR 65K" color={COLORS.primary} />
              <MetricCard label="Pending Release" value="LKR 12K" color={COLORS.warning} sub="Under 48h hold" />
              <MetricCard label="Refunds" value="LKR 0" color={COLORS.success} sub="No refunds issued" />
            </div>
            {bookings.map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.experience}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.date} · {b.chef}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.primary }}>LKR {b.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: COLORS.success, marginTop: 4 }}>✓ Paid</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "reviews" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>My Reviews</h2>
            {[{chef:"Chef Sampath Perera",exp:"Biriyani Feast",rating:5,text:"Exceptional! Chef was professional and punctual."},
              {chef:"Chef Tharindu Silva",exp:"Romantic Dinner",rating:5,text:"Perfect anniversary dinner. Setup was beautiful."},
              {chef:"Chef Danushka Fernando",exp:"Italian Night",rating:4,text:"Excellent pasta and cleanup was spotless."}].map((r, i) => (
              <div key={i} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{r.chef}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{r.exp}</div>
                  </div>
                  <Star value={r.rating} />
                </div>
                <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6 }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "support" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Help & Support</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[["📋","FAQs","Find answers to common questions"],["💸","Refund Help","Request or track a refund"],["👨‍🍳","Chef Support","Issues with your chef booking"],["💬","Live Chat","Chat with our team on WhatsApp"],["🚨","Incident Report","Report a service issue"],["💳","Payment Help","Billing and payment questions"]].map(([icon,title,desc]) => (
                <div key={title} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.primaryLight, borderRadius: 12, padding: 24, border: `1px solid rgba(232,116,59,0.3)` }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>📞 WhatsApp Support</div>
              <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16 }}>Available 24/7 — Average response time: 5 minutes</div>
              <button className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Open WhatsApp Chat →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chef Panel ───────────────────────────────────────────────────────────────

function ChefPanel({ user }) {
  const [tab, setTab] = useState("join");
  const [availability, setAvailability] = useState({ mon: true, tue: true, wed: false, thu: true, fri: true, sat: true, sun: false });
  const [joinForm, setJoinForm] = useState({ fullName: "", nic: "", phone: "", email: "", address: "", city: "", experience: "", specialties: "", bio: "" });
  const [joinFiles, setJoinFiles] = useState({ policePdf: null, nicFront: null, nicBack: null, photo: null, foodCert: null });
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("All");
  const [chefBookings, setChefBookings] = useState(bookings.map(b => ({ ...b, chefStatus: "pending" })));
  const [calMonth, setCalMonth] = useState(new Date(2026, 4, 1));
  const [blockedDates, setBlockedDates] = useState([]);

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) setJoinFiles(f => ({ ...f, [field]: file }));
  };

  const toggleBookingStatus = (id, status) => {
    setChefBookings(prev => prev.map(b => b.id === id ? { ...b, chefStatus: status } : b));
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDay = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (y, m, d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const toggleDate = (dateStr) => setBlockedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const filteredBookings = bookingFilter === "All" ? chefBookings : chefBookings.filter(b =>
    bookingFilter === "Pending" ? b.chefStatus === "pending" :
    bookingFilter === "Confirmed" ? b.chefStatus === "confirmed" :
    b.chefStatus === "completed"
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ width: 220, background: "#0F172A", padding: "24px 12px", flexShrink: 0 }}>
        <div style={{ padding: "0 8px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
          <Avatar initials={user?.name?.split(" ").map(n=>n[0]).join("") || "CH"} size={44} color="#B45309" />
          <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginTop: 10 }}>{user?.name || "Chef"}</div>
          <span className="badge-premium" style={{ marginTop: 6, display: "inline-block" }}>Chef Account</span>
        </div>
        {[["join","📋","Join Request"],["overview","📊","Dashboard"],["orders","📅","My Bookings"],["availability","📅","Availability Calendar"],["earnings","💰","Earnings"],["menu","🍽️","My Menus"],["profile","👤","My Profile"]].map(([id,icon,label]) => (
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={() => setTab(id)}>
            <span>{icon}</span><span style={{ fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 32, background: COLORS.surface, overflowY: "auto" }}>

        {/* ── JOIN REQUEST TAB ── */}
        {tab === "join" && (
          <div style={{ maxWidth: 800 }}>
            {joinSubmitted ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
                <h2 style={{ fontFamily: FONTS.heading, fontSize: 30, marginBottom: 12 }}>Application Submitted!</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 16, marginBottom: 24 }}>Your chef application is under review. Our admin team will verify your documents and contact you within 2–3 business days.</p>
                <div style={{ background: COLORS.warningLight, borderRadius: 12, padding: 20, display: "inline-block", textAlign: "left", minWidth: 320 }}>
                  <div style={{ fontWeight: 700, color: COLORS.warning, marginBottom: 12 }}>📋 Application Status</div>
                  {[["Full Name", joinForm.fullName],["NIC", joinForm.nic],["Phone", joinForm.phone],["Email", joinForm.email]].map(([k,v]) => (
                    <div key={k} style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: COLORS.textMuted, minWidth: 80 }}>{k}:</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: "8px 14px", background: COLORS.warning + "22", borderRadius: 8, fontSize: 13, color: COLORS.warning, fontWeight: 600 }}>
                    🕐 Status: Pending Admin Review
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontFamily: FONTS.heading, fontSize: 28, marginBottom: 8 }}>Chef Application Form</h2>
                  <p style={{ color: COLORS.textMuted }}>Fill in all details to apply as a verified ChefAtHome chef. Our team will review your documents manually.</p>
                </div>

                {/* Personal Details */}
                <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 28, marginBottom: 20 }}>
                  <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 20, color: COLORS.primary }}>👤 Personal Information</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label className="label">Full Name <span style={{color:"red"}}>*</span></label><input className="input" placeholder="As on NIC" value={joinForm.fullName} onChange={e => setJoinForm(f=>({...f, fullName: e.target.value}))} /></div>
                    <div><label className="label">NIC Number <span style={{color:"red"}}>*</span></label><input className="input" placeholder="e.g. 199012345678" value={joinForm.nic} onChange={e => setJoinForm(f=>({...f, nic: e.target.value}))} /></div>
                    <div><label className="label">Phone Number <span style={{color:"red"}}>*</span></label><input className="input" placeholder="+94 77 123 4567" value={joinForm.phone} onChange={e => setJoinForm(f=>({...f, phone: e.target.value}))} /></div>
                    <div><label className="label">Email Address <span style={{color:"red"}}>*</span></label><input className="input" type="email" placeholder="your@email.com" value={joinForm.email} onChange={e => setJoinForm(f=>({...f, email: e.target.value}))} /></div>
                    <div style={{ gridColumn: "span 2" }}><label className="label">Currently Living Address <span style={{color:"red"}}>*</span></label><textarea className="input" rows={2} placeholder="Full address including city, district..." value={joinForm.address} onChange={e => setJoinForm(f=>({...f, address: e.target.value}))} style={{resize:"none"}} /></div>
                    <div><label className="label">City</label><select className="input" value={joinForm.city} onChange={e => setJoinForm(f=>({...f, city: e.target.value}))}>
                      <option value="">Select city...</option>
                      {["Colombo","Kandy","Galle","Negombo","Jaffna","Matara","Kurunegala","Anuradhapura","Trincomalee","Batticaloa"].map(c => <option key={c}>{c}</option>)}
                    </select></div>
                    <div><label className="label">Years of Experience <span style={{color:"red"}}>*</span></label><select className="input" value={joinForm.experience} onChange={e => setJoinForm(f=>({...f, experience: e.target.value}))}>
                      <option value="">Select...</option>
                      {["1-2 Years","3-5 Years","5-8 Years","8-10 Years","10+ Years"].map(e => <option key={e}>{e}</option>)}
                    </select></div>
                  </div>
                  <div style={{ marginTop: 16 }}><label className="label">Cuisine Specialties</label><input className="input" placeholder="e.g. Sri Lankan, Seafood, Italian, BBQ..." value={joinForm.specialties} onChange={e => setJoinForm(f=>({...f, specialties: e.target.value}))} /></div>
                  <div style={{ marginTop: 16 }}><label className="label">Professional Bio</label><textarea className="input" rows={3} placeholder="Tell us about your cooking background, previous experience, hotel/restaurant history..." value={joinForm.bio} onChange={e => setJoinForm(f=>({...f, bio: e.target.value}))} style={{resize:"none"}} /></div>
                </div>

                {/* Document Uploads */}
                <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 28, marginBottom: 20 }}>
                  <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 8, color: COLORS.primary }}>📄 Required Documents</h3>
                  <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>All documents are securely stored and only accessed by our admin team for verification.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      ["policePdf", "🚔 Police Clearance Report", "PDF only", ".pdf"],
                      ["nicFront", "🪪 NIC — Front Side", "JPG, PNG, PDF", ".jpg,.jpeg,.png,.pdf"],
                      ["nicBack", "🪪 NIC — Back Side", "JPG, PNG, PDF", ".jpg,.jpeg,.png,.pdf"],
                      ["photo", "📸 Your Professional Photo", "JPG, PNG", ".jpg,.jpeg,.png"],
                      ["foodCert", "🍽️ Food Safety Certificate (if any)", "PDF, JPG, PNG (optional)", ".pdf,.jpg,.jpeg,.png"],
                    ].map(([field, label, hint, accept]) => (
                      <div key={field} style={{ border: `2px dashed ${joinFiles[field] ? COLORS.success : COLORS.border}`, borderRadius: 12, padding: 18, background: joinFiles[field] ? COLORS.successLight : "#FAFAF9" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{hint}</div>
                        {joinFiles[field] ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✅ {joinFiles[field].name}</span>
                            <button onClick={() => setJoinFiles(f=>({...f,[field]:null}))} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 13 }}>✕</button>
                          </div>
                        ) : (
                          <label style={{ cursor: "pointer" }}>
                            <input type="file" accept={accept} style={{ display: "none" }} onChange={e => handleFileChange(field, e)} />
                            <span style={{ background: COLORS.primary, color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Choose File</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Declaration */}
                <div style={{ background: COLORS.infoLight, borderRadius: 12, padding: 18, marginBottom: 20, fontSize: 13, color: COLORS.info }}>
                  🔒 By submitting this application, you confirm that all information provided is accurate and true. False information may result in permanent account suspension.
                </div>

                <button className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: 16 }} onClick={() => {
                  if (!joinForm.fullName || !joinForm.nic || !joinForm.phone || !joinForm.email || !joinForm.address || !joinForm.experience) {
                    alert("Please fill in all required fields marked with *");
                    return;
                  }
                  if (!joinFiles.policePdf || !joinFiles.nicFront || !joinFiles.nicBack || !joinFiles.photo) {
                    alert("Please upload Police Clearance, NIC (front & back), and your photo.");
                    return;
                  }
                  setJoinSubmitted(true);
                }}>
                  Submit Chef Application →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 4 }}>Chef Dashboard</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 28 }}>Your performance for this month</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Bookings" value="28" sub="+12% this month" />
              <MetricCard label="Total Earned" value="LKR 840K" sub="This month" color={COLORS.success} />
              <MetricCard label="Pending Orders" value="3" sub="Needs confirmation" color={COLORS.warning} />
              <MetricCard label="Rating" value="4.9 ⭐" sub="120 reviews" color={COLORS.gold} />
            </div>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 20, marginBottom: 16 }}>Incoming Booking Requests</h3>
            {chefBookings.filter(b => b.chefStatus === "pending").map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `2px solid ${COLORS.warning}44`, padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{b.experience}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.date} · {b.guests} Guests · {b.location}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>Customer: {b.customer}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: 16 }}>LKR {b.amount.toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggleBookingStatus(b.id, "confirmed")} style={{ background: COLORS.successLight, color: COLORS.success, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Accept</button>
                    <button onClick={() => toggleBookingStatus(b.id, "declined")} style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✗ Decline</button>
                  </div>
                </div>
              </div>
            ))}
            {chefBookings.filter(b => b.chefStatus === "pending").length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: COLORS.textMuted, background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                No pending requests right now 🎉
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "orders" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>My Bookings</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["All","Pending","Confirmed","Completed"].map(f => (
                <button key={f} className={`tab ${bookingFilter===f?"active":""}`} onClick={() => setBookingFilter(f)}>{f}</button>
              ))}
            </div>
            {filteredBookings.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>No bookings found</div>
            )}
            {filteredBookings.map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{b.experience}</div>
                  <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: b.chefStatus==="confirmed" ? COLORS.successLight : b.chefStatus==="pending" ? COLORS.warningLight : b.chefStatus==="declined" ? COLORS.dangerLight : COLORS.infoLight,
                    color: b.chefStatus==="confirmed" ? COLORS.success : b.chefStatus==="pending" ? COLORS.warning : b.chefStatus==="declined" ? COLORS.danger : COLORS.info
                  }}>{b.chefStatus.charAt(0).toUpperCase()+b.chefStatus.slice(1)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: b.chefStatus==="pending"?16:0 }}>
                  {[["Customer",b.customer],["Date",b.date],["Guests",b.guests+" pax"],["Amount",`LKR ${b.amount.toLocaleString()}`]].map(([k,v]) => (
                    <div key={k}><div style={{ fontSize: 12, color: COLORS.textMuted }}>{k}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div></div>
                  ))}
                </div>
                {b.chefStatus === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggleBookingStatus(b.id, "confirmed")} style={{ background: COLORS.successLight, color: COLORS.success, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Accept Booking</button>
                    <button onClick={() => toggleBookingStatus(b.id, "declined")} style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✗ Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── AVAILABILITY CALENDAR TAB ── */}
        {tab === "availability" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 8 }}>Availability Calendar</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 28 }}>Click on dates to block them. Blocked dates won't be available for booking.</p>

            {/* Weekly toggle */}
            <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 16 }}>Weekly Availability</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
                {Object.entries(availability).map(([day, on]) => (
                  <div key={day} onClick={() => setAvailability(a => ({...a, [day]: !a[day]}))} style={{ textAlign: "center", padding: "14px 6px", borderRadius: 10, border: `2px solid ${on ? COLORS.primary : COLORS.border}`, background: on ? COLORS.primaryLight : "white", cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: on ? COLORS.primary : COLORS.textMuted, textTransform: "uppercase" }}>{day}</div>
                    <div style={{ fontSize: 18, marginTop: 6 }}>{on ? "✅" : "❌"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly calendar */}
            <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>←</button>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18 }}>{monthNames[calMonth.getMonth()]} {calMonth.getFullYear()}</h3>
                <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>→</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, padding: "8px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {Array.from({ length: getFirstDay(calMonth) }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: getDaysInMonth(calMonth) }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = formatDate(calMonth.getFullYear(), calMonth.getMonth(), d);
                  const isBlocked = blockedDates.includes(dateStr);
                  const isToday = new Date().toDateString() === new Date(calMonth.getFullYear(), calMonth.getMonth(), d).toDateString();
                  return (
                    <div key={d} onClick={() => toggleDate(dateStr)} style={{ textAlign: "center", padding: "10px 4px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${isBlocked ? COLORS.danger : isToday ? COLORS.primary : COLORS.border}`, background: isBlocked ? COLORS.dangerLight : isToday ? COLORS.primaryLight : "white", color: isBlocked ? COLORS.danger : isToday ? COLORS.primary : COLORS.text, fontWeight: isToday ? 700 : 400, fontSize: 14, transition: "all 0.15s" }}>
                      {d}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 13 }}>
                <span>⬜ Available</span>
                <span style={{ color: COLORS.danger }}>🟥 Blocked ({blockedDates.length} days)</span>
                <span style={{ color: COLORS.primary }}>🟦 Today</span>
              </div>
              <button className="btn-primary" style={{ marginTop: 16, padding: "10px 24px" }} onClick={() => alert("Availability saved!")}>Save Availability</button>
            </div>
          </div>
        )}

        {/* ── EARNINGS TAB ── */}
        {tab === "earnings" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Earnings Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Earned" value="LKR 840K" color={COLORS.success} />
              <MetricCard label="Pending Release" value="LKR 45K" color={COLORS.warning} sub="48h safety hold" />
              <MetricCard label="Next Payout" value="LKR 36K" color={COLORS.info} sub="Released tomorrow" />
            </div>
            <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => [`LKR ${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill={COLORS.primary} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Payment Breakdown</h3>
              {[["Gross Revenue","LKR 1,050,000","text"],["Platform Commission (15%)","– LKR 157,500",COLORS.danger],["Safety Hold (5%)","– LKR 52,500",COLORS.warning],["Your Earnings (80%)","LKR 840,000",COLORS.success]].map(([k,v,color]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 14 }}>{k}</span>
                  <span style={{ fontWeight: 700, color: color === "text" ? COLORS.text : color, fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MENU TAB ── */}
        {tab === "menu" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 24 }}>My Menus</h2>
              <button className="btn-primary" style={{ fontSize: 13 }}>+ Add New Menu</button>
            </div>
            {chefs[0].menus.map((menu, i) => (
              <div key={menu} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12, display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{"🍛🍝🦞".split("").filter((_,idx)=>idx%2===0)[i%3]||"🍽️"}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{menu}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>Active · LKR 25,000–45,000</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ background: COLORS.infoLight, color: COLORS.info, padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Edit</button>
                  <button style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>My Profile</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 20 }}>Personal Information</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div><label className="label">Full Name</label><input className="input" defaultValue={user?.name || "Chef"} /></div>
                  <div><label className="label">Email</label><input className="input" defaultValue={user?.email || ""} /></div>
                  <div><label className="label">Phone</label><input className="input" defaultValue="+94 77 123 4567" /></div>
                  <div><label className="label">Location</label><input className="input" defaultValue="Colombo, Sri Lanka" /></div>
                </div>
                <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }}>Save Changes</button>
              </div>
              <div style={{ background: "white", borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 20 }}>Professional Details</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div><label className="label">Experience</label><input className="input" defaultValue="8+ Years" /></div>
                  <div><label className="label">Specialties</label><input className="input" defaultValue="Sri Lankan, Indian, Seafood" /></div>
                  <div><label className="label">Bio</label><textarea className="input" rows={4} defaultValue="Former head chef at Cinnamon Grand Colombo..." style={{ resize: "none" }} /></div>
                </div>
                <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }}>Update Profile</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel() {
  const [tab, setTab] = useState("dashboard");
  const [viewChef, setViewChef] = useState(null);
  const [bookingFilter, setBookingFilter] = useState("All");
  const [chefList, setChefList] = useState([
    ...chefs.map(c => ({ ...c, adminStatus: "active", documents: { police: true, nic: true, photo: true, foodCert: true }, joinDate: "2026-01-15", phone: "+94 77 123 4567", email: c.name.toLowerCase().replace(/ /g,".")+  "@gmail.com", nic: "199012345678", address: "Colombo 7, Sri Lanka" } )),
    { id: 101, name: "Chef Ruwan De Silva", type: "premium", location: "Kandy", experience: "5-8 Years", rating: 0, reviews: 0, price: 45000, adminStatus: "pending", menus: ["Sri Lankan Feast","BBQ Night"], specialties: "Sri Lankan, BBQ", bio: "Former hotel chef with 6 years experience.", documents: { police: true, nic: true, photo: true, foodCert: false }, joinDate: "2026-05-20", phone: "+94 71 234 5678", email: "ruwan.desilva@gmail.com", nic: "198712345678", address: "Kandy, Sri Lanka", badge: "premium", image: "RD" },
    { id: 102, name: "Chef Nadeeka Perera", type: "local", location: "Galle", experience: "3-5 Years", rating: 0, reviews: 0, price: 22000, adminStatus: "pending", menus: ["Seafood Dinner","Italian Night"], specialties: "Seafood, Italian", bio: "Passionate home cook turned professional.", documents: { police: true, nic: true, photo: true, foodCert: true }, joinDate: "2026-05-22", phone: "+94 76 345 6789", email: "nadeeka.perera@gmail.com", nic: "199312345678", address: "Galle, Sri Lanka", badge: "local", image: "NP" },
  ]);

  const pendingChefs = chefList.filter(c => c.adminStatus === "pending");
  const activeChefs = chefList.filter(c => c.adminStatus === "active");
  const suspendedChefs = chefList.filter(c => c.adminStatus === "suspended");

  const approveChef = (id) => setChefList(list => list.map(c => c.id === id ? { ...c, adminStatus: "active" } : c));
  const rejectChef = (id) => setChefList(list => list.map(c => c.id === id ? { ...c, adminStatus: "rejected" } : c));
  const suspendChef = (id) => setChefList(list => list.map(c => c.id === id ? { ...c, adminStatus: "suspended" } : c));
  const reinstateChef = (id) => setChefList(list => list.map(c => c.id === id ? { ...c, adminStatus: "active" } : c));

  const [users, setUsers] = useState([
    { id: "u1", name: "Nimal Perera", email: "nimal@gmail.com", role: "customer", joined: "2026-01-10", bookings: 4 },
    { id: "u2", name: "Aisha Fernando", email: "aisha@gmail.com", role: "customer", joined: "2026-02-15", bookings: 2 },
    { id: "u3", name: "David Smith", email: "david@gmail.com", role: "customer", joined: "2026-03-01", bookings: 1 },
    { id: "u4", name: "Chamari Silva", email: "chamari@gmail.com", role: "customer", joined: "2026-03-20", bookings: 3 },
    { id: "u5", name: "Ruwan De Silva", email: "ruwan@gmail.com", role: "customer", joined: "2026-04-05", bookings: 0 },
    { id: "u6", name: "Nadeeka Perera", email: "nadeeka@gmail.com", role: "customer", joined: "2026-04-18", bookings: 0 },
  ]);
  const [promoteModal, setPromoteModal] = useState(null);
  const promoteToChef = (userId) => {
    setUsers(list => list.map(u => u.id === userId ? { ...u, role: "chef" } : u));
    setPromoteModal(null);
  };
  const demoteToCustomer = (userId) => setUsers(list => list.map(u => u.id === userId ? { ...u, role: "customer" } : u));

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", flexDirection: "row" }}>
      <div style={{ width: 220, background: "#0C1220", padding: "24px 10px", flexShrink: 0 }}>
        <div style={{ padding: "0 8px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
          <div style={{ fontFamily: FONTS.heading, fontSize: 15, color: "white", fontWeight: 700 }}>🍽️ ChefAtHome</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Super Admin Panel</div>
        </div>
        {[["dashboard","📊","Dashboard"],["users","👥","Users & Chefs"],["chefs","👨‍🍳","Chef Approvals"],["bookings","📅","Bookings"],["payments","💳","Payments"],["reports","📈","Analytics"],["settings","⚙️","Settings"]].map(([id,icon,label]) => (
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={() => setTab(id)}>
            <span>{icon}</span><span style={{ fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "28px 28px", background: COLORS.surface, overflowY: "auto" }}>
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 4 }}>Good Morning, Admin 👋</h2>
                <p style={{ color: COLORS.textMuted }}>Here's your platform overview for this month.</p>
              </div>
              <div style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: COLORS.textMuted }}>📅 May 2026</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              <MetricCard label="Total Bookings" value="128" sub="+34% from last month" />
              <MetricCard label="Total Revenue" value="LKR 1.25M" sub="+18% from last month" color={COLORS.success} />
              <MetricCard label="Active Chefs" value="32" sub="+13% from last month" color={COLORS.info} />
              <MetricCard label="New Customers" value="85" sub="+32% from last month" color={COLORS.warning} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, marginBottom: 24 }}>
              <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 20 }}>Revenue Overview</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => [`LKR ${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 16 }}>Top Chefs</h3>
                {chefs.slice(0, 4).map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <Avatar initials={c.image} size={36} color={["#B45309","#16A34A","#2563EB","#9333EA"][i]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}><Star value={c.rating} /> {c.rating} ({c.reviews})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Recent Bookings</h3>
              {bookings.map(b => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍽️</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{b.experience}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>{b.date} · {b.chef} · {b.customer}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.primary, marginBottom: 4 }}>LKR {b.amount.toLocaleString()}</div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 4 }}>Users & Role Management</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Promote customers to chefs — they will get access to the Chef Panel</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: COLORS.infoLight, color: COLORS.info, padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{users.filter(u=>u.role==="chef").length} Chefs</span>
                <span style={{ background: COLORS.successLight, color: COLORS.success, padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{users.filter(u=>u.role==="customer").length} Customers</span>
              </div>
            </div>

            {/* Chefs section */}
            {users.filter(u => u.role === "chef").length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 14, color: COLORS.info }}>👨‍🍳 Active Chefs</h3>
                {users.filter(u => u.role === "chef").map(u => (
                  <div key={u.id} style={{ background: COLORS.infoLight, borderRadius: 12, border: `1px solid ${COLORS.info}33`, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Avatar initials={u.name.split(" ").map(n=>n[0]).join("")} size={42} color={COLORS.info} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>📧 {u.email} · Chef Panel Access ✓</div>
                      </div>
                    </div>
                    <button onClick={() => demoteToCustomer(u.id)} style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Remove Chef Role</button>
                  </div>
                ))}
              </div>
            )}

            {/* All customers */}
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 14 }}>👥 All Customers</h3>
            {users.filter(u => u.role === "customer").map(u => (
              <div key={u.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar initials={u.name.split(" ").map(n=>n[0]).join("")} size={42} color={COLORS.primary} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>📧 {u.email} · Joined {u.joined} · {u.bookings} bookings</div>
                  </div>
                </div>
                <button onClick={() => setPromoteModal(u)} style={{ background: COLORS.primaryLight, color: COLORS.primary, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${COLORS.primary}44`, cursor: "pointer" }}>
                  👨‍🍳 Make Chef
                </button>
              </div>
            ))}

            {/* Promote modal */}
            {promoteModal && (
              <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPromoteModal(null)}>
                <div className="modal" style={{ maxWidth: 420 }}>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
                    <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, marginBottom: 8 }}>Promote to Chef?</h2>
                    <p style={{ color: COLORS.textMuted, fontSize: 14 }}>
                      <strong>{promoteModal.name}</strong> will get access to the Chef Panel where they can manage bookings, set availability, and view earnings.
                    </p>
                  </div>
                  <div style={{ background: COLORS.infoLight, borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: COLORS.info }}>
                    ℹ️ They will see a "My Panel" button in the navbar after their next login.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => promoteToChef(promoteModal.id)} style={{ flex: 1, background: COLORS.primary, color: "white", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Confirm Promotion</button>
                    <button onClick={() => setPromoteModal(null)} style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "12px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "chefs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 24 }}>Chef Management</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {pendingChefs.length > 0 && <span style={{ background: COLORS.warningLight, color: COLORS.warning, padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>⏳ {pendingChefs.length} Pending Approval</span>}
                {suspendedChefs.length > 0 && <span style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>🚫 {suspendedChefs.length} Suspended</span>}
              </div>
            </div>

            {/* Pending Approvals */}
            {pendingChefs.length > 0 && (
              <div style={{ background: COLORS.warningLight, borderRadius: 16, padding: 24, marginBottom: 28, border: `1px solid ${COLORS.warning}44` }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: COLORS.warning }}>⏳ Pending Chef Applications</div>
                {pendingChefs.map(c => (
                  <div key={c.id} style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <Avatar initials={c.image || c.name.split(" ").map(n=>n[0]).join("")} size={48} color="#B45309" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{c.specialties} · {c.location} · {c.experience}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>📧 {c.email} · 📱 {c.phone}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>🪪 NIC: {c.nic} · 📍 {c.address}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setViewChef(c)} style={{ background: COLORS.infoLight, color: COLORS.info, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>👁 View Docs</button>
                        <button onClick={() => approveChef(c.id)} style={{ background: COLORS.successLight, color: COLORS.success, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Approve</button>
                        <button onClick={() => rejectChef(c.id)} style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>✗ Reject</button>
                      </div>
                    </div>
                    {/* Document checklist */}
                    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                      {[["Police Clearance PDF","police"],["NIC","nic"],["Photo","photo"],["Food Safety Cert","foodCert"]].map(([label, key]) => (
                        <span key={key} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.documents[key] ? COLORS.successLight : COLORS.dangerLight, color: c.documents[key] ? COLORS.success : COLORS.danger }}>
                          {c.documents[key] ? "✓" : "✗"} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Chefs */}
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Active Chefs ({activeChefs.length})</h3>
            {activeChefs.map(c => (
              <div key={c.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 10, display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar initials={c.image || c.name.split(" ").map(n=>n[0]).join("")} size={44} color={c.type==="premium"?"#B45309":COLORS.primary} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{c.location} · {c.experience} · ⭐ {c.rating} ({c.reviews} reviews)</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge type={c.badge} />
                  <button onClick={() => setViewChef(c)} style={{ background: COLORS.infoLight, color: COLORS.info, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>👁 View</button>
                  <button onClick={() => suspendChef(c.id)} style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>🚫 Suspend</button>
                </div>
              </div>
            ))}

            {/* Suspended Chefs */}
            {suspendedChefs.length > 0 && (
              <>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16, marginTop: 28, color: COLORS.danger }}>Suspended Chefs ({suspendedChefs.length})</h3>
                {suspendedChefs.map(c => (
                  <div key={c.id} style={{ background: COLORS.dangerLight, borderRadius: 12, border: `1px solid ${COLORS.danger}33`, padding: 20, marginBottom: 10, display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Avatar initials={c.image || c.name.split(" ").map(n=>n[0]).join("")} size={44} color={COLORS.danger} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{c.location} · Suspended</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setViewChef(c)} style={{ background: "white", color: COLORS.info, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}>👁 View</button>
                      <button onClick={() => reinstateChef(c.id)} style={{ background: COLORS.successLight, color: COLORS.success, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>✓ Reinstate</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Chef Detail Modal */}
            {viewChef && (
              <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewChef(null)}>
                <div className="modal" style={{ maxWidth: 620, maxHeight: "85vh", overflowY: "auto" }}>
                  <button onClick={() => setViewChef(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>✕</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <Avatar initials={viewChef.image || viewChef.name.split(" ").map(n=>n[0]).join("")} size={60} color="#B45309" />
                    <div>
                      <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, marginBottom: 4 }}>{viewChef.name}</h2>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Badge type={viewChef.badge} />
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: viewChef.adminStatus === "active" ? COLORS.successLight : viewChef.adminStatus === "pending" ? COLORS.warningLight : COLORS.dangerLight, color: viewChef.adminStatus === "active" ? COLORS.success : viewChef.adminStatus === "pending" ? COLORS.warning : COLORS.danger }}>
                          {viewChef.adminStatus.charAt(0).toUpperCase() + viewChef.adminStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    {[["📧 Email", viewChef.email], ["📱 Phone", viewChef.phone], ["🪪 NIC", viewChef.nic], ["📍 Address", viewChef.address], ["📅 Applied", viewChef.joinDate], ["🍳 Experience", viewChef.experience], ["🌍 Location", viewChef.location], ["💰 Price", `LKR ${viewChef.price?.toLocaleString()}`]].map(([k,v]) => (
                      <div key={k} style={{ background: COLORS.surface, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{k}</div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {viewChef.bio && (
                    <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>Bio</div>
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{viewChef.bio}</div>
                    </div>
                  )}

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📋 Submitted Documents</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[["Police Clearance PDF","police","📄"],["NIC (Front & Back)","nic","🪪"],["Profile Photo","photo","📷"],["Food Safety Certificate","foodCert","🥗"]].map(([label, key, icon]) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: viewChef.documents[key] ? COLORS.successLight : COLORS.dangerLight, border: `1px solid ${viewChef.documents[key] ? COLORS.success : COLORS.danger}33` }}>
                          <span style={{ fontSize: 20 }}>{icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: 12, color: viewChef.documents[key] ? COLORS.success : COLORS.danger, fontWeight: 600 }}>{viewChef.documents[key] ? "✓ Submitted" : "✗ Missing"}</div>
                          </div>
                          {viewChef.documents[key] && <button style={{ marginLeft: "auto", background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>View</button>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    {viewChef.adminStatus === "pending" && <>
                      <button onClick={() => { approveChef(viewChef.id); setViewChef(null); }} style={{ flex: 1, background: COLORS.success, color: "white", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Approve Chef</button>
                      <button onClick={() => { rejectChef(viewChef.id); setViewChef(null); }} style={{ flex: 1, background: COLORS.danger, color: "white", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>✗ Reject</button>
                    </>}
                    {viewChef.adminStatus === "active" && (
                      <button onClick={() => { suspendChef(viewChef.id); setViewChef(null); }} style={{ flex: 1, background: COLORS.danger, color: "white", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>🚫 Suspend Chef</button>
                    )}
                    {viewChef.adminStatus === "suspended" && (
                      <button onClick={() => { reinstateChef(viewChef.id); setViewChef(null); }} style={{ flex: 1, background: COLORS.success, color: "white", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>✓ Reinstate Chef</button>
                    )}
                    <button onClick={() => setViewChef(null)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "12px 20px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "bookings" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>All Bookings</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["All","Confirmed","Pending","Cancelled"].map(f => <button key={f} className={`tab ${bookingFilter===f?"active":""}`} onClick={() => setBookingFilter(f)}>{f}</button>)}
            </div>
            {bookings.filter(b => bookingFilter === "All" || b.status.toLowerCase() === bookingFilter.toLowerCase()).map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{b.experience}</span>
                    <span style={{ marginLeft: 12, fontSize: 12, color: COLORS.textMuted }}>#{b.id}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
                  {[["Customer",b.customer],["Chef",b.chef],["Date",b.date],["Guests",b.guests],["Amount",`LKR ${b.amount.toLocaleString()}`]].map(([k,v]) => (
                    <div key={k}><div style={{ fontSize: 12, color: COLORS.textMuted }}>{k}</div><div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "customers" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Customer Management</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Customers" value="500+" />
              <MetricCard label="New This Month" value="85" color={COLORS.success} sub="+32%" />
              <MetricCard label="Repeat Customers" value="68%" color={COLORS.info} />
            </div>
            {bookings.map((b, i) => (
              <div key={i} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar initials={b.customer.split(" ").map(n=>n[0]).join("")} size={40} color={[COLORS.primary,COLORS.info,COLORS.success,COLORS.warning][i]} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{b.customer}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.location}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: COLORS.textMuted }}>LKR {b.amount.toLocaleString()} spent</div>
              </div>
            ))}
          </div>
        )}
        {tab === "payments" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Payments & Payouts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard label="Total Revenue" value="LKR 1.25M" color={COLORS.primary} />
              <MetricCard label="Chef Payouts" value="LKR 1.0M" color={COLORS.success} sub="80% of revenue" />
              <MetricCard label="Platform Fees" value="LKR 125K" color={COLORS.info} sub="10% commission" />
              <MetricCard label="Safety Holds" value="LKR 125K" color={COLORS.warning} sub="Pending release" />
            </div>
            {bookings.map(b => (
              <div key={b.id} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.experience}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.customer} → {b.chef}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: 16 }}>LKR {b.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>Chef: LKR {Math.round(b.amount*0.8).toLocaleString()} · Hold: LKR {Math.round(b.amount*0.1).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "reports" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Reports & Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Revenue Growth</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => [`LKR ${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, marginBottom: 16 }}>Monthly Bookings</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill={COLORS.info} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {tab === "settings" && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 24 }}>Platform Settings</h2>
            <div style={{ display: "grid", gap: 20 }}>
              {[["Commission Model","Platform Commission Rate","15"],["Safety Hold","Hold Duration (hours)","48"],["Refund Policy","Customer Cancellation Window (hours)","48"]].map(([section, label, val]) => (
                <div key={section} style={{ background: "white", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                  <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, marginBottom: 16 }}>{section}</h3>
                  <div><label className="label">{label}</label><input className="input" defaultValue={val} style={{ maxWidth: 200 }} /></div>
                  <button className="btn-primary" style={{ marginTop: 16, padding: "8px 20px", fontSize: 13 }}>Save</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal (Supabase-powered) ───────────────────────────────────────────

function AuthModal({ mode, setMode, onClose }) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [view, setView] = useState(mode); // "login" | "signup" | "reset"

  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!form.email || (!form.password && view !== "reset")) return setError("Please fill in all fields.");
    setLoading(true);
    try {
      if (view === "reset") {
        await resetPassword(form.email);
        setSuccessMsg("✅ Password reset email sent! Check your inbox.");
        setLoading(false);
        return;
      }
      if (view === "signup") {
        if (!form.name) return setError("Please enter your full name.");
        const data = await signUp(form.email, form.password, form.name, form.role);
        if (!data.access_token) {
          // Email confirmation required
          setSuccessMsg("✅ Account created! Please check your email to confirm your account.");
          setLoading(false);
          return;
        }
      } else {
        await signIn(form.email, form.password);
      }
      onClose();
    } catch (e) {
      setError(e.message || e.error_description || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogle = () => {
    signInWithGoogle(); // redirects to Google
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, color: COLORS.textMuted, cursor: "pointer" }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🍽️</div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 4 }}>
            {view === "login" ? "Welcome Back" : view === "signup" ? "Create Account" : "Reset Password"}
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>
            {view === "login" ? "Login to manage your bookings"
              : view === "signup" ? "Join ChefAtHome today"
              : "We'll send a reset link to your email"}
          </p>
        </div>

        {/* Google OAuth — only on login/signup */}
        {view !== "reset" && (
          <>
            <button
              onClick={handleGoogle}
              style={{ width: "100%", padding: "12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 10, background: "white", fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#4285F4"}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
            >
              {/* Google SVG icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              <span style={{ color: COLORS.textLight, fontSize: 13 }}>or</span>
              <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            </div>
          </>
        )}

        {/* Form fields */}
        <div style={{ display: "grid", gap: 14 }}>
          {view === "signup" && (
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </div>
        )}
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          {view !== "reset" && (
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
        </div>

        {/* Forgot password link */}
        {view === "login" && (
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: COLORS.primary, cursor: "pointer", fontWeight: 500 }} onClick={() => setView("reset")}>
              Forgot password?
            </span>
          </div>
        )}

        {/* Error / Success messages */}
        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: COLORS.dangerLight, borderRadius: 8, fontSize: 13, color: COLORS.danger, border: `1px solid ${COLORS.danger}22` }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: COLORS.successLight, borderRadius: 8, fontSize: 13, color: COLORS.success }}>
            {successMsg}
          </div>
        )}

        {/* Submit button */}
        <button
          className="btn-primary"
          style={{ width: "100%", padding: "14px", marginTop: 20, fontSize: 15, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Please wait…"
            : view === "login" ? "Login →"
            : view === "signup" ? "Create Account →"
            : "Send Reset Link →"}
        </button>

        {/* Switch mode */}
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: COLORS.textMuted }}>
          {view === "login" ? (
            <>Don't have an account? <span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setView("signup"); setMode("signup"); setError(""); }}>Sign Up</span></>
          ) : view === "signup" ? (
            <>Already have an account? <span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setView("login"); setMode("login"); setError(""); }}>Login</span></>
          ) : (
            <><span style={{ color: COLORS.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setView("login"); setError(""); }}>← Back to Login</span></>
          )}
        </p>

        {/* Security note */}
        <div style={{ marginTop: 16, padding: "10px 14px", background: COLORS.infoLight, borderRadius: 8, fontSize: 12, color: COLORS.info, display: "flex", alignItems: "center", gap: 8 }}>
          🔒 Secured by Supabase Auth · Login alerts sent to your email
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────

function PricingPage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>✦ PRICING</div>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 42, fontWeight: 700, marginBottom: 12 }}>Transparent, Fair Pricing</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>From budget-friendly home meals to luxury private dining</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 48 }}>
        {[{ type: "Local Chef", desc: "Affordable everyday experience", color: COLORS.success, tiers: [["Small (2–4 guests)","LKR 5,000 – 12,000"],["Medium (5–8 guests)","LKR 12,000 – 20,000"],["Large (9+ guests)","LKR 20,000 – 25,000"]], features: ["Local/home chefs","Traditional menus","Faster booking","Biriyani, BBQ, Sri Lankan food"] },
          { type: "Premium Chef", desc: "Luxury private dining experience", color: "#B45309", tiers: [["Small (2–4 guests)","LKR 30,000 – 50,000"],["Medium (5–8 guests)","LKR 50,000 – 75,000"],["Luxury (9+ guests)","LKR 100,000+"]], features: ["Hotel/resort trained chefs","Fine dining presentation","Table setup & serving","Verified premium badge"] }].map(pkg => (
          <div key={pkg.type} style={{ background: "white", borderRadius: 20, border: `2px solid ${pkg.color}22`, padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "inline-block", background: pkg.type==="Premium Chef"?"linear-gradient(135deg,#B45309,#D97706)":COLORS.successLight, color: pkg.type==="Premium Chef"?"white":COLORS.success, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{pkg.type}</div>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 6 }}>{pkg.type}</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 14 }}>{pkg.desc}</p>
            </div>
            {pkg.tiers.map(([tier,price]) => (
              <div key={tier} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 14, color: COLORS.textMuted }}>{tier}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: pkg.color }}>{price}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              {pkg.features.map(f => <div key={f} style={{ fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: pkg.color, fontWeight: 700 }}>✓</span>{f}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, #2D1810)`, borderRadius: 20, padding: 40, textAlign: "center", color: "white" }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 28, marginBottom: 12 }}>Platform Commission: Hybrid Model</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 28 }}>Chef receives 80% · Platform commission 10% · Safety hold 10% (released within 48h)</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {[["80%","Chef Earnings","Paid instantly after completion"],["10%","Platform Fee","Keeps the platform running"],["10%","Safety Hold","Released after 48h confirmation"]].map(([pct,title,desc]) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: FONTS.heading, fontSize: 36, color: COLORS.primary, marginBottom: 6 }}>{pct}</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Menu Page ─────────────────────────────────────────────────────────────

function AIMenuPage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(232,116,59,0.4)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ color: COLORS.primary, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>✨ AI-POWERED</span>
        </div>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 42, fontWeight: 700, marginBottom: 12 }}>AI Menu Planner</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Describe your occasion and our AI will craft a personalized menu and recommend the perfect chef</p>
      </div>
      <AIMenuAssistant />
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

function AppInner() {
  const { user, signOut, authLoading } = useAuth();
  const [page, setPage] = useState("home");
  const [showAuth, setShowAuth] = useState(null);
  const [selectedChef, setSelectedChef] = useState(null);
  const [bookingChef, setBookingChef] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Auto-redirect to dashboard after login
  useEffect(() => {
    if (user && (page === "home" || page === "login")) {
      // don't auto-redirect, let them browse
    }
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <style>{css}</style>
        <div style={{ fontSize: 48 }}>🍽️</div>
        <div style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.dark }}>Chef<span style={{ color: COLORS.primary }}>at</span>Home</div>
        <div style={{ color: COLORS.textMuted, fontSize: 14 }} className="pulse">Loading…</div>
      </div>
    );
  }

  const SUPER_ADMIN_EMAIL = "judethayaan@gmail.com";
  const isAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === "admin";
  const isChef = user?.role === "chef";
  const navUser = user ? { ...user, role: isAdmin ? "admin" : isChef ? "chef" : "customer" } : null;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.surface }}>
      <style>{css}</style>
      <Navbar page={page} setPage={setPage} user={navUser} setUser={() => signOut()} setShowAuth={setShowAuth} />

      {page === "home" && <><HeroSection setPage={setPage} /><FeaturesRow /><PopularExperiences setPage={setPage} /><HowItWorks /><StatsRow /><TrustSection /><Footer setPage={setPage} /></>}
      {page === "chefs" && <><ChefsPage setPage={setPage} setSelectedChef={setSelectedChef} /><Footer setPage={setPage} /></>}
      {page === "chef-profile" && <><ChefProfile chef={selectedChef} setPage={setPage} setBookingChef={setBookingChef} /><Footer setPage={setPage} /></>}
      {page === "booking" && <><BookingPage chef={bookingChef || selectedChef} setPage={setPage} user={navUser} setShowAuth={setShowAuth} /><Footer setPage={setPage} /></>}
      {page === "experiences" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 40, fontWeight: 700, marginBottom: 12 }}>All Experiences</h1>
          <p style={{ color: COLORS.textMuted, marginBottom: 36 }}>Discover curated private dining experiences for every occasion</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
            {chefs.flatMap(c => c.menus.map(m => ({ menu: m, chef: c }))).map(({ menu, chef }) => (
              <div key={menu+chef.id} className="card" style={{ cursor: "pointer" }} onClick={() => { setSelectedChef(chef); setPage("chef-profile"); }}>
                <div style={{ height: 140, background: `linear-gradient(135deg, ${COLORS.dark}22, ${COLORS.primary}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                  {["🍛","🦞","🔥","🍝","🥘","🍰","🫕","🍖","🥗","🦑","🥩","🍤","🍜","🥘"][Math.floor(Math.random()*14)]}
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{menu}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: COLORS.textMuted }}>by {chef.name}</span>
                    <Badge type={chef.type} />
                  </div>
                  <div style={{ marginTop: 12, fontSize: 16, fontWeight: 700, color: COLORS.primary }}>LKR {chef.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {page === "pricing" && <><PricingPage /><Footer setPage={setPage} /></>}
      {page === "ai-menu" && <><AIMenuPage /><Footer setPage={setPage} /></>}
      {page === "about" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 42, fontWeight: 700, marginBottom: 20 }}>About ChefAtHome</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>Sri Lanka's first premium private chef booking platform, connecting food lovers with verified professional chefs for unforgettable home dining experiences.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[["🎯","Our Mission","Make luxury private dining accessible to every Sri Lankan household"],["👁️","Our Vision","Sri Lanka's most trusted private dining platform serving 10,000+ homes"],["💎","Our Values","Trust, quality, convenience, and extraordinary culinary experiences"]].map(([icon,title,desc]) => (
              <div key={title} style={{ background: "white", borderRadius: 16, padding: 28, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {page === "dashboard" && <CustomerDashboard user={navUser} />}
      {page === "chef-panel" && <ChefPanel user={navUser} />}
      {page === "admin" && <AdminPanel />}
      {showAuth && <AuthModal mode={showAuth} setMode={setShowAuth} onClose={() => setShowAuth(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
