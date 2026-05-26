<<<<<<< HEAD
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL   = "judethayaan@gmail.com";
const PAYHERE_MERCHANT_ID = "1227XXX";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const K = {
  session:"cah_session", users:"cah_users", bookings:"cah_bookings",
  proposals:"cah_proposals", reviews:"cah_reviews", settings:"cah_settings",
  apps:"cah_chef_apps", chefFees:"cah_chef_fees", feeSugs:"cah_fee_sugs",
  dynamicChefs:"cah_dynamic_chefs",
  activityLog:"cah_activity_log",
};
const ls = {
  get: (k, fb=null) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } },
  set: (k, v)       => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  rm:  (k)          => { try { localStorage.removeItem(k); } catch {} },
};

// ─── Storage Helpers ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { commissionRate:10, safetyHoldRate:10, cancellationWindowHours:48, extraPerGuest:2000 };
const loadSettings  = ()  => ({ ...DEFAULT_SETTINGS, ...ls.get(K.settings, {}) });
const saveSettings  = (s) => ls.set(K.settings, s);
const loadUsers     = ()  => ls.get(K.users, []);
const saveUsers     = (u) => ls.set(K.users, u);
const loadBookings  = ()  => ls.get(K.bookings, []);
const saveBookings  = (b) => ls.set(K.bookings, b);
const addBooking    = (b) => { const all=loadBookings(); all.push(b); saveBookings(all); };
const updateBooking = (id, patch) => { saveBookings(loadBookings().map(b=>b.id===id?{...b,...patch}:b)); };
const loadProposals = ()  => ls.get(K.proposals, []);
const saveProposals = (p) => ls.set(K.proposals, p);
const addProposal   = (p) => { const all=loadProposals(); all.push(p); saveProposals(all); };
const updateProposal= (id, patch) => { saveProposals(loadProposals().map(p=>p.id===id?{...p,...patch}:p)); };
const loadReviews   = ()  => ls.get(K.reviews, []);
const addReview     = (r) => { const all=loadReviews(); all.push(r); ls.set(K.reviews, all); };
const loadApps      = ()  => ls.get(K.apps, []);
const saveApps      = (a) => ls.set(K.apps, a);
const loadChefFees  = ()  => ls.get(K.chefFees, {});
const saveChefFees  = (f) => ls.set(K.chefFees, f);
const loadFeeSugs      = ()  => ls.get(K.feeSugs, []);
const saveFeeSugs      = (f) => ls.set(K.feeSugs, f);
const loadDynamicChefs = ()  => ls.get(K.dynamicChefs, []);
const saveDynamicChefs = (c) => ls.set(K.dynamicChefs, c);
const addDynamicChef   = (c) => { const all=loadDynamicChefs(); if(!all.find(x=>x.email===c.email)){ all.push(c); saveDynamicChefs(all); } };
const loadActivityLog  = ()  => ls.get(K.activityLog, []);
const addActivityEvent = (ev) => { const all=loadActivityLog(); all.push({...ev, at:new Date().toISOString()}); if(all.length>500) all.splice(0, all.length-500); ls.set(K.activityLog, all); };

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://fhvwafasykldkuaqrelz.supabase.co";
const SB_KEY = "sb_publishable_YQEb39B1Xxp5qdSYX5ZeAw_cxPQlyyJ";
const sb = (() => {
  const h = { "Content-Type":"application/json", apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}` };
  const req = async (path,method="GET",body=null,extra={}) => {
    const r = await fetch(`${SB_URL}${path}`,{method,headers:{...h,...extra},body:body?JSON.stringify(body):undefined});
    const d = await r.json(); if(!r.ok) throw d; return d;
  };
  return {
    signUp:       (e,p,m={}) => req("/auth/v1/signup","POST",{email:e,password:p,data:m}),
    signIn:       (e,p)      => req("/auth/v1/token?grant_type=password","POST",{email:e,password:p}),
    signOut:      (t)        => req("/auth/v1/logout","POST",null,{Authorization:`Bearer ${t}`}),
    getUser:      (t)        => req("/auth/v1/user","GET",null,{Authorization:`Bearer ${t}`}),
    reset:        (e)        => req("/auth/v1/recover","POST",{email:e}),
    signInGoogle: ()         => {
      const redirectTo = window.location.href;
      window.location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    },
  };
})();

<<<<<<< HEAD
// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null);
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [loginKey, setLoginKey] = useState(0);

  const formatUser = useCallback((ud) => {
    const email = ud.email;
    let role = ud.user_metadata?.role || "customer";
    if (email === SUPER_ADMIN_EMAIL) role = "super_admin";
    const stored = loadUsers().find(u => u.email === email);
    if (stored?.role && role !== "super_admin") role = stored.role;
    return {
      id: ud.id, email,
      name: ud.user_metadata?.full_name || ud.user_metadata?.name
            || email.split("@")[0].replace(/\./g," ").replace(/\b\w/g,c=>c.toUpperCase()),
      role,
    };
  }, []);

  const ensureStore = useCallback((email, name, role) => {
    const users = loadUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx < 0) {
      users.push({email, name, role, joinedAt:new Date().toISOString()});
    } else {
      if (name && !users[idx].name) users[idx].name = name;
      if (!users[idx].joinedAt) users[idx].joinedAt = new Date().toISOString();
      if (role !== "super_admin" && !users[idx].role) users[idx].role = role;
    }
    saveUsers(users);
    window.dispatchEvent(new StorageEvent("storage", {key: "cah_users"}));
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#","?"));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token) {
        const sessionData = { access_token, refresh_token };
        sb.getUser(access_token)
          .then(ud => {
            ls.set(K.session, sessionData); setSession(sessionData);
            const u = formatUser(ud); setUser(u); ensureStore(u.email, u.name, u.role);
            setLoginKey(k=>k+1);
            window.history.replaceState(null, "", window.location.pathname);
          })
          .catch(()=>{})
          .finally(()=>setLoading(false));
        return;
      }
    }
    const stored = ls.get(K.session);
    if (stored?.access_token) {
      sb.getUser(stored.access_token)
        .then(ud => { setSession(stored); const u=formatUser(ud); setUser(u); ensureStore(u.email,u.name,u.role); })
        .catch(() => ls.rm(K.session))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    const data = await sb.signIn(email, password);
    if (!data.access_token) throw new Error(data.error_description||"Login failed");
    ls.set(K.session, data); setSession(data);
    const ud = await sb.getUser(data.access_token);
    const u = formatUser(ud); setUser(u);
    ensureStore(u.email, u.name, u.role); // ensureStore now dispatches storage event
    addActivityEvent({type:"login", email:u.email, name:u.name});
    setLoginKey(k=>k+1); return u;
  };
  const signUp = async (email, password, name) => {
    const data = await sb.signUp(email, password, {full_name:name,role:"customer"});
    if (data.error) throw new Error(data.error.message||"Signup failed");
    const users = loadUsers();
    if (!users.find(u=>u.email===email)) {
      users.push({email,name,role:"customer",joinedAt:new Date().toISOString()});
      saveUsers(users);
      addActivityEvent({type:"signup", email, name});
      window.dispatchEvent(new StorageEvent("storage",{key:K.users}));
    }
    if (data.access_token) { ls.set(K.session,data); setSession(data); const ud=await sb.getUser(data.access_token); setUser(formatUser(ud)); setLoginKey(k=>k+1); }
    return data;
  };
  const signOut = async () => {
    if (session?.access_token) await sb.signOut(session.access_token).catch(()=>{});
    ls.rm(K.session); setSession(null); setUser(null); setLoginKey(k=>k+1);
  };
  const setRole = (email, role) => {
    const users = loadUsers();
    const i = users.findIndex(u=>u.email===email);
    if (i>=0) { users[i].role=role; saveUsers(users); }
    else { users.push({email,role,joinedAt:new Date().toISOString()}); saveUsers(users); }
  };

  return (
    <AuthCtx.Provider value={{session,user,loading,loginKey,signIn,signUp,signOut,setRole,
      resetPassword:(e)=>sb.reset(e) }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Design ───────────────────────────────────────────────────────────────────
const C = {
  primary:"#E8743B", primaryDark:"#C95E28", primaryLight:"#FFF1EB",
  dark:"#1C1917", darkNav:"#111827", text:"#292524", muted:"#78716C",
  surface:"#FAFAF9", border:"#E7E5E4",
  success:"#16A34A", successBg:"#DCFCE7",
  warn:"#D97706",   warnBg:"#FEF3C7",
  info:"#2563EB",   infoBg:"#DBEAFE",
  danger:"#DC2626", dangerBg:"#FEE2E2",
  gold:"#F59E0B", purple:"#7C3AED", purpleBg:"#EDE9FE",
};
const F = { heading:"'Playfair Display',Georgia,serif", body:"'DM Sans','Segoe UI',sans-serif" };

const OCCASIONS = [
  "Birthday Party","Anniversary Dinner","Romantic Date Night","Family Gathering",
  "Corporate Lunch / Dinner","Wedding Reception / Pre-Wedding","Baby Shower",
  "Graduation Celebration","House Warming","Farewell Party","Kids Birthday Party",
  "New Year / Holiday Dinner","Engagement Party","Bachelorette Party","Friday Night Dinner",
  "Sunday Brunch","Dinner Party","Office Celebration",
];

// ─── Chef Data (anonymized, "Starting from" pricing) ──────────────────────────
// Price shown = minimum starting price; actual price set by chef proposal
const CHEFS_DATA = [
  {id:1, alias:"Chef A", type:"premium",  rating:4.9, reviews:120, experience:"8+ Years",  location:"Colombo",       specialties:["Sri Lankan","Indian","BBQ","Seafood","Italian"], image:"CA", dinners:1000, badge:"Top Rated", bio:"Former head chef at a luxury 5-star hotel with expertise in fine dining and premium private events.",       menus:["Seafood Experience","Romantic Dinner","Italian Night","Luxury BBQ","Sri Lankan Feast"],        startingFrom:30000},
  {id:2, alias:"Chef B", type:"premium",  rating:4.8, reviews:98,  experience:"6 Years",   location:"Mount Lavinia", specialties:["Seafood","Continental","Fusion"],               image:"CB", dinners:650,  badge:"Premium",   bio:"Specialist in coastal cuisine with a creative twist. Trained at a luxury resort in Maldives.",               menus:["Fresh Seafood Platter","Coastal BBQ","Fusion Tasting Menu"],            startingFrom:28000},
  {id:3, alias:"Chef C", type:"premium",  rating:4.9, reviews:88,  experience:"5 Years",   location:"Rajagiriya",    specialties:["Italian","Mediterranean","Desserts"],           image:"CC", dinners:480,  badge:"Premium",   bio:"Italian cuisine expert trained in Florence. Creates authentic pasta, risotto and tiramisu.",                  menus:["Italian Night","Mediterranean Feast","Dessert Experience"],             startingFrom:25000},
  {id:4, alias:"Chef D", type:"standard", rating:4.7, reviews:76,  experience:"4 Years",   location:"Battaramulla",  specialties:["Biriyani","Sri Lankan","BBQ"],                  image:"CD", dinners:380,  badge:"Verified",  bio:"Master of traditional Sri Lankan cuisine and authentic biriyani. Perfect for family gatherings.",              menus:["Biriyani Feast","Sri Lankan Home Food","BBQ Night"],                    startingFrom:8000},
  {id:5, alias:"Chef E", type:"standard", rating:4.6, reviews:54,  experience:"3 Years",   location:"Nugegoda",      specialties:["Sri Lankan","Vegetarian","South Indian"],       image:"CE", dinners:220,  badge:"Verified",  bio:"Passionate about traditional recipes. Specializes in vegetarian and healthy options.",                       menus:["Traditional Rice & Curry","South Indian Feast","Vegetarian Spread"],    startingFrom:6000},
  {id:6, alias:"Chef F", type:"standard", rating:4.8, reviews:61,  experience:"4 Years",   location:"Nawala",        specialties:["BBQ","Burgers","Grills"],                       image:"CF", dinners:290,  badge:"Verified",  bio:"BBQ and grill specialist who transforms backyards into restaurant-quality dining experiences.",                menus:["BBQ Party","Grill Night","Family BBQ"],                                 startingFrom:10000},
];

// Merge static + approved dynamic chefs — always reads fresh from localStorage
const getAllChefs = () => {
  const dynamic = loadDynamicChefs();
  const removedIds = ls.get("cah_removed_chefs", []);
  const staticChefs = CHEFS_DATA.filter(c => !removedIds.includes(c.id));
  const newChefs = dynamic.filter(d =>
    !CHEFS_DATA.find(c => c.alias === d.alias) && !removedIds.includes(d.id)
  );
  return [...staticChefs, ...newChefs];
};
// Alias for clarity — same function, guarantees fresh read
const getActiveChefs = getAllChefs;

const EXPERIENCES = [
  {name:"Biriyani Feast",   rating:4.9, count:120, chef:"Chef D", type:"standard", emoji:"🍛"},
  {name:"Romantic Dinner",  rating:4.8, count:89,  chef:"Chef A", type:"premium",  emoji:"🕯️"},
  {name:"BBQ Party",        rating:4.7, count:84,  chef:"Chef F", type:"standard", emoji:"🔥"},
  {name:"Family Gathering", rating:4.9, count:91,  chef:"Chef B", type:"premium",  emoji:"🍽️"},
];

const REV_DATA = [
  {month:"Jan",revenue:320000,bookings:18},{month:"Feb",revenue:480000,bookings:24},
  {month:"Mar",revenue:560000,bookings:31},{month:"Apr",revenue:720000,bookings:42},
  {month:"May",revenue:1250000,bookings:128},
];

// ─── Booking Status Helpers ───────────────────────────────────────────────────
const STATUS_LABELS = {
  pending_proposal: "Awaiting Proposal",
  proposal_submitted: "Proposal Sent",
  proposal_accepted: "Proposal Ready — Pay Now",
  proposal_rejected: "Proposal Declined",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_COLORS = {
  pending_proposal: { bg:C.warnBg,    color:C.warn   },
  proposal_submitted:{ bg:C.infoBg,   color:C.info   },
  proposal_accepted: { bg:C.successBg,color:C.success },
  proposal_rejected: { bg:C.dangerBg, color:C.danger  },
  confirmed:         { bg:C.successBg,color:C.success },
  completed:         { bg:C.infoBg,   color:C.info    },
  cancelled:         { bg:C.dangerBg, color:C.danger  },
};

const isBookingPast = (b) => { if(!b.isoDateTime) return false; return new Date(b.isoDateTime)<new Date(); };
const validatePhone  = (p) => /^\+94[0-9]{9}$/.test(p.replace(/\s/g,""));
const fmtLKR         = (n) => `LKR ${Number(n||0).toLocaleString()}`;
const genId          = ()  => `${Date.now().toString(36).toUpperCase()}`;

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${F.body};color:${C.text};background:${C.surface}}
  button{cursor:pointer;font-family:${F.body};border:none}
  input,select,textarea{font-family:${F.body}}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
  .nav-link{color:rgba(255,255,255,.8);font-size:14px;font-weight:500;transition:color .2s;padding:6px 0;cursor:pointer}.nav-link:hover{color:white}
  .btn-primary{background:${C.primary};color:white;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;transition:all .2s;border:none}
  .btn-primary:hover{background:${C.primaryDark};transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,116,59,.4)}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
  .btn-outline{background:transparent;color:${C.primary};padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;border:2px solid ${C.primary};transition:all .2s}
  .btn-outline:hover{background:${C.primary};color:white}
  .btn-ghost{background:rgba(255,255,255,.15);color:white;padding:10px 22px;border-radius:8px;font-weight:600;font-size:14px;transition:all .2s;border:none}.btn-ghost:hover{background:rgba(255,255,255,.25)}
  .card{background:white;border-radius:16px;border:1px solid ${C.border};overflow:hidden;transition:all .3s}.card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.1)}
  .badge-premium{background:linear-gradient(135deg,#B45309,#D97706);color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .badge-standard,.badge-local{background:${C.successBg};color:${C.success};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .badge-verified{background:${C.infoBg};color:${C.info};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .star{color:${C.gold}}
  .input{width:100%;padding:10px 14px;border:1.5px solid ${C.border};border-radius:8px;font-size:14px;outline:none;transition:border .2s;background:white}
  .input:focus{border-color:${C.primary}}.input.error{border-color:${C.danger}}
  .label{font-size:13px;font-weight:600;color:${C.muted};margin-bottom:6px;display:block;letter-spacing:.3px}
  .sidebar-link{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:8px;color:rgba(255,255,255,.65);font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
  .sidebar-link:hover{background:rgba(255,255,255,.1);color:white}.sidebar-link.active{background:${C.primary};color:white}
  .tab{padding:8px 18px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;border:none;background:transparent;color:${C.muted}}
  .tab.active{background:${C.primary};color:white}.tab:hover:not(.active){background:${C.primaryLight};color:${C.primary}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .4s ease forwards}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.pulse{animation:pulse 1.5s ease-in-out infinite}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
  .modal{background:white;border-radius:20px;padding:32px;width:480px;max-width:95vw;position:relative;animation:fadeUp .3s ease;max-height:92vh;overflow-y:auto}
  .modal-wide{background:white;border-radius:20px;padding:32px;width:700px;max-width:96vw;position:relative;animation:fadeUp .3s ease;max-height:92vh;overflow-y:auto}
  @media(max-width:768px){.hide-mobile{display:none!important}.modal{padding:20px!important}}
  .ai-bubble{background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:20px;color:white;border:1px solid rgba(232,116,59,.3)}
  .typing-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.primary};margin:0 2px;animation:pulse 1s ease-in-out infinite}
  .typing-dot:nth-child(2){animation-delay:.2s}.typing-dot:nth-child(3){animation-delay:.4s}
  .cal-day{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;border:1.5px solid transparent;margin:0 auto}
  .cal-day:hover:not(.cal-dis):not(.cal-sel){background:${C.primaryLight};color:${C.primary};border-color:${C.primary}}
  .cal-sel{background:${C.primary}!important;color:white!important;border-color:${C.primary}!important}
  .cal-today{border-color:${C.primary};color:${C.primary};font-weight:700}.cal-dis{color:#ccc;cursor:not-allowed}
  .upload-zone{border:2px dashed ${C.border};border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:all .2s;background:${C.surface}}
  .upload-zone:hover,.upload-zone.has-file{border-color:${C.success};background:${C.successBg}}
  .req{color:${C.danger};margin-left:2px}
  .payhere-badge{background:linear-gradient(135deg,#0055CC,#0077FF);color:white;font-weight:800;font-size:14px;padding:5px 12px;border-radius:6px}
  .proposal-badge{background:linear-gradient(135deg,${C.purple},#6D28D9);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
  .maint-admin-badge{background:linear-gradient(135deg,#0284C7,#0EA5E9);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
`;

// ─── Utility Components ───────────────────────────────────────────────────────
const Avatar = ({initials,size=48,color=C.primary}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:size*.35,flexShrink:0}}>{initials}</div>
);
const Stars = ({value=5,count=5}) => <span>{Array.from({length:count},(_,i)=><span key={i} className="star">{i<Math.floor(value)?"★":"☆"}</span>)}</span>;
const Badge = ({type}) => {
  const map={premium:"badge-premium",standard:"badge-standard",local:"badge-standard",verified:"badge-verified","Top Rated":"badge-premium",Premium:"badge-premium",Verified:"badge-verified"};
  const label=type==="local"?"Standard":type==="standard"?"Standard":type;
  return <span className={map[type]||"badge-standard"}>{label}</span>;
};
const BookingStatusBadge = ({status}) => {
  const s = STATUS_COLORS[status]||{bg:C.surface,color:C.muted};
  return <span style={{background:s.bg,color:s.color,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{STATUS_LABELS[status]||status}</span>;
};
const MetricCard = ({label,value,sub,color=C.primary}) => (
  <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:"18px 22px"}}>
    <div style={{fontSize:13,color:C.muted,marginBottom:5,fontWeight:500}}>{label}</div>
    <div style={{fontSize:24,fontWeight:700,color,fontFamily:F.heading}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.success,marginTop:4}}>{sub}</div>}
  </div>
);
const RL = ({children,req=true}) => <label className="label">{children}{req&&<span className="req">*</span>}</label>;
const CloseBtn = ({onClick}) => <button onClick={onClick} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:C.muted,cursor:"pointer"}}>✕</button>;

// ─── Calendar Picker ──────────────────────────────────────────────────────────
function CalendarPicker({value,onChange}) {
  const today=new Date();
  const [yr,setYr]=useState(today.getFullYear());
  const [mo,setMo]=useState(today.getMonth());
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const first=new Date(yr,mo,1).getDay(); const total=new Date(yr,mo+1,0).getDate();
  const prevMo=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);};
  const nextMo=()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const pick=(d)=>{
    if(new Date(yr,mo,d)<new Date(today.getFullYear(),today.getMonth(),today.getDate())) return;
    onChange(`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  };
  const sel=value?value.split("-").map(Number):null;
  const isSel=(d)=>sel&&sel[0]===yr&&sel[1]===mo+1&&sel[2]===d;
  const isToday=(d)=>today.getFullYear()===yr&&today.getMonth()===mo&&today.getDate()===d;
  const isPast=(d)=>new Date(yr,mo,d)<new Date(today.getFullYear(),today.getMonth(),today.getDate());
  return(
    <div style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:12,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <button onClick={prevMo} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:17,fontWeight:700}}>‹</button>
        <span style={{fontWeight:700,fontSize:14,fontFamily:F.heading}}>{MONTHS[mo]} {yr}</span>
        <button onClick={nextMo} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:17,fontWeight:700}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:3}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,padding:"3px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:first}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:total},(_,i)=>i+1).map(d=>(
          <div key={d} className={`cal-day${isSel(d)?" cal-sel":""}${isToday(d)&&!isSel(d)?" cal-today":""}${isPast(d)?" cal-dis":""}`} onClick={()=>pick(d)}>{d}</div>
        ))}
      </div>
      {value&&<div style={{marginTop:8,padding:"5px 10px",background:C.primaryLight,borderRadius:6,fontSize:12,color:C.primary,fontWeight:600,textAlign:"center"}}>📅 {new Date(value+"T00:00:00").toLocaleDateString("en-LK",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>}
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    </div>
  );
}

<<<<<<< HEAD
// ─── PayHere Modal ────────────────────────────────────────────────────────────
function PayHereModal({amount,breakdown,onSuccess,onClose}) {
  const [form,setForm]=useState({firstName:"",lastName:"",email:"",phone:"",address:"",city:""});
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [errors,setErrors]=useState({});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const validate=()=>{
    const e={};
    if(!form.firstName.trim()) e.firstName="Required";
    if(!form.lastName.trim())  e.lastName="Required";
    if(!form.email.includes("@")) e.email="Valid email required";
    if(!validatePhone(form.phone)) e.phone="+94 then 9 digits";
    if(!form.address.trim()) e.address="Required";
    if(!form.city.trim())    e.city="Required";
    setErrors(e); return Object.keys(e).length===0;
  };
  const pay=()=>{ if(!validate()) return; setLoading(true); setTimeout(()=>{setLoading(false);setStep(2);},2200); };

  if(step===2) return(
    <div className="modal-overlay"><div className="modal" style={{textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:12}}>✅</div>
      <h2 style={{fontFamily:F.heading,fontSize:24,marginBottom:8}}>Payment Successful!</h2>
      <p style={{color:C.muted,marginBottom:6}}>Amount paid: <strong>{fmtLKR(amount)}</strong></p>
      <p style={{color:C.muted,fontSize:12,marginBottom:20}}>Transaction: PAY-{Date.now().toString().slice(-8)}</p>
      <div style={{background:C.successBg,borderRadius:10,padding:14,marginBottom:18,textAlign:"left",fontSize:13}}>
        {Object.entries(breakdown).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid rgba(0,0,0,.04)`}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
      </div>
      <button className="btn-primary" style={{width:"100%",padding:13}} onClick={onSuccess}>Continue →</button>
    </div></div>
  );
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <CloseBtn onClick={onClose}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span className="payhere-badge">PAY HERE</span><div><div style={{fontWeight:700,fontSize:14}}>Secure Checkout</div><div style={{fontSize:12,color:C.muted}}>Sri Lanka's trusted gateway</div></div></div>
        <div style={{background:C.primaryLight,borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Total</span><span style={{fontFamily:F.heading,fontSize:20,color:C.primary,fontWeight:700}}>{fmtLKR(amount)}</span></div>
        <div style={{background:C.surface,borderRadius:8,padding:"9px 12px",marginBottom:12,fontSize:12}}>
          {Object.entries(breakdown).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",color:C.muted}}><span>{k}</span><span style={{fontWeight:600,color:C.text}}>{v}</span></div>)}
        </div>
        <div style={{display:"grid",gap:9}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            <div><RL>First Name</RL><input className={`input${errors.firstName?" error":""}`} value={form.firstName} onChange={e=>upd("firstName",e.target.value)} placeholder="Nimal"/>{errors.firstName&&<span style={{fontSize:11,color:C.danger}}>{errors.firstName}</span>}</div>
            <div><RL>Last Name</RL><input className={`input${errors.lastName?" error":""}`} value={form.lastName} onChange={e=>upd("lastName",e.target.value)} placeholder="Perera"/>{errors.lastName&&<span style={{fontSize:11,color:C.danger}}>{errors.lastName}</span>}</div>
          </div>
          <div><RL>Email</RL><input className={`input${errors.email?" error":""}`} type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="nimal@email.com"/>{errors.email&&<span style={{fontSize:11,color:C.danger}}>{errors.email}</span>}</div>
          <div><RL>Phone (+94XXXXXXXXX)</RL><input className={`input${errors.phone?" error":""}`} value={form.phone} onChange={e=>upd("phone",e.target.value)} placeholder="+94771234567"/>{errors.phone&&<span style={{fontSize:11,color:C.danger}}>{errors.phone}</span>}</div>
          <div><RL>Address</RL><input className={`input${errors.address?" error":""}`} value={form.address} onChange={e=>upd("address",e.target.value)} placeholder="No. 25, Flower Road"/>{errors.address&&<span style={{fontSize:11,color:C.danger}}>{errors.address}</span>}</div>
          <div><RL>City</RL><input className={`input${errors.city?" error":""}`} value={form.city} onChange={e=>upd("city",e.target.value)} placeholder="Colombo"/>{errors.city&&<span style={{fontSize:11,color:C.danger}}>{errors.city}</span>}</div>
        </div>
        <div style={{marginTop:10,padding:"7px 11px",background:C.infoBg,borderRadius:8,fontSize:12,color:C.info}}>🔒 256-bit SSL secured · Powered by PayHere</div>
        <button onClick={pay} disabled={loading} style={{width:"100%",padding:13,marginTop:12,background:"#0055CC",color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:15,cursor:"pointer",opacity:loading?.7:1}}>
          {loading?"⏳ Processing...":`${fmtLKR(amount)} — Pay Now →`}
        </button>
      </div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    </div>
  );
}

<<<<<<< HEAD
// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({booking,onClose}) {
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");
  const [done,setDone]=useState(false);
  const submit=()=>{
    addReview({id:genId(),bookingId:booking.id,chefId:booking.chefId,chefAlias:booking.chefAlias,customerEmail:booking.customerEmail,rating,comment,createdAt:new Date().toISOString()});
    updateBooking(booking.id,{reviewed:true});
    setDone(true);
  };
  if(done) return(<div className="modal-overlay"><div className="modal" style={{textAlign:"center"}}><div style={{fontSize:56,marginBottom:12}}>⭐</div><h3 style={{fontFamily:F.heading,fontSize:22,marginBottom:8}}>Review Submitted!</h3><p style={{color:C.muted,marginBottom:20}}>Thank you for your feedback.</p><button className="btn-primary" style={{padding:"10px 28px"}} onClick={onClose}>Close</button></div></div>);
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <CloseBtn onClick={onClose}/>
        <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:6}}>Rate Your Experience</h2>
        <p style={{color:C.muted,fontSize:14,marginBottom:16}}>How was your dining experience with <strong>{booking.chefAlias}</strong>?</p>
        <div style={{display:"flex",gap:10,marginBottom:14,justifyContent:"center"}}>
          {[1,2,3,4,5].map(n=><div key={n} onClick={()=>setRating(n)} style={{fontSize:36,cursor:"pointer",filter:n<=rating?"none":"grayscale(1)",transition:"all .15s"}}>⭐</div>)}
        </div>
        <div style={{textAlign:"center",fontSize:14,color:C.muted,marginBottom:12}}>{["","Poor","Fair","Good","Very Good","Excellent!"][rating]}</div>
        <div><RL req={false}>Your Review (Optional)</RL><textarea className="input" rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Tell others about your experience..." style={{resize:"none"}}/></div>
        <button className="btn-primary" style={{width:"100%",padding:13,marginTop:13}} onClick={submit}>Submit Review →</button>
      </div>
    </div>
  );
}

// ─── AI Menu Assistant ────────────────────────────────────────────────────────
function AIMenuAssistant() {
  const [occasion,setOccasion]=useState("");
  const [guests,setGuests]=useState("4");
  const [chefType,setChefType]=useState("any");
  const [pkg,setPkg]=useState("any");
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const getSuggestions=async()=>{
    if(!occasion) return; setLoading(true);setResults([]);setError("");
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1800,messages:[{role:"user",content:`You are a private dining consultant for ChefAtHome Sri Lanka.
Occasion: ${occasion} | Guests: ${guests} | Chef: ${chefType==="any"?"Any":chefType==="premium"?"Premium Chef":"Standard Chef"} | Package: ${pkg==="any"?"Any":pkg==="all-inclusive"?"All Inclusive":"Cook-at-Home"}

Generate 2 personalised Sri Lankan menu recommendations. Respond ONLY with valid JSON array (no markdown):
[{"menuName":"name","chefType":"Premium Chef or Standard Chef","estimatedPriceRange":"LKR X,XXX – Y,XXX","packageType":"All Inclusive or Cook-at-Home","courses":["dish1","dish2","dish3","dish4","dish5"],"beverages":["drink1","drink2"],"chefTip":"tip","ambiance":"setup description","estimatedDuration":"X hours"}]`}]})
      });
      const data=await resp.json();
      if(data.error) throw new Error(data.error.message);
      const text=data.content?.find(b=>b.type==="text")?.text||"[]";
      setResults(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch(e){
      setError("AI service unavailable — showing sample menus.");
      setResults([
        {menuName:"Sri Lankan Heritage Feast",chefType:"Premium Chef",estimatedPriceRange:"LKR 35,000 – 55,000",packageType:"All Inclusive",courses:["Pol Sambol & Papadums","Mulligatawny Soup","Slow-Cooked Chicken Curry","Coconut Dhal & Rice","Watalappan"],beverages:["King Coconut Water","Ceylon Herbal Tea"],chefTip:"Pre-order fresh spices 2 days ahead.",ambiance:"Banana leaf presentation with candlelight",estimatedDuration:"3 hours"},
        {menuName:"Garden BBQ Party",chefType:"Standard Chef",estimatedPriceRange:"LKR 12,000 – 22,000",packageType:"Cook-at-Home",courses:["Mezze Platter","Seekh Kebabs","Grilled Chicken","Corn on Cob","Ice-Cream"],beverages:["Lemonade","Sparkling Water"],chefTip:"Set up outdoor seating before chef arrives.",ambiance:"Casual outdoor with ambient lighting",estimatedDuration:"2.5 hours"}
      ]);
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    }
    setLoading(false);
  };

<<<<<<< HEAD
  return(
    <div style={{background:"white",borderRadius:20,border:`1px solid ${C.border}`,padding:30,maxWidth:740,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#1e293b,#E8743B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✨</div>
        <div><div style={{fontFamily:F.heading,fontSize:22,fontWeight:700}}>AI Menu Planner</div><div style={{fontSize:13,color:C.muted}}>Get personalised menu suggestions with price ranges</div></div>
      </div>
      <div style={{display:"grid",gap:12,marginBottom:14}}>
        <div><RL>Select Your Occasion</RL><select className="input" value={occasion} onChange={e=>setOccasion(e.target.value)}><option value="">— Choose an occasion —</option>{OCCASIONS.map(o=><option key={o}>{o}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div><RL req={false}>Guests</RL><select className="input" value={guests} onChange={e=>setGuests(e.target.value)}>{["2","3","4","5","6","8","10","12","15","20","25","30+"].map(n=><option key={n}>{n}</option>)}</select></div>
          <div><RL req={false}>Chef Type</RL><select className="input" value={chefType} onChange={e=>setChefType(e.target.value)}><option value="any">Any</option><option value="premium">Premium</option><option value="standard">Standard</option></select></div>
          <div><RL req={false}>Service Type</RL><select className="input" value={pkg} onChange={e=>setPkg(e.target.value)}><option value="any">Either</option><option value="all-inclusive">All Inclusive</option><option value="cook-at-home">Cook-at-Home</option></select></div>
        </div>
      </div>
      <button className="btn-primary" style={{width:"100%",padding:"12px",fontSize:15}} onClick={getSuggestions} disabled={loading||!occasion}>{loading?"✨ Crafting menus...":"✨ Get AI Menu Recommendations"}</button>
      {error&&<div style={{marginTop:9,padding:"7px 12px",background:C.warnBg,borderRadius:8,fontSize:12,color:C.warn}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:"center",padding:"24px 0"}}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/><div style={{color:C.muted,fontSize:13,marginTop:9}}>Crafting menus for your {occasion}…</div></div>}
      {results.length>0&&!loading&&(
        <div className="fade-up" style={{marginTop:20,display:"grid",gap:16}}>
          {results.map((r,i)=>(
            <div key={i} className="ai-bubble">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div><div style={{fontFamily:F.heading,fontSize:19,color:"white",marginBottom:4}}>{r.menuName}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:12}}>{r.ambiance}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontFamily:F.heading,fontSize:16,color:C.primary,fontWeight:700}}>{r.estimatedPriceRange}</div><div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{r.packageType} · {r.estimatedDuration}</div></div>
              </div>
              <div style={{display:"flex",gap:7,marginBottom:11,flexWrap:"wrap"}}>
                <span style={{background:"rgba(232,116,59,.25)",color:C.primary,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{r.chefType}</span>
                <span style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.8)",padding:"3px 10px",borderRadius:20,fontSize:12}}>{guests} guests</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
                {(r.courses||[]).map((c,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,.07)",borderRadius:8,padding:"7px 10px"}}><span style={{color:C.primary,fontWeight:700,fontSize:12,flexShrink:0}}>{j+1}.</span><span style={{fontSize:12,color:"rgba(255,255,255,.85)"}}>{c}</span></div>)}
              </div>
              {r.beverages?.length>0&&<div style={{display:"flex",gap:6,marginBottom:9,flexWrap:"wrap"}}>{r.beverages.map((b,j)=><span key={j} style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",padding:"3px 9px",borderRadius:20,fontSize:12}}>🥤 {b}</span>)}</div>}
              <div style={{background:"rgba(232,116,59,.15)",borderRadius:8,padding:"8px 12px",fontSize:12,border:"1px solid rgba(232,116,59,.3)"}}>
                <span style={{color:C.primary,fontWeight:600}}>👨‍🍳 Tip: </span><span style={{color:"rgba(255,255,255,.8)"}}>{r.chefTip}</span>
              </div>
            </div>
          ))}
          <p style={{fontSize:12,color:C.muted,textAlign:"center"}}>💡 Actual price confirmed by chef after booking. Price range is an estimate only.</p>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
        </div>
      )}
    </div>
  );
}

<<<<<<< HEAD
// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({page,setPage,user,onLogout,setShowAuth}) {
  const dashPage = user?.role==="super_admin"?"admin":user?.role==="maintenance_admin"?"maintenance-panel":user?.role==="chef"?"chef-panel":"dashboard";
  const dashLabel = user?.role==="super_admin"?"⚙️ Super Admin":user?.role==="maintenance_admin"?"🔧 M.Admin":user?.role==="chef"?"👨‍🍳 Panel":"Dashboard";
  return(
    <nav style={{background:C.darkNav,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,.2)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
        <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22,color:C.primary}}>🍽️</span><span style={{fontFamily:F.heading,fontWeight:700,fontSize:20,color:"white"}}>Chef<span style={{color:C.primary}}>at</span>Home</span></div>
        <div className="hide-mobile" style={{display:"flex",alignItems:"center",gap:22}}>
          {[["home","Home"],["chefs","Chefs"],["experiences","Experiences"],["pricing","Pricing"],["ai-menu","✨ AI Menu"],["about","About"]].map(([p,l])=><span key={p} className="nav-link" onClick={()=>setPage(p)} style={{color:page===p?C.primary:undefined}}>{l}</span>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          {user?(<><button className="btn-primary" style={{fontSize:13,padding:"7px 13px"}} onClick={()=>setPage(dashPage)}>{dashLabel}</button><Avatar initials={user.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"U"} size={32}/><button onClick={onLogout} style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.7)",padding:"6px 11px",borderRadius:6,fontSize:13,border:"none"}}>Logout</button></>):(<button className="btn-ghost" style={{padding:"7px 15px",fontSize:13}} onClick={()=>setShowAuth("login")}>Log In / Sign Up</button>)}
        </div>
      </div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    </nav>
  );
}

<<<<<<< HEAD
// ─── Public Pages ─────────────────────────────────────────────────────────────
function HeroSection({setPage}){return(<section style={{background:`linear-gradient(135deg,${C.dark} 0%,#2D1810 50%,#3D1F0D 100%)`,minHeight:"88vh",display:"flex",alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 70% 50%,rgba(232,116,59,.15) 0%,transparent 60%)"}}/><div style={{maxWidth:1200,margin:"0 auto",padding:"80px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}><div className="fade-up"><div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(232,116,59,.2)",border:"1px solid rgba(232,116,59,.4)",borderRadius:20,padding:"6px 14px",marginBottom:22}}><span style={{color:C.primary,fontSize:12,fontWeight:600,letterSpacing:1}}>✦ PREMIUM PRIVATE DINING</span></div><h1 style={{fontFamily:F.heading,fontSize:"clamp(34px,5vw,54px)",fontWeight:700,color:"white",lineHeight:1.15,marginBottom:18}}>Book a Private Chef for <em style={{color:C.primary}}>Unforgettable</em> Dining at Home</h1><p style={{color:"rgba(255,255,255,.65)",fontSize:16,lineHeight:1.7,marginBottom:32,maxWidth:480}}>Enjoy restaurant-quality meals prepared by verified professional chefs in the comfort of your home. Price confirmed by chef after booking.</p><div style={{display:"flex",gap:11,flexWrap:"wrap",marginBottom:36}}><button className="btn-primary" style={{padding:"13px 28px",fontSize:15}} onClick={()=>setPage("chefs")}>Book a Chef</button><button className="btn-ghost" style={{padding:"13px 28px",fontSize:15}} onClick={()=>setPage("ai-menu")}>✨ AI Menu Planner</button></div><div style={{display:"flex",gap:22,flexWrap:"wrap"}}>{[["✓ Verified Chefs","Background-checked"],["🛡️ Hygienic","Certified standards"],["⭐ 4.8/5 Rating","Satisfaction"]].map(([t,s])=><div key={t}><div style={{color:"white",fontSize:13,fontWeight:600}}>{t}</div><div style={{color:"rgba(255,255,255,.5)",fontSize:12}}>{s}</div></div>)}</div></div><div className="hide-mobile" style={{display:"flex",justifyContent:"center"}}><div style={{position:"relative"}}><div style={{width:380,height:420,borderRadius:24,background:"linear-gradient(135deg,#3D2010,#5C3020)",border:"1px solid rgba(232,116,59,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:32}}><div style={{fontSize:72}}>👨‍🍳</div><div style={{textAlign:"center"}}><div style={{fontFamily:F.heading,fontSize:18,color:"white",marginBottom:8}}>Private Chef Experience</div><div style={{color:C.primary,fontSize:13,marginBottom:14}}>⭐ 4.9 · 120+ Reviews · Verified</div><div style={{background:"rgba(232,116,59,.2)",borderRadius:10,padding:"8px 14px",color:"rgba(255,255,255,.8)",fontSize:12,marginBottom:14}}>💡 Chef sends you a personalised menu + price after booking</div><button className="btn-primary" style={{padding:"10px 26px"}} onClick={()=>setPage("chefs")}>Browse Chefs</button></div></div><div style={{position:"absolute",top:-18,right:-18,background:C.primary,borderRadius:12,padding:"9px 14px",color:"white",fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(232,116,59,.4)"}}>🎉 Just booked!</div></div></div></div></section>);}
function FeaturesRow(){return(<div style={{background:C.dark,padding:"26px 24px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18}}>{[["✓","Verified Chefs","Background-checked"],["💡","Proposal System","Chef sends menu & price"],["🍽️","Custom Menus","Tailored for your event"],["🧹","Hassle-Free","Cook, serve & clean"]].map(([ic,t,d])=><div key={t} style={{display:"flex",alignItems:"flex-start",gap:12}}><span style={{fontSize:20,flexShrink:0}}>{ic}</span><div><div style={{color:"white",fontWeight:600,fontSize:13}}>{t}</div><div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:2}}>{d}</div></div></div>)}</div></div>);}
function PopularExperiences({setPage}){return(<section style={{padding:"70px 24px",background:"white"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:36}}><div><div style={{color:C.primary,fontSize:13,fontWeight:600,letterSpacing:1,marginBottom:7}}>✦ EXPERIENCES</div><h2 style={{fontFamily:F.heading,fontSize:34,fontWeight:700}}>Popular Experiences</h2></div><button className="btn-outline" style={{fontSize:13}} onClick={()=>setPage("experiences")}>View All</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18}}>{EXPERIENCES.map(exp=><div key={exp.name} className="card" style={{cursor:"pointer"}} onClick={()=>setPage("chefs")}><div style={{height:140,background:`linear-gradient(135deg,${C.dark}22,${C.primary}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>{exp.emoji}</div><div style={{padding:14}}><div style={{fontFamily:F.heading,fontSize:15,fontWeight:600,marginBottom:4}}>{exp.name}</div><div style={{fontSize:12,color:C.muted,marginBottom:7}}>by {exp.chef}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><Stars value={exp.rating}/><span style={{fontSize:12,color:C.muted}}> ({exp.count})</span></div><div style={{fontSize:12,fontWeight:600,color:C.primary}}>Price on Request</div></div></div></div>)}</div></div></section>);}
function HowItWorks(){return(<section style={{padding:"70px 24px",background:C.surface}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{textAlign:"center",marginBottom:44}}><div style={{color:C.primary,fontSize:13,fontWeight:600,letterSpacing:1,marginBottom:7}}>✦ PROCESS</div><h2 style={{fontFamily:F.heading,fontSize:34,fontWeight:700}}>How It Works</h2></div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16}}>{[["🔍","Choose a Chef","Browse and request"],["📝","Chef Proposes","Menu & price sent"],["🔧","Admin Reviews","Maintenance admin approves"],["✅","You Approve & Pay","Confirm via PayHere"],["🍽️","Enjoy","Chef cooks, serves & cleans"]].map((s,i)=><div key={s[1]} style={{textAlign:"center",padding:"24px 16px",background:"white",borderRadius:16,border:`1px solid ${C.border}`,position:"relative"}}><div style={{width:52,height:52,borderRadius:"50%",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 12px"}}>{s[0]}</div><div style={{position:"absolute",top:14,left:14,width:22,height:22,borderRadius:"50%",background:C.primary,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{i+1}</div><div style={{fontFamily:F.heading,fontSize:15,fontWeight:600,marginBottom:6}}>{s[1]}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{s[2]}</div></div>)}</div></div></section>);}
function StatsRow(){return(<div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,padding:"36px 24px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18,textAlign:"center"}}>{[["500+","Happy Customers"],["50+","Verified Chefs"],["1000+","Completed Events"],["4.9/5","Customer Rating"]].map(([v,l])=><div key={l}><div style={{fontFamily:F.heading,fontSize:34,fontWeight:700,color:C.primary}}>{v}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:14,marginTop:4}}>{l}</div></div>)}</div></div>);}
function TrustSection(){return(<div style={{background:C.dark,padding:"36px 24px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:14,textAlign:"center"}}>{[["🛡️","Verified & Trusted"],["🔒","Secure Payments"],["⭐","Real Reviews"],["🕐","24/7 Support"],["🧼","Hygienic & Safe"],["🏆","Best Quality"]].map(([ic,t])=><div key={t}><div style={{fontSize:26,marginBottom:7}}>{ic}</div><div style={{color:"white",fontSize:12,fontWeight:600}}>{t}</div></div>)}</div></div>);}
function Footer({setPage}){return(<footer style={{background:C.dark,color:"rgba(255,255,255,.6)",padding:"44px 24px 22px"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:36,marginBottom:32}}><div><div style={{fontFamily:F.heading,fontSize:20,color:"white",marginBottom:10}}>Chef<span style={{color:C.primary}}>at</span>Home</div><p style={{fontSize:13,lineHeight:1.7,maxWidth:260}}>Sri Lanka's premier private chef booking platform.</p></div>{[["Platform",["Browse Chefs","Experiences","Pricing","AI Menu"]],["Support",["Help Centre","FAQs","Refund Policy","WhatsApp"]],["Legal",["Terms","Privacy","Chef Policy","Food Safety"]]].map(([t,ls])=><div key={t}><div style={{color:"white",fontWeight:600,marginBottom:11,fontSize:13}}>{t}</div>{ls.map(l=><div key={l} style={{fontSize:12,marginBottom:7,cursor:"pointer"}}>{l}</div>)}</div>)}</div><div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:18,display:"flex",justifyContent:"space-between",fontSize:12}}><span>© 2026 ChefAtHome. All rights reserved.</span><span>Made with ❤️ in Sri Lanka 🇱🇰</span></div></div></footer>);}

// ─── Chef Card & Pages ────────────────────────────────────────────────────────
function ChefCard({chef,onClick}){
  return(<div className="card" onClick={onClick} style={{cursor:"pointer"}}>
    <div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,height:140,display:"flex",alignItems:"center",justifyContent:"center",gap:14,padding:18,position:"relative"}}>
      <Avatar initials={chef.image} size={68} color={chef.type==="premium"?"#B45309":C.primary}/>
      <div><div style={{fontFamily:F.heading,fontSize:17,color:"white",fontWeight:600}}>{chef.alias}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:2}}>{chef.location}</div><div style={{marginTop:7}}><Badge type={chef.badge}/></div></div>
      {chef.type==="premium"&&<div style={{position:"absolute",top:11,right:11,background:C.gold,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,color:"#78350F"}}>PREMIUM</div>}
    </div>
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><div><Stars value={chef.rating}/><span style={{fontSize:13,fontWeight:600,marginLeft:5}}>{chef.rating}</span><span style={{fontSize:12,color:C.muted}}> ({chef.reviews})</span></div><div style={{fontSize:11,color:C.muted}}>{chef.experience}</div></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>{chef.specialties.slice(0,3).map(s=><span key={s} style={{background:C.primaryLight,color:C.primary,padding:"3px 7px",borderRadius:6,fontSize:11}}>{s}</span>)}</div>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:11,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:C.muted}}>Starting from</div><div style={{fontFamily:F.heading,fontSize:16,fontWeight:700,color:C.primary}}>{fmtLKR(chef.startingFrom)}</div><div style={{fontSize:10,color:C.muted}}>Actual price by chef proposal</div></div>
        <button className="btn-primary" style={{padding:"7px 14px",fontSize:12}}>Request Chef</button>
      </div>
    </div>
  </div>);
}

function ChefsPage({setPage,setSelectedChef}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  // Always read fresh — getAllChefs reads localStorage directly
  const allChefs = getAllChefs();
  const filtered=allChefs.filter(c=>(filter==="all"||c.type===filter)&&(c.alias.toLowerCase().includes(search.toLowerCase())||c.specialties.some(s=>s.toLowerCase().includes(search.toLowerCase()))));
  return(<div style={{maxWidth:1200,margin:"0 auto",padding:"44px 24px"}}>
    <div style={{marginBottom:28}}><div style={{color:C.primary,fontSize:13,fontWeight:600,letterSpacing:1,marginBottom:7}}>✦ OUR CHEFS</div><h1 style={{fontFamily:F.heading,fontSize:36,fontWeight:700,marginBottom:8}}>Find Your Perfect Chef</h1><p style={{color:C.muted,fontSize:15}}>Browse verified chefs · Price confirmed after chef sends proposal</p></div>
    <div style={{display:"flex",gap:11,marginBottom:20,flexWrap:"wrap"}}>
      <input className="input" placeholder="Search chefs or cuisines..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180}}/>
      <div style={{display:"flex",gap:7}}>{["all","premium","standard"].map(f=><button key={f} className={`tab ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="premium"?"Premium":"Standard"}</button>)}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20}}>
      {filtered.length===0?<div style={{gridColumn:"1/-1",textAlign:"center",padding:48,color:C.muted}}>No chefs found matching your search.</div>:filtered.map(c=><ChefCard key={c.id} chef={c} onClick={()=>{setSelectedChef(c);setPage("chef-profile");}}/>)}
    </div>
  </div>);
}

function ChefProfile({chef,setPage,setBookingChef}){
  const [tab,setTab]=useState("about");
  const reviews=loadReviews().filter(r=>r.chefId===chef?.id);
  if(!chef) return <div style={{padding:40,textAlign:"center"}}>Chef not found.</div>;
  const icons=["🍛","🦞","🔥","🍝","🍜","🥘"];
  return(<div style={{maxWidth:1080,margin:"0 auto",padding:"44px 24px"}}>
    <button onClick={()=>setPage("chefs")} style={{background:"none",border:"none",color:C.muted,fontSize:13,marginBottom:20,cursor:"pointer"}}>← Back to Chefs</button>
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:26}}>
      <div>
        <div style={{background:"white",borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",position:"sticky",top:80}}>
          <div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,padding:"30px 22px",textAlign:"center"}}>
            <Avatar initials={chef.image} size={82} color={chef.type==="premium"?"#B45309":C.primary}/>
            <h2 style={{fontFamily:F.heading,fontSize:20,color:"white",marginTop:13,marginBottom:4}}>{chef.alias}</h2>
            <div style={{color:"rgba(255,255,255,.6)",fontSize:13,marginBottom:9}}>📍 {chef.location}</div><Badge type={chef.badge}/>
          </div>
          <div style={{padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
              <div style={{textAlign:"center",padding:9,background:C.surface,borderRadius:9}}><div style={{fontSize:16,fontWeight:700,color:C.primary}}>{chef.dinners}+</div><div style={{fontSize:11,color:C.muted}}>Dinners</div></div>
              <div style={{textAlign:"center",padding:9,background:C.surface,borderRadius:9}}><div style={{fontSize:16,fontWeight:700,color:C.primary}}>{chef.reviews}</div><div style={{fontSize:11,color:C.muted}}>Reviews</div></div>
            </div>
            <div style={{background:C.primaryLight,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.primary,border:`1px solid ${C.primary}33`}}>
              💡 <strong>Starting from {fmtLKR(chef.startingFrom)}</strong><br/>Actual price confirmed after chef reviews your event details and submits a proposal.
            </div>
            <button className="btn-primary" style={{width:"100%",padding:"12px",fontSize:14}} onClick={()=>{setBookingChef(chef);setPage("booking");}}>Request This Chef</button>
          </div>
        </div>
      </div>
      <div>
        <div style={{display:"flex",gap:7,marginBottom:22}}>{["about","menus","reviews","photos"].map(t=><button key={t} className={`tab ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}</div>
        {tab==="about"&&<div><p style={{color:C.muted,lineHeight:1.7,marginBottom:20,fontSize:14}}>{chef.bio}</p><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{chef.specialties.map(s=><span key={s} style={{background:C.primaryLight,color:C.primary,padding:"5px 12px",borderRadius:20,fontSize:13,fontWeight:500}}>{s}</span>)}</div></div>}
        {tab==="menus"&&<div><div style={{background:C.infoBg,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.info}}>💡 These are sample menus. Chef will propose a custom menu with exact pricing after your booking request.</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:11}}>{chef.menus.map((m,i)=><div key={m} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:14,textAlign:"center"}}><div style={{fontSize:28,marginBottom:7}}>{icons[i%icons.length]}</div><div style={{fontWeight:600,fontSize:12}}>{m}</div></div>)}</div></div>}
        {tab==="reviews"&&<div>{reviews.length===0?<div style={{textAlign:"center",padding:44,background:"white",borderRadius:12,border:`1px solid ${C.border}`}}><div style={{fontSize:36,marginBottom:9}}>⭐</div><p style={{color:C.muted}}>No reviews yet.</p></div>:reviews.map((r,i)=><div key={r.id} style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:17,marginBottom:11}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><Avatar initials="U" size={32} color={[C.primary,C.info,C.success][i%3]}/><div><div style={{fontWeight:600,fontSize:13}}>Verified Customer</div><Stars value={r.rating}/></div><span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>{new Date(r.createdAt).toLocaleDateString()}</span></div><p style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{r.comment||"Great experience!"}</p></div>)}</div>}
        {tab==="photos"&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{["🍛 Biriyani","🦞 Seafood","🔥 BBQ","🍰 Dessert","🥘 Curry","🍝 Pasta"].map(item=><div key={item} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7}}><div style={{fontSize:32}}>{item.split(" ")[0]}</div><div style={{fontSize:11,color:C.muted}}>{item.slice(2)}</div></div>)}</div>}
      </div>
    </div>
  </div>);
}

// ─── Booking Page (Request Only — no payment yet) ─────────────────────────────
function BookingPage({chef,setPage,user,setShowAuth}) {
  const [step,setStep]=useState(1);
  const [pkg,setPkg]=useState("all-inclusive");
  const [guests,setGuests]=useState(4);
  const [date,setDate]=useState("");
  const [time,setTime]=useState("19:00");
  const [guestName,setGuestName]=useState(user?.name||"");
  const [mobile,setMobile]=useState("+94");
  const [address,setAddress]=useState("");
  const [special,setSpecial]=useState("");
  const [errors,setErrors]=useState({});
  const [done,setDone]=useState(false);

  const validateStep2=()=>{
    const e={};
    if(!date)                      e.date="Please select a date";
    if(!guestName.trim())          e.guestName="Full name is required";
    if(!validatePhone(mobile))     e.mobile="Enter +94 followed by 9 digits";
    if(!address.trim())            e.address="Address is required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const confirm=()=>{
    addBooking({
      id:genId(), customerEmail:user.email, customerName:guestName, customerPhone:mobile,
      customerAddress:address, chefId:chef?.id, chefAlias:chef?.alias||"Chef",
      package:pkg, date, time, isoDateTime:date&&time?`${date}T${time}:00`:"",
      guests, specialRequests:special,
      status:"pending_proposal",  // Awaits chef proposal
      reviewed:false, createdAt:new Date().toISOString(),
    });
    setDone(true);
  };

  if(!user) return(
    <div style={{maxWidth:580,margin:"80px auto",padding:40,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2 style={{fontFamily:F.heading,fontSize:26,marginBottom:10}}>Login Required</h2>
      <p style={{color:C.muted,marginBottom:20}}>Please login to request a booking.</p>
      <button className="btn-primary" style={{padding:"11px 26px"}} onClick={()=>setShowAuth("login")}>Login to Continue</button>
    </div>
  );

  if(done) return(
    <div style={{maxWidth:580,margin:"60px auto",padding:40,textAlign:"center"}}>
      <div style={{width:76,height:76,borderRadius:"50%",background:C.successBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 18px"}}>✅</div>
      <h2 style={{fontFamily:F.heading,fontSize:28,marginBottom:10}}>Request Sent!</h2>
      <p style={{color:C.muted,marginBottom:8}}>Your booking request for <strong>{chef?.alias}</strong> has been sent.</p>
      <div style={{background:C.infoBg,borderRadius:12,padding:18,marginBottom:22,textAlign:"left",fontSize:13,color:C.info}}>
        <div style={{fontWeight:700,marginBottom:8}}>What happens next?</div>
        <div style={{marginBottom:5}}>1. 👨‍🍳 Chef will review your request and create a custom menu + price proposal</div>
        <div style={{marginBottom:5}}>2. 🔧 Our maintenance admin will review and approve the proposal</div>
        <div>3. ✅ You'll be notified to review the proposal and make payment</div>
      </div>
      <button className="btn-primary" style={{padding:"11px 26px"}} onClick={()=>setPage("dashboard")}>Go to Dashboard</button>
    </div>
  );

  const STEPS=["Package","Your Details","Confirm Request"];
  return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"44px 24px"}}>
      <button onClick={()=>step===1?setPage("chef-profile"):setStep(s=>s-1)} style={{background:"none",border:"none",color:C.muted,fontSize:13,marginBottom:20,cursor:"pointer"}}>← Back</button>
      <div style={{display:"flex",justifyContent:"center",gap:0,marginBottom:32}}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:step>i?C.success:step===i+1?C.primary:C.border,color:step>i||step===i+1?"white":C.muted,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>{step>i?"✓":i+1}</div>
              <span style={{fontSize:11,color:step===i+1?C.primary:C.muted,fontWeight:step===i+1?600:400}}>{s}</span>
            </div>
            {i<STEPS.length-1&&<div style={{width:72,height:2,background:step>i+1?C.success:C.border,margin:"0 6px",marginBottom:17}}/>}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:22}}>
        <div>
          {step===1&&(
            <div className="fade-up">
              <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:18}}>Select Service Type</h2>
              {[{id:"all-inclusive",name:"All Inclusive Package",tag:"Chef brings all ingredients · Powered by Keells Super",items:["Chef sources all ingredients","Live cooking at your home","Serving & table setup","Full cleanup included"],color:C.primary},
                {id:"cook-at-home",name:"Cook-at-Home Service",tag:"You provide the ingredients",items:["Chef service only","Live cooking & guidance","Menu consultation","Basic cleanup"],color:C.success}].map(p=>(
                <div key={p.id} onClick={()=>setPkg(p.id)} style={{border:`2px solid ${pkg===p.id?p.color:C.border}`,borderRadius:13,padding:20,marginBottom:11,cursor:"pointer",background:pkg===p.id?(p.id==="all-inclusive"?C.primaryLight:C.successBg):"white",transition:"all .2s"}}>
                  <div style={{fontWeight:700,fontSize:14,color:p.color,marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{p.tag}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{p.items.map(it=><div key={it} style={{fontSize:12}}>✓ {it}</div>)}</div>
                </div>
              ))}
              <div style={{marginTop:14}}>
                <RL>Number of Guests</RL>
                <div style={{display:"flex",alignItems:"center",gap:11,marginTop:8}}>
                  <button onClick={()=>setGuests(g=>Math.max(1,g-1))} style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid ${C.border}`,background:"white",fontSize:18,fontWeight:700,cursor:"pointer"}}>-</button>
                  <span style={{fontSize:18,fontWeight:700,minWidth:26,textAlign:"center"}}>{guests}</span>
                  <button onClick={()=>setGuests(g=>Math.min(30,g+1))} style={{width:32,height:32,borderRadius:"50%",background:C.primary,color:"white",fontSize:18,fontWeight:700,border:"none",cursor:"pointer"}}>+</button>
                </div>
              </div>
            </div>
          )}
          {step===2&&(
            <div className="fade-up">
              <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:18}}>Your Details</h2>
              <div style={{display:"grid",gap:13}}>
                <div><RL>Full Name</RL><input className={`input${errors.guestName?" error":""}`} value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Your full name"/>{errors.guestName&&<span style={{fontSize:11,color:C.danger}}>{errors.guestName}</span>}</div>
                <div><RL>Mobile Number</RL><input className={`input${errors.mobile?" error":""}`} value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+94771234567"/><span style={{fontSize:11,color:errors.mobile?C.danger:C.muted}}>{errors.mobile||"Format: +94 followed by 9 digits"}</span></div>
                <div><RL>Select Date</RL>{errors.date&&<span style={{fontSize:11,color:C.danger,display:"block",marginBottom:4}}>{errors.date}</span>}<CalendarPicker value={date} onChange={setDate}/></div>
                <div><RL>Preferred Time</RL><input type="time" className="input" value={time} onChange={e=>setTime(e.target.value)}/></div>
                <div><RL>Full Event Address</RL><input className={`input${errors.address?" error":""}`} value={address} onChange={e=>setAddress(e.target.value)} placeholder="No. 25, Flower Road, Colombo 07"/>{errors.address&&<span style={{fontSize:11,color:C.danger}}>{errors.address}</span>}</div>
                <div><RL req={false}>Special Requests (Optional)</RL><textarea className="input" rows={3} value={special} onChange={e=>setSpecial(e.target.value)} placeholder="Dietary needs, allergies, occasion..." style={{resize:"none"}}/></div>
              </div>
            </div>
          )}
          {step===3&&(
            <div className="fade-up">
              <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:16}}>Confirm Your Request</h2>
              <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:20,marginBottom:14}}>
                {[["Chef",chef?.alias],["Package",pkg==="all-inclusive"?"All Inclusive":"Cook-at-Home"],["Date",date||"Not set"],["Time",time],["Guests",guests],["Name",guestName],["Phone",mobile],["Address",address]].filter(([k,v])=>v).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600,maxWidth:"55%",textAlign:"right"}}>{v}</span></div>
                ))}
              </div>
              <div style={{background:C.infoBg,borderRadius:11,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.info}}>
                💡 <strong>No payment yet.</strong> After submitting, the chef will create a personalised menu and price proposal. You pay only after admin approves the proposal.
              </div>
              {special&&<div style={{background:C.warnBg,borderRadius:9,padding:"9px 13px",marginBottom:14,fontSize:13,color:C.warn}}>📝 Special request: {special}</div>}
              <button className="btn-primary" style={{width:"100%",padding:"13px",fontSize:15}} onClick={confirm}>Send Booking Request →</button>
            </div>
          )}
          {step<3&&<button className="btn-primary" style={{width:"100%",padding:"12px",fontSize:15,marginTop:20}} onClick={()=>{if(step===2&&!validateStep2())return;setStep(s=>s+1);}}>Continue →</button>}
        </div>

        <div style={{position:"sticky",top:80,height:"fit-content"}}>
          <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,padding:15}}><div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginBottom:2}}>Booking Request</div><div style={{fontFamily:F.heading,fontSize:16,color:"white"}}>{chef?.alias||"Chef"}</div></div>
            <div style={{padding:15}}>
              {[["Package",pkg==="all-inclusive"?"All Inclusive":"Cook-at-Home"],["Date",date?new Date(date+"T00:00").toLocaleDateString("en-LK",{month:"short",day:"numeric",year:"numeric"}):"TBC"],["Time",time],["Guests",`${guests} people`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:13}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:500}}>{v}</span></div>
              ))}
              <div style={{borderTop:`2px solid ${C.border}`,paddingTop:9,marginTop:6,background:C.primaryLight,borderRadius:8,padding:"9px 12px",textAlign:"center",marginTop:10}}>
                <div style={{fontSize:11,color:C.muted}}>Pricing</div>
                <div style={{fontWeight:700,color:C.primary,fontSize:14}}>Starting from {fmtLKR(chef?.startingFrom||0)}</div>
                <div style={{fontSize:10,color:C.muted}}>Confirmed by chef proposal</div>
              </div>
            </div>
          </div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
        </div>
      </div>
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
<<<<<<< HEAD
function CustomerDashboard({user,setPage,loginKey}) {
  const [tab,setTab]=useState("overview");
  const [myBookings,setMyBookings]=useState([]);
  const [reviewTarget,setReviewTarget]=useState(null);
  const [payTarget,setPayTarget]=useState(null);
  const [showChefApp,setShowChefApp]=useState(false);

  const refresh=()=>setMyBookings(loadBookings().filter(b=>b.customerEmail===user?.email));
  useEffect(()=>{ refresh(); },[user?.email,loginKey,reviewTarget,payTarget]);

  const upcoming=myBookings.filter(b=>!isBookingPast(b)&&b.status!=="cancelled"&&b.status!=="completed");
  const past=myBookings.filter(b=>isBookingPast(b)||b.status==="completed");
  const proposalReady=myBookings.filter(b=>b.status==="proposal_accepted");
  const pendingReview=past.filter(b=>!b.reviewed&&b.status==="confirmed");
  const reviews=loadReviews().filter(r=>r.customerEmail===user?.email);
  const apps=loadApps(); const myApp=apps.find(a=>a.email===user?.email);

  if(showChefApp) return <div style={{maxWidth:680,margin:"0 auto",padding:"36px 22px"}}><ChefJoinRequestForm user={user} onSubmit={()=>{setShowChefApp(false);setTab("become-chef");}} onCancel={()=>setShowChefApp(false)}/></div>;

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
      <div style={{width:220,background:C.darkNav,padding:"22px 11px",flexShrink:0}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:13}}>
          <Avatar initials={user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"U"} size={40}/>
          <div style={{color:"white",fontWeight:600,fontSize:13,marginTop:8}}>{user?.name}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>Customer</div>
        </div>
        {[["overview","🏠","Overview"],["upcoming","📅","Upcoming",upcoming.length],["proposals","📋","Proposals",proposalReady.length],["history","🗂","History"],["reviews","⭐","Reviews",pendingReview.length],["become-chef","👨‍🍳","Become a Chef"],["support","💬","Support"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>setTab(id)} style={{position:"relative"}}>
            <span>{ic}</span><span>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:id==="proposals"?C.success:id==="reviews"?C.warn:C.primary,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:28,background:C.surface,overflowY:"auto"}} key={`dash-${loginKey}`}>

        {tab==="overview"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:23,marginBottom:4}}>Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
            <p style={{color:C.muted,marginBottom:20}}>Manage your bookings and chef proposals.</p>
            {proposalReady.length>0&&(
              <div style={{background:C.successBg,border:`1px solid ${C.success}44`,borderRadius:11,padding:"12px 17px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setTab("proposals")}>
                <span style={{fontSize:18}}>🎉</span><span style={{fontWeight:700,color:C.success}}>{proposalReady.length} proposal{proposalReady.length>1?"s":""} approved — Review & Pay now!</span><span style={{marginLeft:"auto",color:C.success}}>View →</span>
              </div>
            )}
            {pendingReview.length>0&&(
              <div style={{background:C.warnBg,border:`1px solid ${C.warn}44`,borderRadius:11,padding:"12px 17px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setTab("reviews")}>
                <span style={{fontWeight:700,color:C.warn}}>⭐ {pendingReview.length} booking{pendingReview.length>1?"s":""} awaiting your review</span><span style={{marginLeft:"auto",color:C.warn}}>Rate →</span>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:22}}>
              <MetricCard label="Total Requests" value={myBookings.length}/>
              <MetricCard label="Upcoming" value={upcoming.length} color={C.warn}/>
              <MetricCard label="Completed" value={past.filter(b=>b.status==="confirmed"||b.status==="completed").length} color={C.success}/>
            </div>
            {myBookings.length===0?(
              <div style={{textAlign:"center",padding:44,background:"white",borderRadius:11,border:`1px solid ${C.border}`}}><div style={{fontSize:44,marginBottom:11}}>🍽️</div><p style={{color:C.muted,marginBottom:13}}>No booking requests yet.</p><button className="btn-primary" style={{padding:"9px 20px"}} onClick={()=>setPage("chefs")}>Browse Chefs</button></div>
            ):myBookings.slice(0,3).map(b=><BookingRow key={b.id} b={b} onPay={()=>setPayTarget(b)}/>)}
          </div>
        )}

        {tab==="upcoming"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>Upcoming Bookings</h2>
            {upcoming.length===0?<EmptyState icon="📅" text="No upcoming bookings." action={()=>setPage("chefs")} actionLabel="Book a Chef"/>:upcoming.map(b=><BookingRow key={b.id} b={b} expanded onPay={()=>setPayTarget(b)}/>)}
          </div>
        )}

        {tab==="proposals"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:6}}>Chef Proposals</h2>
            <p style={{color:C.muted,marginBottom:18,fontSize:13}}>Review proposals approved by admin. Pay to confirm your booking.</p>
            {myBookings.filter(b=>["pending_proposal","proposal_submitted","proposal_accepted","proposal_rejected"].includes(b.status)).length===0?(
              <EmptyState icon="📋" text="No proposals yet. Book a chef to get started." action={()=>setPage("chefs")} actionLabel="Browse Chefs"/>
            ):myBookings.filter(b=>["pending_proposal","proposal_submitted","proposal_accepted","proposal_rejected"].includes(b.status)).map(b=>{
              const proposal=loadProposals().find(p=>p.bookingId===b.id);
              return(
                <div key={b.id} style={{background:"white",borderRadius:12,border:`2px solid ${STATUS_COLORS[b.status]?.color||C.border}22`,padding:20,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div><div style={{fontWeight:700,fontSize:15}}>{b.chefAlias}</div><div style={{fontSize:11,color:C.muted}}>{b.date} · {b.guests} guests · {b.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"}</div></div>
                    <BookingStatusBadge status={b.status}/>
                  </div>
                  {b.status==="pending_proposal"&&<div style={{background:C.warnBg,borderRadius:8,padding:"8px 13px",fontSize:12,color:C.warn}}>⏳ Awaiting chef to create menu and price proposal...</div>}
                  {b.status==="proposal_submitted"&&<div style={{background:C.infoBg,borderRadius:8,padding:"8px 13px",fontSize:12,color:C.info}}>🔧 Proposal submitted by chef — under maintenance admin review...</div>}
                  {b.status==="proposal_rejected"&&<div style={{background:C.dangerBg,borderRadius:8,padding:"8px 13px",fontSize:12,color:C.danger}}>❌ Proposal was declined. Please contact support or request a new booking.</div>}
                  {b.status==="proposal_accepted"&&proposal&&(
                    <div>
                      <div style={{background:C.successBg,borderRadius:8,padding:"9px 13px",fontSize:12,color:C.success,marginBottom:12,fontWeight:600}}>✅ Proposal approved by admin — ready for payment!</div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>Proposed Menu</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
                        {(proposal.menuItems||[]).map((item,i)=><div key={i} style={{background:C.surface,borderRadius:7,padding:"7px 10px",fontSize:12}}><span style={{color:C.primary,fontWeight:700}}>{i+1}.</span> {item.name}{item.description&&<div style={{color:C.muted,fontSize:11}}>{item.description}</div>}</div>)}
                      </div>
                      {proposal.notes&&<div style={{background:C.warnBg,borderRadius:8,padding:"7px 12px",fontSize:12,color:C.warn,marginBottom:11}}>👨‍🍳 Chef's note: {proposal.notes}</div>}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:C.primaryLight,borderRadius:9,marginBottom:11}}>
                        <div><div style={{fontSize:11,color:C.muted}}>Proposed Price</div><div style={{fontFamily:F.heading,fontSize:20,fontWeight:700,color:C.primary}}>{fmtLKR(proposal.proposedPrice)}</div></div>
                        <button className="btn-primary" style={{padding:"10px 20px",fontSize:14}} onClick={()=>setPayTarget({...b,proposedPrice:proposal.proposedPrice,proposal})}>Pay & Confirm →</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="history"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>Booking History</h2>
            {past.length===0?<EmptyState icon="🗂" text="No completed bookings yet."/>:past.map(b=>(
              <div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div><div style={{fontWeight:700}}>{b.chefAlias}</div><div style={{fontSize:11,color:C.muted}}>{b.date} · {b.guests} guests</div></div>
                  <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                    <div style={{fontWeight:700,color:C.primary}}>{b.amount?fmtLKR(b.amount):"—"}</div>
                    {b.status==="confirmed"&&isBookingPast(b)&&!b.reviewed&&<button onClick={()=>setReviewTarget(b)} style={{background:C.warnBg,color:C.warn,padding:"4px 11px",borderRadius:6,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>Leave Review ⭐</button>}
                    {b.reviewed&&<span style={{fontSize:12,color:C.success}}>✓ Reviewed</span>}
                  </div>
                </div>
                <BookingStatusBadge status={b.status==="confirmed"&&isBookingPast(b)?"completed":b.status}/>
=======

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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
              </div>
            ))}
          </div>
        )}
<<<<<<< HEAD

        {tab==="reviews"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:6}}>My Reviews</h2>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Reviews can only be submitted after a booking is completed.</p>
            {pendingReview.length>0&&<div style={{marginBottom:20}}><div style={{fontWeight:700,fontSize:14,color:C.warn,marginBottom:9}}>⏳ Awaiting Review</div>{pendingReview.map(b=><div key={b.id} style={{background:C.warnBg,borderRadius:11,border:`1px solid ${C.warn}33`,padding:15,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600}}>{b.chefAlias}</div><div style={{fontSize:11,color:C.muted}}>{b.date}</div></div><button onClick={()=>setReviewTarget(b)} style={{background:C.warn,color:"white",padding:"6px 15px",borderRadius:6,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>Rate ⭐</button></div>)}</div>}
            {reviews.length===0&&pendingReview.length===0?<EmptyState icon="⭐" text="No reviews yet."/>:reviews.map((r,i)=><div key={r.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><div><div style={{fontWeight:600}}>{r.chefAlias}</div><Stars value={r.rating}/></div><span style={{fontSize:11,color:C.muted}}>{new Date(r.createdAt).toLocaleDateString()}</span></div><p style={{fontSize:13,color:C.muted}}>{r.comment||"Experience rated ⭐"}</p></div>)}
          </div>
        )}

        {tab==="become-chef"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:8}}>Become a Chef</h2>
            {myApp?(
              <div style={{background:myApp.status==="approved"?C.successBg:myApp.status==="rejected"?C.dangerBg:C.warnBg,border:`1px solid ${myApp.status==="approved"?C.success:myApp.status==="rejected"?C.danger:C.warn}44`,borderRadius:14,padding:28,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:11}}>{myApp.status==="approved"?"🎉":myApp.status==="rejected"?"❌":"⏳"}</div>
                <h3 style={{fontFamily:F.heading,fontSize:19,marginBottom:7}}>{myApp.status==="approved"?"Approved! You have Chef Panel access.":myApp.status==="rejected"?"Application Rejected.":"Application Under Review (2–3 business days)"}</h3>
              </div>
            ):(
              <div>
                <p style={{color:C.muted,marginBottom:20}}>Join our verified chef network and start earning.</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:22}}>
                  {[["💰","Earn per booking","Based on your menu and proposal"],["⭐","Build reputation","Get reviews and grow"],["🛡️","Get verified","Badge boosts bookings"],["📱","Easy management","Manage from Chef Panel"]].map(([ic,t,d])=>(
                    <div key={t} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:15,display:"flex",gap:11}}><span style={{fontSize:24}}>{ic}</span><div><div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{t}</div><div style={{fontSize:12,color:C.muted}}>{d}</div></div></div>
                  ))}
                </div>
                <button className="btn-primary" style={{padding:"12px 32px",fontSize:14}} onClick={()=>setShowChefApp(true)}>Apply Now →</button>
              </div>
            )}
          </div>
        )}

        {tab==="support"&&<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>Help & Support</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>{[["📋","FAQs"],["💸","Refund Help"],["👨‍🍳","Chef Support"],["💬","WhatsApp Chat"]].map(([ic,t])=><div key={t} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,cursor:"pointer"}}><div style={{fontSize:26,marginBottom:7}}>{ic}</div><div style={{fontWeight:600,fontSize:14}}>{t}</div></div>)}</div></div>}
      </div>

      {reviewTarget&&<ReviewModal booking={reviewTarget} onClose={()=>{setReviewTarget(null);refresh();}}/>}
      {payTarget&&<ProposalPayModal booking={payTarget} onSuccess={()=>{setPayTarget(null);refresh();}} onClose={()=>setPayTarget(null)}/>}
    </div>
  );
}

function BookingRow({b,expanded,onPay}){
  const s=STATUS_COLORS[b.status]||{bg:C.surface,color:C.muted};
  return(
    <div style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div><div style={{fontWeight:700,fontSize:14}}>{b.chefAlias}</div><div style={{fontSize:11,color:C.muted}}>{b.date} · {b.time} · {b.guests} guests</div></div>
        <BookingStatusBadge status={b.status}/>
      </div>
      {expanded&&<div style={{fontSize:12,color:C.muted,marginBottom:8}}>📍 {b.address}</div>}
      {b.status==="proposal_accepted"&&<button onClick={onPay} className="btn-primary" style={{padding:"7px 16px",fontSize:12,marginTop:6}}>💳 Review & Pay →</button>}
    </div>
  );
}

function EmptyState({icon,text,action,actionLabel}){return(<div style={{textAlign:"center",padding:44,background:"white",borderRadius:11,border:`1px solid ${C.border}`}}><div style={{fontSize:40,marginBottom:10}}>{icon}</div><p style={{color:C.muted,marginBottom:action?13:0}}>{text}</p>{action&&<button className="btn-primary" style={{padding:"9px 20px"}} onClick={action}>{actionLabel}</button>}</div>);}

// ─── Proposal Pay Modal ───────────────────────────────────────────────────────
function ProposalPayModal({booking,onSuccess,onClose}) {
  const [showPayHere,setShowPayHere]=useState(false);
  const settings=loadSettings();
  const amount=booking.proposedPrice||0;
  const commission=Math.round(amount*settings.commissionRate/100);
  const hold=Math.round(amount*settings.safetyHoldRate/100);

  if(showPayHere) return <PayHereModal
    amount={amount}
    breakdown={{"Chef's Proposed Price":fmtLKR(amount),[`Platform Fee (${settings.commissionRate}%)`]:fmtLKR(commission),[`Safety Hold (${settings.safetyHoldRate}%)`]:fmtLKR(hold),[`Chef Earns (${100-settings.commissionRate-settings.safetyHoldRate}%)`]:fmtLKR(amount-commission-hold),"Total Charged":fmtLKR(amount)}}
    onSuccess={()=>{
      updateBooking(booking.id,{status:"confirmed",amount,commissionAmt:commission,holdAmt:hold});
      if(booking.proposal) updateProposal(booking.proposal.id,{paidAt:new Date().toISOString()});
      onSuccess();
    }}
    onClose={()=>setShowPayHere(false)}
  />;

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-wide">
        <CloseBtn onClick={onClose}/>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
          <span className="proposal-badge">Approved Proposal</span>
          <h2 style={{fontFamily:F.heading,fontSize:20}}>Review & Confirm Payment</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:16}}>
          {[["Chef",booking.chefAlias],["Date",booking.date],["Time",booking.time],["Guests",booking.guests],["Package",booking.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"],["Address",booking.address]].map(([k,v])=>(
            <div key={k} style={{background:C.surface,borderRadius:8,padding:"8px 11px"}}><div style={{fontSize:11,color:C.muted}}>{k}</div><div style={{fontWeight:600,fontSize:13}}>{v}</div></div>
          ))}
        </div>
        {booking.proposal&&(
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:9}}>🍽️ Chef's Proposed Menu</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:9}}>
              {(booking.proposal.menuItems||[]).map((item,i)=>(
                <div key={i} style={{background:"white",borderRadius:8,border:`1px solid ${C.border}`,padding:"9px 11px"}}>
                  <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
                  {item.description&&<div style={{fontSize:11,color:C.muted}}>{item.description}</div>}
                </div>
              ))}
            </div>
            {booking.proposal.notes&&<div style={{background:C.warnBg,borderRadius:8,padding:"7px 12px",fontSize:12,color:C.warn}}>👨‍🍳 Chef note: {booking.proposal.notes}</div>}
          </div>
        )}
        <div style={{background:C.primaryLight,borderRadius:11,padding:"14px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:12,color:C.muted}}>Total to Pay</div><div style={{fontFamily:F.heading,fontSize:24,fontWeight:700,color:C.primary}}>{fmtLKR(amount)}</div><div style={{fontSize:11,color:C.muted}}>Safety hold {fmtLKR(hold)} released 48h after service</div></div>
          <button style={{background:"#0055CC",color:"white",padding:"11px 22px",border:"none",borderRadius:8,fontWeight:700,fontSize:14,cursor:"pointer"}} onClick={()=>setShowPayHere(true)}>🔒 Pay via PayHere →</button>
        </div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
      </div>
    </div>
  );
}

// ─── Chef Panel ───────────────────────────────────────────────────────────────
<<<<<<< HEAD
function ChefPanel({user,loginKey}) {
  const [tab,setTab]=useState("overview");
  // Look up chef by email (dynamic chefs) or by name (static chefs)
  const allChefs = getAllChefs();
  const dynamicChefs = loadDynamicChefs();
  const chefData = dynamicChefs.find(c=>c.email===user?.email) || allChefs.find(c=>c.alias===user?.name) || null;
  // For demo: chef sees all bookings with their chefId OR show by alias
  const myBookings=loadBookings().filter(b=>b.chefId===chefData?.id||b.chefAlias===user?.name||b.chefAlias===chefData?.alias);
  const pendingProposalBookings=myBookings.filter(b=>b.status==="pending_proposal");
  const settings=loadSettings();

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
      <div style={{width:220,background:"#0F172A",padding:"22px 11px",flexShrink:0}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:13}}>
          <Avatar initials={user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"CH"} size={40} color="#B45309"/>
          <div style={{color:"white",fontWeight:600,fontSize:13,marginTop:8}}>{user?.name||"Chef"}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>{user?.email}</div>
          <span className="badge-premium" style={{marginTop:6,display:"inline-block"}}>Verified Chef</span>
        </div>
        {[["overview","📊","Overview"],["pending","✏️","Create Proposals",pendingProposalBookings.length],["my-proposals","📋","My Proposals"],["bookings","📅","Confirmed Bookings"],["availability","🗓","Availability"],["earnings","💰","Earnings"],["suggest-fee","💡","Suggest Fees"],["profile","👤","Profile"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>setTab(id)} style={{position:"relative"}}><span>{ic}</span><span>{l}</span>{cnt>0&&<span style={{marginLeft:"auto",background:C.danger,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}</div>
        ))}
      </div>

      <div style={{flex:1,padding:28,background:C.surface,overflowY:"auto"}} key={`chef-${loginKey}`}>
        {tab==="overview"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:23,marginBottom:4}}>Welcome, {user?.name?.split(" ")[0]||"Chef"} 👋</h2>
            <p style={{color:C.muted,marginBottom:20}}>Your bookings and proposal status.</p>
            {chefData?.isDynamic&&chefData.startingFrom===0&&(
              <div style={{background:C.successBg,border:`1px solid ${C.success}44`,borderRadius:11,padding:"13px 17px",marginBottom:16}}>
                <div style={{fontWeight:700,color:C.success,marginBottom:4}}>🎉 Your chef profile is now live!</div>
                <div style={{fontSize:13,color:C.success}}>Customers can now find and book you. Ask the super admin to set your starting price so it appears on your card.</div>
              </div>
            )}
            {pendingProposalBookings.length>0&&(
              <div style={{background:C.warnBg,border:`1px solid ${C.warn}44`,borderRadius:11,padding:"12px 17px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setTab("pending")}>
                <span>⚠️</span><span style={{fontWeight:700,color:C.warn}}>{pendingProposalBookings.length} booking{pendingProposalBookings.length>1?"s":""} need{pendingProposalBookings.length===1?"s":""} your proposal</span><span style={{marginLeft:"auto",color:C.warn}}>Create now →</span>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:22}}>
              <MetricCard label="Total Bookings" value={myBookings.length}/>
              <MetricCard label="Need Proposal" value={pendingProposalBookings.length} color={C.warn}/>
              <MetricCard label="Confirmed" value={myBookings.filter(b=>b.status==="confirmed").length} color={C.success}/>
              <MetricCard label="Rating" value={chefData?chefData.rating:"—"} color={C.gold}/>
            </div>
            {myBookings.filter(b=>b.status==="confirmed"&&!isBookingPast(b)).slice(0,3).map(b=>(
              <div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:16,marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:600}}>{b.customerName}</div><div style={{fontSize:11,color:C.muted}}>{b.date} · {b.time} · {b.guests} guests · {b.address}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.primary}}>{fmtLKR(b.amount||0)}</div><BookingStatusBadge status={b.status}/></div>
=======

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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
              </div>
            ))}
          </div>
        )}

<<<<<<< HEAD
        {tab==="pending"&&<ChefProposalList bookings={pendingProposalBookings} onRefresh={()=>setTab("overview")}/>}
        {tab==="my-proposals"&&<ChefMyProposals user={user}/>}
        {tab==="bookings"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>Confirmed Bookings</h2>
            {myBookings.filter(b=>b.status==="confirmed").length===0?<EmptyState icon="📅" text="No confirmed bookings yet."/>:myBookings.filter(b=>b.status==="confirmed").map(b=>(
              <div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontWeight:700,fontSize:14}}>{b.customerName}</div><BookingStatusBadge status={isBookingPast(b)?"completed":b.status}/></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,fontSize:12}}>{[["Date",b.date],["Time",b.time],["Guests",b.guests],["Amount",fmtLKR(b.amount||0)]].map(([k,v])=><div key={k}><div style={{color:C.muted,fontSize:11}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>)}</div>
                <div style={{marginTop:8,fontSize:12,color:C.muted}}>📍 {b.address}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="availability"&&<ChefAvailabilityTab/>}
        {tab==="earnings"&&<ChefEarningsTab user={user} bookings={myBookings} settings={settings}/>}
        {tab==="suggest-fee"&&<ChefFeeSuggestTab user={user}/>}
        {tab==="profile"&&<ChefProfileTab user={user}/>}
      </div>
    </div>
  );
}

// Chef proposal sub-components
function ChefProposalList({bookings,onRefresh}){
  const [activeId,setActiveId]=useState(null);
  const [menuItems,setMenuItems]=useState([{name:"",description:""}]);
  const [proposedPrice,setProposedPrice]=useState("");
  const [notes,setNotes]=useState("");
  const [submitted,setSubmitted]=useState(false);

  const addItem=()=>setMenuItems(m=>[...m,{name:"",description:""}]);
  const updateItem=(i,k,v)=>setMenuItems(m=>m.map((item,idx)=>idx===i?{...item,[k]:v}:item));
  const removeItem=(i)=>setMenuItems(m=>m.filter((_,idx)=>idx!==i));

  const submitProposal=(booking)=>{
    if(!proposedPrice||menuItems.some(m=>!m.name.trim())) return;
    const proposal={
      id:genId(), bookingId:booking.id, chefId:booking.chefId, chefAlias:booking.chefAlias,
      customerEmail:booking.customerEmail, menuItems:menuItems.filter(m=>m.name.trim()),
      proposedPrice:Number(proposedPrice), notes, status:"pending_review",
      submittedAt:new Date().toISOString(),
    };
    addProposal(proposal);
    updateBooking(booking.id,{status:"proposal_submitted",proposalId:proposal.id});
    setSubmitted(true); setActiveId(null);
  };

  if(submitted) return(<div style={{textAlign:"center",padding:44,background:"white",borderRadius:11,border:`1px solid ${C.border}`}}><div style={{fontSize:48,marginBottom:11}}>✅</div><h3 style={{fontFamily:F.heading,fontSize:20,marginBottom:8}}>Proposal Submitted!</h3><p style={{color:C.muted,marginBottom:16}}>Your proposal has been sent to the maintenance admin for review.</p><button className="btn-primary" style={{padding:"9px 22px"}} onClick={onRefresh}>Back to Overview</button></div>);

  return(
    <div>
      <h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:6}}>Create Proposals</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:13}}>For each booking request, create a custom menu and set your price. Admin will review before the customer is notified.</p>
      {bookings.length===0?<EmptyState icon="✏️" text="No pending booking requests."/>:bookings.map(b=>(
        <div key={b.id} style={{background:"white",borderRadius:13,border:`2px solid ${activeId===b.id?C.primary:C.border}`,padding:20,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{b.customerName}</div>
              <div style={{fontSize:12,color:C.muted}}>{b.date} · {b.time} · {b.guests} guests · {b.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"}</div>
              <div style={{fontSize:12,color:C.muted}}>📍 {b.address}</div>
              {b.specialRequests&&<div style={{fontSize:12,color:C.warn,marginTop:4}}>📝 {b.specialRequests}</div>}
            </div>
            {activeId!==b.id&&<button className="btn-primary" style={{padding:"7px 16px",fontSize:12}} onClick={()=>{setActiveId(b.id);setMenuItems([{name:"",description:""}]);setProposedPrice("");setNotes("");}}>Create Proposal →</button>}
          </div>
          {activeId===b.id&&(
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}} className="fade-up">
              <div style={{fontWeight:700,fontSize:14,marginBottom:11}}>🍽️ Build Your Menu</div>
              {menuItems.map((item,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:8,alignItems:"start"}}>
                  <div><label className="label" style={{fontSize:11}}>Dish Name {i+1} <span className="req">*</span></label><input className="input" value={item.name} onChange={e=>updateItem(i,"name",e.target.value)} placeholder="e.g. Chicken Biriyani"/></div>
                  <div><label className="label" style={{fontSize:11}}>Description (Optional)</label><input className="input" value={item.description} onChange={e=>updateItem(i,"description",e.target.value)} placeholder="Brief description"/></div>
                  {i>0&&<button onClick={()=>removeItem(i)} style={{marginTop:19,background:C.dangerBg,color:C.danger,border:"none",borderRadius:7,padding:"9px 12px",cursor:"pointer",fontSize:16}}>✕</button>}
                </div>
              ))}
              <button onClick={addItem} style={{background:C.infoBg,color:C.info,border:"none",borderRadius:7,padding:"7px 15px",fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>+ Add Dish</button>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div><RL>Proposed Total Price (LKR)</RL><input className="input" type="number" placeholder="e.g. 35000" value={proposedPrice} onChange={e=>setProposedPrice(e.target.value)}/><div style={{fontSize:11,color:C.muted,marginTop:3}}>Admin may adjust before sending to customer</div></div>
                <div><RL req={false}>Note to Admin</RL><textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes for the maintenance admin..." style={{resize:"none"}}/></div>
              </div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setActiveId(null)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 18px",fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button className="btn-primary" style={{flex:1,padding:"10px"}} onClick={()=>submitProposal(b)} disabled={!proposedPrice||menuItems.some(m=>!m.name.trim())}>Submit Proposal to Admin →</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChefMyProposals({user}){
  const dynamicChef=loadDynamicChefs().find(c=>c.email===user?.email);
  const chefAlias=dynamicChef?.alias||user?.name;
  const myProps=loadProposals().filter(p=>p.chefAlias===chefAlias||p.chefAlias===user?.name||p.chefId===getAllChefs().find(c=>c.alias===user?.name)?.id);
  return(<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>My Submitted Proposals</h2>{myProps.length===0?<EmptyState icon="📋" text="No proposals submitted yet."/>:myProps.slice().reverse().map(p=>{const sc={pending_review:{bg:C.warnBg,c:C.warn,l:"Under Admin Review"},accepted:{bg:C.successBg,c:C.success,l:"Accepted ✓"},rejected:{bg:C.dangerBg,c:C.danger,l:"Rejected"}}[p.status]||{bg:C.surface,c:C.muted,l:p.status};return(<div key={p.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700}}>Booking #{p.bookingId}</div><div style={{fontSize:11,color:C.muted}}>{new Date(p.submittedAt).toLocaleDateString()}</div></div><span style={{background:sc.bg,color:sc.c,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{sc.l}</span></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>{(p.menuItems||[]).map((m,i)=><span key={i} style={{background:C.primaryLight,color:C.primary,padding:"3px 9px",borderRadius:20,fontSize:12}}>🍽 {m.name}</span>)}</div><div style={{fontWeight:700,fontSize:14,color:C.primary}}>{fmtLKR(p.proposedPrice)}</div>{p.notes&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>Note: {p.notes}</div>}</div>);})}</div>);
}
function ChefAvailabilityTab(){const [avail,setAvail]=useState({Mon:true,Tue:true,Wed:false,Thu:true,Fri:true,Sat:true,Sun:false});return(<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:16}}>Availability</h2><div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:22}}><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:9}}>{Object.entries(avail).map(([day,on])=><div key={day} onClick={()=>setAvail(a=>({...a,[day]:!a[day]}))} style={{textAlign:"center",padding:"12px 5px",borderRadius:11,border:`2px solid ${on?C.primary:C.border}`,background:on?C.primaryLight:"white",cursor:"pointer",transition:"all .2s"}}><div style={{fontSize:11,fontWeight:700,color:on?C.primary:C.muted,textTransform:"uppercase"}}>{day}</div><div style={{fontSize:17,marginTop:5}}>{on?"✅":"❌"}</div></div>)}</div><button className="btn-primary" style={{marginTop:16,padding:"9px 22px"}} onClick={()=>alert("✅ Saved!")}>Save</button></div></div>);}
function ChefEarningsTab({user,bookings,settings}){const confirmed=bookings.filter(b=>b.status==="confirmed"||b.status==="completed");const total=confirmed.reduce((s,b)=>s+(b.amount||0),0);const myEarn=confirmed.reduce((s,b)=>s+Math.round((b.amount||0)*(1-settings.commissionRate/100-settings.safetyHoldRate/100)),0);return(<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>Earnings</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13,marginBottom:20}}><MetricCard label="My Earnings" value={fmtLKR(myEarn)} color={C.success}/><MetricCard label="Platform Fees" value={fmtLKR(confirmed.reduce((s,b)=>s+(b.commissionAmt||0),0))} color={C.info}/><MetricCard label="Safety Holds" value={fmtLKR(confirmed.reduce((s,b)=>s+(b.holdAmt||0),0))} color={C.warn}/></div>{confirmed.length===0?<EmptyState icon="💰" text="No earnings yet."/>:confirmed.map(b=>{const earn=Math.round((b.amount||0)*(1-settings.commissionRate/100-settings.safetyHoldRate/100));return(<div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:16,marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600}}>{b.customerName}</div><div style={{fontSize:11,color:C.muted}}>{b.date}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.success}}>{fmtLKR(earn)}</div><div style={{fontSize:11,color:C.muted}}>Total: {fmtLKR(b.amount||0)}</div></div></div>);})}</div>);}
function ChefFeeSuggestTab({user}){const [form,setForm]=useState({allIn:"",cook:"",note:""});const [sent,setSent]=useState(false);const submit=()=>{if(!form.allIn||!form.cook)return;const all=loadFeeSugs();all.push({id:genId(),chefEmail:user?.email,chefAlias:user?.name||"Chef",suggestAllIn:Number(form.allIn),suggestCook:Number(form.cook),note:form.note,submittedAt:new Date().toISOString(),status:"pending"});saveFeeSugs(all);setSent(true);};if(sent)return(<div style={{textAlign:"center",padding:40,background:"white",borderRadius:11,border:`1px solid ${C.border}`}}><div style={{fontSize:40,marginBottom:10}}>✅</div><h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:6}}>Suggestion Sent!</h3><p style={{color:C.muted}}>Super admin will review and update your rates.</p></div>);return(<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:6}}>Suggest Fees</h2><p style={{color:C.muted,fontSize:13,marginBottom:18}}>Only super admin sets final rates. This is your suggestion only.</p><div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:22,display:"grid",gap:13}}><div><RL>All Inclusive Starting Rate (LKR)</RL><input className="input" type="number" placeholder="e.g. 30000" value={form.allIn} onChange={e=>setForm(f=>({...f,allIn:e.target.value}))}/></div><div><RL>Cook-at-Home Starting Rate (LKR)</RL><input className="input" type="number" placeholder="e.g. 10000" value={form.cook} onChange={e=>setForm(f=>({...f,cook:e.target.value}))}/></div><div><RL req={false}>Note to Admin</RL><textarea className="input" rows={2} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{resize:"none"}} placeholder="Why you're suggesting these rates..."/></div><button className="btn-primary" style={{padding:"10px 22px"}} onClick={submit} disabled={!form.allIn||!form.cook}>Submit Suggestion →</button></div></div>);}
function ChefProfileTab({user}){return(<div><h2 style={{fontFamily:F.heading,fontSize:21,marginBottom:18}}>My Profile</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{[["Personal Info",[["Full Name",user?.name||""],["Email",user?.email||""],["Phone",""]]],["Professional",[["Specialties",""],["Location",""],["Bio",""]]]].map(([title,fields])=><div key={title} style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:22}}><h3 style={{fontFamily:F.heading,fontSize:15,marginBottom:14}}>{title}</h3><div style={{display:"grid",gap:12}}>{fields.map(([l,v])=><div key={l}><label className="label">{l}</label><input className="input" defaultValue={v} readOnly={l==="Email"} style={l==="Email"?{background:"#f9f9f9"}:{}}/></div>)}</div><button className="btn-primary" style={{marginTop:13,padding:"8px 20px"}} onClick={()=>alert("✅ Saved!")}>Save</button></div>)}</div></div>);}

// ─── Chef Join Form ───────────────────────────────────────────────────────────
function ChefJoinRequestForm({user,onSubmit,onCancel}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({fullName:user?.name||"",email:user?.email||"",phone:"",nic:"",address:"",city:"",district:"",experience:"",specialties:"",chefType:"standard",bio:"",suggestAllIn:"",suggestCook:"",nicFile:null,policeFile:null,photoFile:null,certFile:null});
  const [errors,setErrors]=useState({});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleFile=(k,e)=>{
    const f=e.target.files[0];
    if(!f) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      upd(k,{name:f.name,type:f.type,data:ev.target.result});
    };
    reader.readAsDataURL(f);
  };
  const validate=()=>{
    const e={};
    if(step===1){if(!form.fullName.trim())e.fullName="Required";if(!form.nic.trim())e.nic="Required";if(!validatePhone(form.phone))e.phone="Enter +94 followed by 9 digits";if(!form.bio.trim())e.bio="Required";}
    if(step===2){if(!form.address.trim())e.address="Required";if(!form.city.trim())e.city="Required";if(!form.district)e.district="Required";if(!form.experience)e.experience="Required";if(!form.specialties.trim())e.specialties="Required";}
    if(step===3){if(!form.nicFile?.data)e.nicFile="Required";if(!form.policeFile?.data)e.policeFile="Required";if(!form.photoFile?.data)e.photoFile="Required";}
    setErrors(e);return Object.keys(e).length===0;
  };
  const DISTRICTS=["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"];
  const submit=()=>{const apps=loadApps();apps.push({id:genId(),userId:user?.id,email:user?.email,...form,submittedAt:new Date().toISOString(),status:"pending"});saveApps(apps);window.dispatchEvent(new StorageEvent("storage",{key:K.apps}));onSubmit();};
  const STEPS=["Personal","Address & Skills","Documents","Review"];
  return(<div style={{background:"white",borderRadius:18,border:`1px solid ${C.border}`,padding:28,maxWidth:640,margin:"0 auto"}}>
    <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,fontSize:13,marginBottom:11,cursor:"pointer"}}>← Back</button>
    <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:4}}>Apply to Become a Chef</h2>
    <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Super admin approves applications. Chef panel access granted upon approval.</p>
    <div style={{display:"flex",gap:4,marginBottom:22,flexWrap:"wrap"}}>{STEPS.map((s,i)=><div key={s} style={{display:"flex",alignItems:"center",gap:4}}><div style={{padding:"4px 11px",borderRadius:20,background:step===i+1?C.primary:step>i+1?C.success:C.surface,border:`1px solid ${step===i+1?C.primary:step>i+1?C.success:C.border}`,whiteSpace:"nowrap"}}><span style={{color:step===i+1||step>i+1?"white":C.muted,fontSize:12,fontWeight:700}}>{step>i+1?"✓ ":""}{s}</span></div>{i<STEPS.length-1&&<div style={{width:9,height:2,background:step>i+1?C.success:C.border}}/>}</div>)}</div>
    {step===1&&<div style={{display:"grid",gap:12}} className="fade-up">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><RL>Full Legal Name</RL><input className={`input${errors.fullName?" error":""}`} value={form.fullName} onChange={e=>upd("fullName",e.target.value)} placeholder="As on NIC"/>{errors.fullName&&<span style={{fontSize:11,color:C.danger}}>{errors.fullName}</span>}</div><div><RL>NIC Number</RL><input className={`input${errors.nic?" error":""}`} value={form.nic} onChange={e=>upd("nic",e.target.value)} placeholder="200012345678"/>{errors.nic&&<span style={{fontSize:11,color:C.danger}}>{errors.nic}</span>}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><RL>Email</RL><input className="input" value={form.email} readOnly style={{background:"#f9f9f9"}}/></div><div><RL>Phone (+94XXXXXXXXX)</RL><input className={`input${errors.phone?" error":""}`} value={form.phone} onChange={e=>upd("phone",e.target.value)} placeholder="+94771234567"/>{errors.phone&&<span style={{fontSize:11,color:C.danger}}>{errors.phone}</span>}</div></div>
      <div><RL>Chef Type</RL><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{[["standard","🏠 Standard Chef","Traditional cuisine, budget-friendly"],["premium","⭐ Premium Chef","Hotel-trained, fine dining"]].map(([v,t,d])=><div key={v} onClick={()=>upd("chefType",v)} style={{border:`2px solid ${form.chefType===v?C.primary:C.border}`,borderRadius:9,padding:11,cursor:"pointer",background:form.chefType===v?C.primaryLight:"white"}}><div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{t}</div><div style={{fontSize:11,color:C.muted}}>{d}</div></div>)}</div></div>
      <div><RL>Professional Bio</RL><textarea className={`input${errors.bio?" error":""}`} rows={3} value={form.bio} onChange={e=>upd("bio",e.target.value)} placeholder="Your culinary background and experience..." style={{resize:"none"}}/>{errors.bio&&<span style={{fontSize:11,color:C.danger}}>{errors.bio}</span>}</div>
    </div>}
    {step===2&&<div style={{display:"grid",gap:12}} className="fade-up">
      <div><RL>Current Living Address</RL><input className={`input${errors.address?" error":""}`} value={form.address} onChange={e=>upd("address",e.target.value)} placeholder="No. 25, Flower Road"/>{errors.address&&<span style={{fontSize:11,color:C.danger}}>{errors.address}</span>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><RL>City</RL><input className={`input${errors.city?" error":""}`} value={form.city} onChange={e=>upd("city",e.target.value)} placeholder="Colombo"/>{errors.city&&<span style={{fontSize:11,color:C.danger}}>{errors.city}</span>}</div><div><RL>District</RL><select className={`input${errors.district?" error":""}`} value={form.district} onChange={e=>upd("district",e.target.value)}><option value="">Select...</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select>{errors.district&&<span style={{fontSize:11,color:C.danger}}>{errors.district}</span>}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><RL>Experience</RL><select className={`input${errors.experience?" error":""}`} value={form.experience} onChange={e=>upd("experience",e.target.value)}><option value="">Select...</option>{["Less than 1 year","1–2 years","2–3 years","3–5 years","5–8 years","8+ years"].map(o=><option key={o}>{o}</option>)}</select>{errors.experience&&<span style={{fontSize:11,color:C.danger}}>{errors.experience}</span>}</div><div><RL>Cuisine Specialties</RL><input className={`input${errors.specialties?" error":""}`} value={form.specialties} onChange={e=>upd("specialties",e.target.value)} placeholder="Sri Lankan, Biriyani, BBQ"/>{errors.specialties&&<span style={{fontSize:11,color:C.danger}}>{errors.specialties}</span>}</div></div>
      <div><RL req={false}>Suggested Starting Rates (Optional)</RL><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><div><label className="label" style={{fontSize:11}}>All Inclusive (LKR)</label><input className="input" type="number" placeholder="25000" value={form.suggestAllIn} onChange={e=>upd("suggestAllIn",e.target.value)}/></div><div><label className="label" style={{fontSize:11}}>Cook-at-Home (LKR)</label><input className="input" type="number" placeholder="8000" value={form.suggestCook} onChange={e=>upd("suggestCook",e.target.value)}/></div></div><div style={{fontSize:11,color:C.muted,marginTop:3}}>Suggestion only. Super admin sets final approved rates.</div></div>
    </div>}
    {step===3&&<div style={{display:"grid",gap:14}} className="fade-up">
      <div style={{background:C.infoBg,borderRadius:9,padding:11,fontSize:12,color:C.info}}>📋 All documents must be valid and clearly legible for admin verification.</div>
      {[{k:"nicFile",label:"NIC Copy",desc:"Front & back of National Identity Card",types:"image/*",icon:"🪪",req:true},{k:"policeFile",label:"Police Clearance Certificate",desc:"Valid Police Clearance Report (PDF preferred)",types:".pdf,image/*",icon:"🚔",req:true},{k:"photoFile",label:"Professional Chef Photo",desc:"Clear headshot in chef attire",types:"image/*",icon:"📸",req:true},{k:"certFile",label:"Culinary Certificates",desc:"Hotel/culinary school certificates (optional)",types:".pdf,image/*",icon:"🎓",req:false}].map(doc=>(
        <div key={doc.k}><RL req={doc.req}>{doc.icon} {doc.label}</RL><p style={{fontSize:11,color:C.muted,marginBottom:5}}>{doc.desc}</p>
        <label className={`upload-zone ${form[doc.k]?"has-file":""}`} style={{display:"block",cursor:"pointer"}}>
          <input type="file" style={{display:"none"}} accept={doc.types} onChange={e=>handleFile(doc.k,e)}/>
          {form[doc.k]?<div><div style={{fontSize:17,marginBottom:3}}>✅</div><div style={{fontSize:12,fontWeight:600,color:C.success}}>{form[doc.k]?.name||form[doc.k]}</div></div>:<div><div style={{fontSize:24,marginBottom:3}}>📎</div><div style={{fontWeight:600,fontSize:12}}>Click to upload · Max 10MB</div></div>}
        </label>{errors[doc.k]&&<span style={{fontSize:11,color:C.danger}}>{errors[doc.k]}</span>}
      </div>))}
    </div>}
    {step===4&&<div className="fade-up">
      <h3 style={{fontFamily:F.heading,fontSize:17,marginBottom:12}}>Review Application</h3>
      <div style={{background:C.surface,borderRadius:11,padding:15,marginBottom:14}}>{[["Name",form.fullName],["NIC",form.nic],["Phone",form.phone],["Type",form.chefType==="premium"?"Premium":"Standard"],["Address",`${form.address}, ${form.city}, ${form.district}`],["Experience",form.experience]].filter(([k,v])=>v).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600,maxWidth:"55%",textAlign:"right"}}>{v}</span></div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>{[["🪪 NIC",form.nicFile],["🚔 Police",form.policeFile],["📸 Photo",form.photoFile],["🎓 Certs",form.certFile]].map(([l,f])=><div key={l} style={{background:f?.data?C.successBg:C.surface,borderRadius:7,padding:"7px 10px",fontSize:11,border:`1px solid ${f?.data?C.success+"44":C.border}`}}><div style={{color:C.muted}}>{l}</div><div style={{fontWeight:700,color:f?.data?C.success:C.muted}}>{f?.data?"✓ Uploaded":"– Not uploaded"}</div></div>)}</div>
      <div style={{background:C.warnBg,borderRadius:9,padding:9,fontSize:12,color:C.warn,marginBottom:13}}>⏳ Super admin reviews within 2–3 business days.</div>
      <button className="btn-primary" style={{width:"100%",padding:12,fontSize:14}} onClick={submit}>Submit Application →</button>
    </div>}
    {step<4&&<div style={{display:"flex",gap:9,marginTop:18}}>{step>1&&<button className="btn-outline" style={{flex:1,padding:10}} onClick={()=>setStep(s=>s-1)}>← Back</button>}<button className="btn-primary" style={{flex:2,padding:10}} onClick={()=>{if(validate())setStep(s=>s+1);}}>Continue →</button></div>}
  </div>);
}

// ─── Maintenance Admin Panel ──────────────────────────────────────────────────
function MaintenanceAdminPanel({user,loginKey}) {
  const [tab,setTab]=useState("proposals");
  const [proposals,setProposals]=useState(()=>loadProposals().filter(p=>p.status==="pending_review"));
  const [allProposals,setAllProposals]=useState(loadProposals);
  const [allBookings,setAllBookings]=useState(loadBookings);
  const [viewProposal,setViewProposal]=useState(null);
  const [editPrice,setEditPrice]=useState("");
  const [rejectReason,setRejectReason]=useState("");

  const refresh=()=>{
    setProposals(loadProposals().filter(p=>p.status==="pending_review"));
    setAllProposals(loadProposals());
    setAllBookings(loadBookings());
  };

  const acceptProposal=(proposal,finalPrice)=>{
    const price=Number(finalPrice||proposal.proposedPrice);
    updateProposal(proposal.id,{status:"accepted",finalPrice:price,reviewedAt:new Date().toISOString(),reviewedBy:user?.email});
    updateBooking(proposal.bookingId,{status:"proposal_accepted",proposalId:proposal.id});
    // Simulate email notification — in-app flag
    const bookings=loadBookings();
    const bk=bookings.find(b=>b.id===proposal.bookingId);
    if(bk){
      // Store notification for customer
      const notifs=ls.get("cah_notifs",{});
      notifs[bk.customerEmail]=[...(notifs[bk.customerEmail]||[]),{type:"proposal_accepted",bookingId:bk.id,chefAlias:bk.chefAlias,price,at:new Date().toISOString()}];
      ls.set("cah_notifs",notifs);
    }
    refresh(); setViewProposal(null);
  };

  const rejectProposal=(proposal,reason)=>{
    updateProposal(proposal.id,{status:"rejected",rejectionReason:reason||"",reviewedAt:new Date().toISOString(),reviewedBy:user?.email});
    updateBooking(proposal.bookingId,{status:"proposal_rejected"});
    refresh(); setViewProposal(null);
  };

  const ProposalModal=()=>{
    if(!viewProposal) return null;
    const bk=allBookings.find(b=>b.id===viewProposal.bookingId)||{};
    return(
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewProposal(null)}>
        <div className="modal-wide">
          <CloseBtn onClick={()=>setViewProposal(null)}/>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
            <span className="proposal-badge">Proposal Review</span>
            <h2 style={{fontFamily:F.heading,fontSize:20}}>Review Chef Proposal</h2>
          </div>
          {/* Booking Details */}
          <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:9,color:C.muted}}>BOOKING DETAILS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,fontSize:13}}>
              {[["Customer",bk.customerName||"—"],["Phone",bk.customerPhone||"—"],["Date",bk.date||"—"],["Time",bk.time||"—"],["Guests",bk.guests||"—"],["Package",bk.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"]].map(([k,v])=>(
                <div key={k} style={{background:"white",borderRadius:7,padding:"7px 10px"}}><div style={{fontSize:10,color:C.muted}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>
              ))}
            </div>
            {bk.address&&<div style={{marginTop:8,fontSize:12,color:C.muted}}>📍 {bk.address}</div>}
            {bk.specialRequests&&<div style={{marginTop:5,fontSize:12,color:C.warn}}>📝 {bk.specialRequests}</div>}
          </div>
          {/* Chef & Proposed Menu */}
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:9,color:C.muted}}>CHEF'S PROPOSED MENU — {viewProposal.chefAlias}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {(viewProposal.menuItems||[]).map((item,i)=>(
                <div key={i} style={{background:"white",borderRadius:9,border:`1px solid ${C.border}`,padding:"9px 12px"}}>
                  <div style={{fontWeight:600,fontSize:13}}>🍽 {item.name}</div>
                  {item.description&&<div style={{fontSize:11,color:C.muted}}>{item.description}</div>}
                </div>
              ))}
            </div>
            {viewProposal.notes&&<div style={{background:C.warnBg,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.warn}}>👨‍🍳 Chef's note: {viewProposal.notes}</div>}
          </div>
          {/* Price */}
          <div style={{background:C.primaryLight,borderRadius:11,padding:"13px 17px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>PRICE REVIEW</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label className="label">Chef's Proposed Price</label><div style={{fontFamily:F.heading,fontSize:20,fontWeight:700,color:C.primary}}>{fmtLKR(viewProposal.proposedPrice)}</div></div>
              <div><RL req={false}>Adjust Final Price (Optional)</RL><input className="input" type="number" value={editPrice} onChange={e=>setEditPrice(e.target.value)} placeholder={viewProposal.proposedPrice}/><div style={{fontSize:11,color:C.muted,marginTop:3}}>Leave blank to use chef's proposed price</div></div>
            </div>
            {editPrice&&Number(editPrice)!==viewProposal.proposedPrice&&<div style={{marginTop:8,padding:"6px 10px",background:C.warnBg,borderRadius:7,fontSize:12,color:C.warn}}>⚠️ You're changing the price from {fmtLKR(viewProposal.proposedPrice)} to {fmtLKR(editPrice)}</div>}
          </div>
          {/* Reject reason */}
          <div style={{marginBottom:16}}><RL req={false}>Rejection Reason (if rejecting)</RL><input className="input" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Brief reason for rejection..."/></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>rejectProposal(viewProposal,rejectReason)} style={{flex:1,padding:12,background:C.dangerBg,color:C.danger,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>✗ Reject Proposal</button>
            <button onClick={()=>acceptProposal(viewProposal,editPrice)} style={{flex:1,padding:12,background:C.success,color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>✓ Accept — Notify Customer</button>
          </div>
          <div style={{marginTop:10,padding:"7px 11px",background:C.infoBg,borderRadius:8,fontSize:12,color:C.info}}>
            📧 Upon acceptance, customer will be notified in-app to review the proposal and make payment via PayHere.
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
      <ProposalModal/>
      <div style={{width:230,background:"#0C1A2E",padding:"22px 11px",flexShrink:0}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:13}}>
          <div style={{fontFamily:F.heading,fontSize:15,color:"white",fontWeight:700}}>🔧 Maintenance Admin</div>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2}}>{user?.email}</div>
        </div>
        {[["proposals","📋","Proposals",proposals.length],["all-proposals","🗂","All Proposals"],["bookings","📅","All Bookings"],["chefs","👨‍🍳","Chef Overview"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}} style={{position:"relative"}}>
            <span>{ic}</span><span>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:C.danger,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:28,background:C.surface,overflowY:"auto"}} key={`maint-${loginKey}`}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div><h2 style={{fontFamily:F.heading,fontSize:22}}>Maintenance Admin Panel</h2><p style={{color:C.muted,fontSize:13}}>Review chef proposals and manage bookings</p></div>
          <button onClick={refresh} style={{background:"white",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer"}}>🔄 Refresh</button>
        </div>

        {tab==="proposals"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:22}}>
              <MetricCard label="Pending Review" value={proposals.length} color={C.warn}/>
              <MetricCard label="Accepted Today" value={allProposals.filter(p=>p.status==="accepted"&&new Date(p.reviewedAt||0).toDateString()===new Date().toDateString()).length} color={C.success}/>
              <MetricCard label="Total Reviewed" value={allProposals.filter(p=>p.status!=="pending_review").length} color={C.info}/>
            </div>
            <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:14}}>Pending Proposals</h3>
            {proposals.length===0?(
              <div style={{textAlign:"center",padding:48,background:"white",borderRadius:11,border:`1px solid ${C.border}`}}><div style={{fontSize:36,marginBottom:10}}>✅</div><p style={{color:C.muted}}>No proposals pending review.</p></div>
            ):proposals.map(p=>{
              const bk=allBookings.find(b=>b.id===p.bookingId)||{};
              return(
                <div key={p.id} style={{background:"white",borderRadius:12,border:`2px solid ${C.warn}44`,padding:20,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{p.chefAlias} → {bk.customerName||p.customerEmail}</div>
                      <div style={{fontSize:12,color:C.muted}}>{bk.date} · {bk.guests} guests · {bk.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"}</div>
                      <div style={{fontSize:11,color:C.muted}}>Submitted: {new Date(p.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:F.heading,fontSize:18,fontWeight:700,color:C.primary}}>{fmtLKR(p.proposedPrice)}</div>
                      <div style={{fontSize:11,color:C.muted}}>{(p.menuItems||[]).length} dishes</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:11}}>
                    {(p.menuItems||[]).slice(0,4).map((item,i)=><span key={i} style={{background:C.primaryLight,color:C.primary,padding:"3px 9px",borderRadius:20,fontSize:12}}>🍽 {item.name}</span>)}
                    {(p.menuItems||[]).length>4&&<span style={{color:C.muted,fontSize:12}}>+{(p.menuItems||[]).length-4} more</span>}
                  </div>
                  {p.notes&&<div style={{background:C.warnBg,borderRadius:7,padding:"6px 11px",fontSize:12,color:C.warn,marginBottom:11}}>👨‍🍳 {p.notes}</div>}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setViewProposal(p);setEditPrice("");}} style={{background:C.infoBg,color:C.info,padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>📄 Full Review</button>
                    <button onClick={()=>rejectProposal(p,"")} style={{background:C.dangerBg,color:C.danger,padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>✗ Reject</button>
                    <button onClick={()=>acceptProposal(p,"")} style={{background:C.success,color:"white",padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>✓ Accept</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="all-proposals"&&(
          <div>
            <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:18}}>All Proposals</h3>
            {allProposals.length===0?<EmptyState icon="📋" text="No proposals yet."/>:allProposals.slice().reverse().map(p=>{
              const sc={pending_review:{bg:C.warnBg,c:C.warn,l:"Pending"},accepted:{bg:C.successBg,c:C.success,l:"Accepted ✓"},rejected:{bg:C.dangerBg,c:C.danger,l:"Rejected"}}[p.status]||{bg:C.surface,c:C.muted,l:p.status};
              return(
                <div key={p.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{p.chefAlias}</div>
                    <div style={{fontSize:11,color:C.muted}}>Customer: {p.customerEmail} · {new Date(p.submittedAt).toLocaleDateString()}</div>
                    <div style={{fontSize:11,color:C.muted}}>{(p.menuItems||[]).length} dishes proposed</div>
                  </div>
                  <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                    <div style={{fontWeight:700,color:C.primary}}>{fmtLKR(p.finalPrice||p.proposedPrice)}</div>
                    <span style={{background:sc.bg,color:sc.c,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:600}}>{sc.l}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="bookings"&&(
          <div>
            <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:18}}>All Bookings Overview</h3>
            {allBookings.length===0?<EmptyState icon="📅" text="No bookings yet."/>:allBookings.slice().reverse().map(b=>(
              <div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><div><div style={{fontWeight:700,fontSize:14}}>{b.customerName||b.customerEmail}</div><div style={{fontSize:11,color:C.muted}}>{b.chefAlias} · #{b.id}</div></div><BookingStatusBadge status={b.status}/></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,fontSize:12}}>{[["Date",b.date||"—"],["Guests",b.guests||"—"],["Phone",b.customerPhone||"—"],["Amount",b.amount?fmtLKR(b.amount):"TBD"]].map(([k,v])=><div key={k}><div style={{color:C.muted,fontSize:10}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>)}</div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
              </div>
            ))}
          </div>
        )}

<<<<<<< HEAD
        {tab==="chefs"&&(
          <div>
            <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:18}}>Chef Activity</h3>
            {getAllChefs().map(c=>{
              const chefBookings=allBookings.filter(b=>b.chefAlias===c.alias);
              const chefProposals=allProposals.filter(p=>p.chefAlias===c.alias);
              return(
                <div key={c.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14,justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <Avatar initials={c.image||c.alias?.slice(0,2)} size={38} color={c.type==="premium"?"#B45309":C.primary}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{c.alias}</div>
                      <div style={{fontSize:12,color:C.muted}}>{c.location} · {c.type==="premium"?"Premium":"Standard"}{c.isDynamic&&<span style={{marginLeft:7,background:C.successBg,color:C.success,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>NEW</span>}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:18}}>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>Bookings</div><div style={{fontWeight:700,color:C.primary}}>{chefBookings.length}</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>Proposals</div><div style={{fontWeight:700,color:C.info}}>{chefProposals.length}</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>Accepted</div><div style={{fontWeight:700,color:C.success}}>{chefProposals.filter(p=>p.status==="accepted").length}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
=======
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

>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─── Super Admin Panel ────────────────────────────────────────────────────────
function SuperAdminPanel({loginKey}) {
  const {setRole}=useAuth();
  const [tab,setTab]=useState("dashboard");
  const [settings,setSettings]=useState(loadSettings);
  const [tick,setTick]=useState(0); const pendingApps=loadApps().filter(a=>a.status==="pending"); const setPendingApps=()=>setTick(t=>t+1);
  const [feeSugs,setFeeSugs]=useState(()=>loadFeeSugs().filter(s=>s.status==="pending"));
  const [allBookings,setAllBookings]=useState(loadBookings);
  const [allProposals,setAllProposals]=useState(loadProposals);
  const [chefFeeMap,setChefFeeMap]=useState(loadChefFees);
  const [viewApp,setViewApp]=useState(null);
  const [editFee,setEditFee]=useState(null);
  const [feeForm,setFeeForm]=useState({startingFrom:25000,extraPerGuest:2000});
  const [removedChefIds,setRemovedChefIds]=useState(()=>ls.get("cah_removed_chefs",[]));
  const [userRoles,setUserRoles]=useState(()=>{const r={};loadUsers().forEach(u=>{if(u.role)r[u.email]=u.role;});return r;});

  const loadAllUsers=()=>{
    const stored=loadUsers();
    const merged=[...stored];
    return merged;
  };
  const [allUsers,setAllUsers]=useState(loadAllUsers);

  const refresh=()=>{
    setAllBookings(loadBookings());
    setAllProposals(loadProposals());
    setPendingApps(loadApps().filter(a=>a.status==="pending"));
    setFeeSugs(loadFeeSugs().filter(s=>s.status==="pending"));
    setChefFeeMap(loadChefFees());
    setAllUsers(loadAllUsers());
    const r={};loadUsers().forEach(u=>{if(u.role)r[u.email]=u.role;});
    setUserRoles(r);
    setRemovedChefIds(ls.get("cah_removed_chefs",[]));
  };

  useEffect(()=>{
    const doRefresh=()=>{
      setAllBookings(loadBookings());
      setAllProposals(loadProposals());
      const apps=loadApps();
      setPendingApps(apps.filter(a=>a.status==="pending"));
      setFeeSugs(loadFeeSugs().filter(s=>s.status==="pending"));
      setChefFeeMap(loadChefFees());
      const stored=loadUsers();
      setAllUsers([...stored]);
      const r={};stored.forEach(u=>{if(u.role)r[u.email]=u.role;});
      setUserRoles(r);
      setRemovedChefIds(ls.get("cah_removed_chefs",[]));
    };
    const interval=setInterval(doRefresh,3000);
    // Listen for storage writes from any tab (login, signup, role changes)
    const onStorage=(e)=>{if(!e||!e.key||[K.apps,K.users,K.bookings,K.proposals,"cah_dynamic_chefs"].includes(e.key)||e.key===null)doRefresh();};
    window.addEventListener("storage",onStorage);
    return()=>{clearInterval(interval);window.removeEventListener("storage",onStorage);};
  },[]);

  const removeUserRole=(email)=>{
    setRole(email,"customer");
    setUserRoles(r=>({...r,[email]:"customer"}));
    const users=loadUsers();
    const i=users.findIndex(u=>u.email===email);
    if(i>=0){users[i].role="customer";saveUsers(users);}
    setAllUsers(loadAllUsers());
  };
  const removeChef=(chefId,chefAlias)=>{
    if(!window.confirm(`Remove ${chefAlias} from the chef list? They will no longer appear on the platform.`)) return;
    const updated=[...removedChefIds,chefId];
    ls.set("cah_removed_chefs",updated);
    setRemovedChefIds(updated);
    // Remove from dynamic chefs store if applicable
    const dynamic=loadDynamicChefs().filter(c=>c.id!==chefId);
    saveDynamicChefs(dynamic);
    // Also demote any user with that alias
    const users=loadUsers();
    const i=users.findIndex(u=>u.name===chefAlias||u.email===chefAlias);
    if(i>=0){users[i].role="customer";saveUsers(users);}
    setAllUsers(loadAllUsers());
    // Notify all open tabs/panels
    window.dispatchEvent(new StorageEvent("storage",{key:"cah_removed_chefs"}));
    refresh();
  };
  const setUserRole=(email,newRole)=>{
    setRole(email,newRole);
    setUserRoles(r=>({...r,[email]:newRole}));
    const users=loadUsers();
    const i=users.findIndex(u=>u.email===email);
    if(i>=0){users[i].role=newRole;saveUsers(users);}
    setAllUsers(loadAllUsers());
  };

  const approveApp=(id)=>{
    const apps=loadApps();
    const i=apps.findIndex(a=>a.id===id);
    if(i>=0){
      apps[i].status="approved";
      saveApps(apps);
      setRole(apps[i].email,"chef");
      // Create a dynamic chef profile so they appear in the public chef listing
      const app=apps[i];
      const specialties=(app.specialties||"").split(",").map(s=>s.trim()).filter(Boolean);
      const initials=app.fullName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"CH";
      const newId=`dyn_${app.id}`;
      const chefProfile={
        id:newId, alias:app.fullName, email:app.email,
        type:app.chefType||"standard",
        rating:0, reviews:0, experience:app.experience||"",
        location:app.city||app.district||"Sri Lanka",
        specialties:specialties.length?specialties:["Sri Lankan"],
        image:initials, dinners:0,
        badge:app.chefType==="premium"?"Premium":"Verified",
        bio:app.bio||"Verified Chef on ChefAtHome.",
        menus:specialties.slice(0,3).map(s=>`${s} Speciality`)||["Custom Menu"],
        startingFrom:Number(app.suggestAllIn)||0,
        isDynamic:true, approvedAt:new Date().toISOString(),
      };
      addDynamicChef(chefProfile);
    }
    setPendingApps(p=>p.filter(a=>a.id!==id));
    setViewApp(null);
    refresh();
  };
  const rejectApp=(id)=>{const apps=loadApps();const i=apps.findIndex(a=>a.id===id);if(i>=0){apps[i].status="rejected";saveApps(apps);}setPendingApps(p=>p.filter(a=>a.id!==id));setViewApp(null);};
  const setChefStarting=(chefId,data)=>{const fees=loadChefFees();fees[chefId]={...fees[chefId],...data};saveChefFees(fees);setChefFeeMap({...fees});setEditFee(null);};
  const approveSug=(sug)=>{const chef=getAllChefs().find(c=>c.alias===sug.chefAlias);if(chef){const fees=loadChefFees();fees[chef.id]={...fees[chef.id],startingFrom:sug.suggestAllIn,cookStartingFrom:sug.suggestCook};saveChefFees(fees);}const all=loadFeeSugs().map(s=>s.id===sug.id?{...s,status:"approved"}:s);saveFeeSugs(all);setFeeSugs(p=>p.filter(s=>s.id!==sug.id));};

  const totalRevenue=allBookings.reduce((s,b)=>s+(b.amount||0),0);
  const allCustomers=[...new Set(allBookings.map(b=>b.customerEmail))];

  const AppModal=()=>{
    if(!viewApp) return null;
    return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewApp(null)}>
      <div className="modal-wide"><CloseBtn onClick={()=>setViewApp(null)}/>
        <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:4}}>{viewApp.fullName}</h2>
        <p style={{color:C.muted,fontSize:12,marginBottom:16}}>{viewApp.email} · {new Date(viewApp.submittedAt).toLocaleDateString()}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
          {[["NIC",viewApp.nic],["Phone",viewApp.phone],["Chef Type",viewApp.chefType],["Address",`${viewApp.address}, ${viewApp.city}, ${viewApp.district}`],["Experience",viewApp.experience],["Specialties",viewApp.specialties]].filter(([k,v])=>v).map(([k,v])=>(
            <div key={k} style={{background:C.surface,borderRadius:7,padding:"7px 11px"}}><div style={{fontSize:10,color:C.muted}}>{k}</div><div style={{fontWeight:600,fontSize:12}}>{v}</div></div>
          ))}
        </div>
        {viewApp.bio&&<div style={{marginBottom:12}}><label className="label">Bio</label><p style={{fontSize:13,color:C.muted,background:C.surface,borderRadius:8,padding:10}}>{viewApp.bio}</p></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:13}}>
          {[["🪪 NIC",viewApp.nicFile],["🚔 Police",viewApp.policeFile],["📸 Photo",viewApp.photoFile],["🎓 Certs",viewApp.certFile]].map(([l,f])=>{
            const hasFile=f?.data||typeof f==="string";
            const fileData=f?.data||null;
            const fileType=f?.type||"";
            const fileName=f?.name||f||"";
            const isImage=fileType.startsWith("image/");
            const isPDF=fileType==="application/pdf"||fileName.endsWith(".pdf");
            return(
              <div key={l} style={{background:hasFile?C.successBg:C.dangerBg,borderRadius:9,padding:"10px 12px",fontSize:12,border:`1px solid ${hasFile?C.success+"44":C.danger+"44"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hasFile&&fileData?8:0}}>
                  <span style={{fontWeight:700}}>{l}</span>
                  <span style={{fontWeight:700,color:hasFile?C.success:C.danger}}>{hasFile?"✓":"✗"}</span>
                </div>
                {hasFile&&fileData&&isImage&&<img src={fileData} alt={l} style={{width:"100%",borderRadius:6,maxHeight:120,objectFit:"cover",marginBottom:5}}/>}
                {hasFile&&fileData&&isPDF&&<a href={fileData} target="_blank" rel="noreferrer" style={{display:"block",background:C.info,color:"white",textAlign:"center",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,textDecoration:"none",marginBottom:4}}>📄 View PDF</a>}
                {hasFile&&fileName&&<div style={{fontSize:10,color:C.muted,wordBreak:"break-all"}}>{fileName}</div>}
              </div>
            );
          })}
        </div>
        {(viewApp.suggestAllIn||viewApp.suggestCook)&&<div style={{background:C.infoBg,borderRadius:9,padding:9,marginBottom:11,fontSize:12,color:C.info}}>💡 Suggested — All Inclusive: {fmtLKR(viewApp.suggestAllIn||0)} · Cook-at-Home: {fmtLKR(viewApp.suggestCook||0)}</div>}
        <div style={{display:"flex",gap:9}}>
          <button onClick={()=>rejectApp(viewApp.id)} style={{flex:1,padding:11,background:C.dangerBg,color:C.danger,border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>✗ Reject</button>
          <button onClick={()=>approveApp(viewApp.id)} style={{flex:1,padding:11,background:C.success,color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>✓ Approve Chef</button>
        </div>
      </div>
    </div>
  );
  };

  const FeeModal=()=>{
    if(!editFee) return null;
    return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setEditFee(null)}>
      <div className="modal"><CloseBtn onClick={()=>setEditFee(null)}/>
        <h2 style={{fontFamily:F.heading,fontSize:19,marginBottom:4}}>Set Starting Price — {editFee.alias}</h2>
        <p style={{color:C.muted,fontSize:12,marginBottom:16}}>This is the "Starting from" price shown publicly on the chef card.</p>
        <div style={{display:"grid",gap:12}}>
          <div><RL>All Inclusive Starting From (LKR)</RL><input className="input" type="number" value={feeForm.startingFrom} onChange={e=>setFeeForm(f=>({...f,startingFrom:Number(e.target.value)}))}/></div>
          <div><RL req={false}>Extra per Guest above 4 (LKR)</RL><input className="input" type="number" value={feeForm.extraPerGuest} onChange={e=>setFeeForm(f=>({...f,extraPerGuest:Number(e.target.value)}))}/></div>
        </div>
        <div style={{marginTop:10,padding:"7px 11px",background:C.infoBg,borderRadius:7,fontSize:12,color:C.info}}>Note: Chef proposes the actual price per booking. This is only the displayed starting price.</div>
        <button className="btn-primary" style={{width:"100%",padding:11,marginTop:14}} onClick={()=>setChefStarting(editFee.id,feeForm)}>✅ Save Starting Price</button>
      </div>
    </div>
  );
  };

  const ROLE_COLORS={super_admin:{bg:"#F3E8FF",c:"#7C3AED",l:"Super Admin"},maintenance_admin:{bg:"#E0F2FE",c:"#0369A1",l:"Maint. Admin"},chef:{bg:C.successBg,c:C.success,l:"Chef"},customer:{bg:C.infoBg,c:C.info,l:"Customer"}};
  const getRoleDisplay=(email)=>{ const stored=loadUsers().find(u=>u.email===email); return userRoles[email]||stored?.role||"customer"; };

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
      <AppModal/><FeeModal/>
      <div style={{width:240,background:"#0A0F1E",padding:"22px 11px",flexShrink:0}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:13}}>
          <div style={{fontFamily:F.heading,fontSize:15,color:"white",fontWeight:700}}>🍽️ ChefAtHome</div>
          <div style={{color:C.primary,fontSize:11,marginTop:2}}>⚡ Super Admin Panel</div>
        </div>
        {[["dashboard","📊","Dashboard"],["chef-apps","📋","Chef Applications",pendingApps.length],["maint-admins","🔧","Maintenance Admins"],["chefs","👨‍🍳","Chef Starting Prices"],["users","👥","All Users"],["bookings","📅","All Bookings"],["payments","💳","Payments"],["fee-sugs","💡","Fee Suggestions",feeSugs.length],["proposals","📝","All Proposals"],["activity","🕐","Login History"],["settings","⚙️","Settings"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}} style={{position:"relative"}}>
            <span>{ic}</span><span style={{fontSize:13}}>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:C.danger,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:28,background:C.surface,overflowY:"auto"}} key={`super-${loginKey}`}>
        {tab==="dashboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <div><h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:3}}>Super Admin Dashboard</h2><p style={{color:C.muted,fontSize:13}}>Full platform overview</p></div>
              <button onClick={refresh} style={{background:"white",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 13px",fontSize:12,cursor:"pointer"}}>🔄 Refresh</button>
            </div>
            {pendingApps.length>0&&<div onClick={()=>setTab("chef-apps")} style={{background:C.warnBg,border:`1px solid ${C.warn}44`,borderRadius:11,padding:"11px 16px",marginBottom:15,cursor:"pointer",display:"flex",gap:9,alignItems:"center"}}><span>⚠️</span><span style={{fontWeight:700,color:C.warn}}>{pendingApps.length} chef application{pendingApps.length>1?"s":""} pending</span><span style={{marginLeft:"auto",color:C.warn}}>Review →</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:24}}>
              <MetricCard label="Total Bookings" value={allBookings.length} color={C.primary}/>
              <MetricCard label="Total Revenue" value={fmtLKR(totalRevenue)} color={C.success}/>
              <MetricCard label="Proposals" value={allProposals.length} color={C.purple}/>
              <MetricCard label="Customers" value={allCustomers.length} color={C.warn}/>
            </div>
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:22,marginBottom:16}}>
              <h3 style={{fontFamily:F.heading,fontSize:16,marginBottom:14}}>Recent Bookings</h3>
              {allBookings.length===0?<p style={{color:C.muted,textAlign:"center",padding:20}}>No bookings yet.</p>:allBookings.slice().reverse().slice(0,5).map(b=>(
                <div key={b.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                  <div><span style={{fontWeight:600}}>{b.customerName||b.customerEmail}</span><span style={{color:C.muted}}> → {b.chefAlias} · {b.date}</span></div>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontWeight:700,color:C.primary}}>{b.amount?fmtLKR(b.amount):"TBD"}</span><BookingStatusBadge status={b.status}/></div>
=======

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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
                </div>
              ))}
            </div>
          </div>
        )}
<<<<<<< HEAD

        {tab==="chef-apps"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Chef Applications</h2>
            <p style={{color:C.muted,marginBottom:18,fontSize:13}}>Verify documents and approve or reject chef registrations.</p>
            {pendingApps.length===0?<EmptyState icon="✅" text="No pending applications."/>:pendingApps.map(app=>(
              <div key={app.id} style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:19,marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                  <div><div style={{fontWeight:700,fontSize:15}}>{app.fullName}</div><div style={{fontSize:11,color:C.muted}}>{app.email} · {app.chefType==="premium"?"Premium":"Standard"} · {app.city}</div></div>
                  <span style={{background:C.warnBg,color:C.warn,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:700}}>⏳ Pending</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:11}}>
                  {[["🪪 NIC",app.nicFile],["🚔 Police",app.policeFile],["📸 Photo",app.photoFile],["🎓 Certs",app.certFile]].map(([l,f])=>{
                    const has=f?.data||typeof f==="string";
                    return(<div key={l} style={{background:has?C.successBg:C.surface,borderRadius:7,padding:"5px 9px",fontSize:11,textAlign:"center",border:`1px solid ${has?C.success+"44":C.border}`}}><div>{l}</div><div style={{fontWeight:700,color:has?C.success:C.muted}}>{has?"✓":"–"}</div></div>);
                  })}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setViewApp(app)} style={{background:C.infoBg,color:C.info,padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>📄 Review</button>
                  <button onClick={()=>rejectApp(app.id)} style={{background:C.dangerBg,color:C.danger,padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✗ Reject</button>
                  <button onClick={()=>approveApp(app.id)} style={{background:C.success,color:"white",padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✓ Approve</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="maint-admins"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Maintenance Admins</h2>
            <p style={{color:C.muted,marginBottom:16,fontSize:13}}>Assign or remove Maintenance Admin access. Maintenance admins review chef proposals before customers are notified.</p>
            <div style={{background:C.infoBg,borderRadius:10,padding:"11px 16px",marginBottom:20,fontSize:13,color:C.info}}>
              ℹ️ Maintenance admins can: review proposals, accept/reject, adjust prices, view bookings. They cannot manage users, settings, or chef applications.
            </div>
            {/* Promote any user to M.Admin */}
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18,marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🔧 Current Maintenance Admins</div>
              {allUsers.filter(u=>getRoleDisplay(u.email)==="maintenance_admin").length===0
                ? <p style={{color:C.muted,fontSize:13}}>No maintenance admins yet. Assign one from All Users below.</p>
                : allUsers.filter(u=>getRoleDisplay(u.email)==="maintenance_admin").map((u,i)=>(
                  <div key={u.email} style={{background:"#E0F2FE",borderRadius:9,border:"1px solid #BAE6FD",padding:"12px 16px",marginBottom:9,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar initials={(u.name||"U").split(" ").map(n=>n[0]).join("").slice(0,2)} size={34} color="#0369A1"/>
                      <div><div style={{fontWeight:600,fontSize:13}}>{u.name||u.email}</div><div style={{fontSize:11,color:"#0369A1"}}>{u.email}</div></div>
                    </div>
                    <button onClick={()=>{if(window.confirm(`Remove Maintenance Admin role from ${u.name||u.email}?`)){removeUserRole(u.email);}}} style={{background:C.dangerBg,color:C.danger,padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>🗑 Remove M.Admin</button>
                  </div>
                ))
              }
            </div>
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>👥 All Users — Assign M.Admin Role</div>
              {allUsers.filter(u=>getRoleDisplay(u.email)!=="super_admin"&&getRoleDisplay(u.email)!=="maintenance_admin").map((u,i)=>{
                const currentRole=getRoleDisplay(u.email);
                const rc=ROLE_COLORS[currentRole]||ROLE_COLORS.customer;
                return(
                  <div key={u.email} style={{border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar initials={(u.name||"U").split(" ").map(n=>n[0]).join("").slice(0,2)} size={32} color={[C.primary,C.info,C.success,C.warn,C.purple][i%5]}/>
                      <div><div style={{fontWeight:600,fontSize:13}}>{u.name||u.email}</div><div style={{fontSize:11,color:C.muted}}>{u.email}</div></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:rc.bg,color:rc.c}}>{rc.l}</span>
                      <button onClick={()=>setUserRole(u.email,"maintenance_admin")} style={{background:"#E0F2FE",color:"#0369A1",padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>🔧 Make M.Admin</button>
                    </div>
                  </div>
                );
              })}
              {allUsers.filter(u=>getRoleDisplay(u.email)!=="super_admin"&&getRoleDisplay(u.email)!=="maintenance_admin").length===0&&
                <p style={{color:C.muted,fontSize:13,textAlign:"center",padding:16}}>All users are already admins or no users registered yet.</p>}
            </div>
          </div>
        )}

        {tab==="chefs"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Chef Starting Prices</h2>
            <p style={{color:C.muted,marginBottom:18,fontSize:13}}>Set the "Starting from" price displayed on each chef's card. Actual price is set per booking via proposal.</p>
            {getAllChefs().map(c=>{
              const fee=chefFeeMap[c.id];
              return(
                <div key={c.id} style={{background:"white",borderRadius:11,border:`1px solid ${c.isDynamic?C.success:C.border}`,padding:17,marginBottom:10,display:"flex",alignItems:"center",gap:13,justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <Avatar initials={c.image||c.alias?.slice(0,2)} size={38} color={c.type==="premium"?"#B45309":C.primary}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{c.alias}</div>
                      <div style={{fontSize:11,color:C.muted}}>{c.type==="premium"?"Premium":"Standard"} · {c.location}
                        {c.isDynamic&&<span style={{marginLeft:7,background:C.successBg,color:C.success,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>NEW ✓ Approved</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>Starting From</div><div style={{fontWeight:700,color:C.primary,fontSize:14}}>{fee?fmtLKR(fee.startingFrom||c.startingFrom):fmtLKR(c.startingFrom||0)}</div></div>
                    <button onClick={()=>{setEditFee(c);setFeeForm({startingFrom:fee?.startingFrom||c.startingFrom||0,extraPerGuest:fee?.extraPerGuest||2000});}} style={{background:C.infoBg,color:C.info,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✏️ Edit Price</button>
                    <button onClick={()=>removeChef(c.id,c.alias)} style={{background:C.dangerBg,color:C.danger,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>🗑 Remove</button>
                  </div>
                </div>
              );
            })}
            {removedChefIds.length>0&&(
              <div style={{marginTop:16,padding:"10px 14px",background:C.surface,borderRadius:9,border:`1px solid ${C.border}`,fontSize:12,color:C.muted}}>
                {removedChefIds.length} chef(s) removed. <span style={{color:C.primary,cursor:"pointer",fontWeight:600}} onClick={()=>{ls.set("cah_removed_chefs",[]);setRemovedChefIds([]);window.dispatchEvent(new StorageEvent("storage",{key:"cah_removed_chefs"}));}}>Restore all</span>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
              </div>
            )}
          </div>
        )}
<<<<<<< HEAD

        {tab==="users"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontFamily:F.heading,fontSize:20}}>All Users</h2>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:13,color:C.muted}}>{allUsers.length} registered</span>
                <button onClick={()=>setTab("activity")} style={{background:C.infoBg,color:C.info,padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>🕐 View Login History</button>
              </div>
            </div>
            {/* Summary stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:20}}>
              <MetricCard label="Total Users" value={allUsers.length} color={C.primary}/>
              <MetricCard label="Customers" value={allUsers.filter(u=>getRoleDisplay(u.email)==="customer").length} color={C.info}/>
              <MetricCard label="Chefs" value={allUsers.filter(u=>getRoleDisplay(u.email)==="chef").length} color={C.success}/>
              <MetricCard label="Admins" value={allUsers.filter(u=>["maintenance_admin","super_admin"].includes(getRoleDisplay(u.email))).length} color={C.purple}/>
            </div>
            {allUsers.length===0?<EmptyState icon="👥" text="No users registered yet."/>:allUsers.map((u,i)=>{
              const currentRole=getRoleDisplay(u.email);
              const rc=ROLE_COLORS[currentRole]||ROLE_COLORS.customer;
              const log=loadActivityLog().filter(e=>e.email===u.email);
              const lastLogin=log.filter(e=>e.type==="login").slice(-1)[0];
              const loginCount=log.filter(e=>e.type==="login").length;
              const userBookings=allBookings.filter(b=>b.customerEmail===u.email);
              return(
              <div key={u.email} style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:16,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{display:"flex",gap:11,alignItems:"center"}}>
                    <Avatar initials={(u.name||"U").split(" ").map(n=>n[0]).join("").slice(0,2)} size={38} color={[C.primary,C.info,C.success,C.warn,C.purple][i%5]}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{u.name||"—"}</div>
                      <div style={{fontSize:12,color:C.muted}}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:rc.bg,color:rc.c}}>{rc.l}</span>
                    {currentRole!=="super_admin"&&(
                      <select value={currentRole} onChange={e=>setUserRole(u.email,e.target.value)} style={{fontSize:12,padding:"5px 9px",borderRadius:6,border:`1px solid ${C.border}`,cursor:"pointer"}}>
                        <option value="customer">Customer</option>
                        <option value="chef">Chef</option>
                        <option value="maintenance_admin">Maintenance Admin</option>
                      </select>
                    )}
                    {(currentRole==="chef"||currentRole==="maintenance_admin")&&(
                      <button onClick={()=>{if(window.confirm(`Remove ${rc.l} role from ${u.name||u.email}?`))removeUserRole(u.email);}} style={{background:C.dangerBg,color:C.danger,padding:"5px 11px",borderRadius:6,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>🗑 Remove</button>
                    )}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <div style={{textAlign:"center",padding:"7px 0",background:C.surface,borderRadius:8}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Joined</div>
                    <div style={{fontSize:12,fontWeight:600}}>{u.joinedAt?new Date(u.joinedAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric"}):"—"}</div>
                  </div>
                  <div style={{textAlign:"center",padding:"7px 0",background:C.surface,borderRadius:8}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Last Login</div>
                    <div style={{fontSize:12,fontWeight:600}}>{lastLogin?new Date(lastLogin.at).toLocaleDateString("en-LK",{day:"numeric",month:"short"}):"—"}</div>
                  </div>
                  <div style={{textAlign:"center",padding:"7px 0",background:C.surface,borderRadius:8}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Total Logins</div>
                    <div style={{fontSize:12,fontWeight:700,color:C.info}}>{loginCount}</div>
                  </div>
                  <div style={{textAlign:"center",padding:"7px 0",background:C.surface,borderRadius:8}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Bookings</div>
                    <div style={{fontSize:12,fontWeight:700,color:C.primary}}>{userBookings.length}</div>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}

        {tab==="activity"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:3}}>Login & Signup History</h2>
                <p style={{color:C.muted,fontSize:13}}>All user authentication events on the platform</p>
              </div>
              <div style={{display:"flex",gap:9,alignItems:"center"}}>
                <span style={{fontSize:13,color:C.muted}}>{loadActivityLog().length} events</span>
                <button onClick={()=>{if(window.confirm("Clear all activity logs?")){ls.set(K.activityLog,[]);refresh();}}} style={{background:C.dangerBg,color:C.danger,padding:"6px 13px",borderRadius:7,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>🗑 Clear Log</button>
              </div>
            </div>
            {/* Summary */}
            {(()=>{const log=loadActivityLog();const signups=log.filter(e=>e.type==="signup");const logins=log.filter(e=>e.type==="login");const today=new Date().toDateString();const todayLogins=logins.filter(e=>new Date(e.at).toDateString()===today);return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:20}}>
                <MetricCard label="Total Signups" value={signups.length} color={C.success}/>
                <MetricCard label="Total Logins" value={logins.length} color={C.primary}/>
                <MetricCard label="Logins Today" value={todayLogins.length} color={C.info}/>
                <MetricCard label="Unique Users" value={new Set(log.map(e=>e.email)).size} color={C.purple}/>
              </div>
            );})()}
            {/* Per-user breakdown */}
            {allUsers.length>0&&(
              <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18,marginBottom:18}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>👥 Per User Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:0,fontSize:12}}>
                  {["User","Role","Joined","Logins","Last Login"].map(h=><div key={h} style={{padding:"7px 10px",background:C.surface,fontWeight:700,color:C.muted,fontSize:11,borderBottom:`2px solid ${C.border}`}}>{h}</div>)}
                  {allUsers.map((u,i)=>{
                    const log=loadActivityLog().filter(e=>e.email===u.email);
                    const loginCount=log.filter(e=>e.type==="login").length;
                    const lastLogin=log.filter(e=>e.type==="login").slice(-1)[0];
                    const currentRole=getRoleDisplay(u.email);
                    const rc=ROLE_COLORS[currentRole]||ROLE_COLORS.customer;
                    return[
                      <div key={u.email+"n"} style={{padding:"9px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}><Avatar initials={(u.name||"U").split(" ").map(n=>n[0]).join("").slice(0,2)} size={24} color={[C.primary,C.info,C.success][i%3]}/><div><div style={{fontWeight:600}}>{u.name||"—"}</div><div style={{fontSize:10,color:C.muted}}>{u.email}</div></div></div>,
                      <div key={u.email+"r"} style={{padding:"9px 10px",borderBottom:`1px solid ${C.border}`,verticalAlign:"middle"}}><span style={{background:rc.bg,color:rc.c,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>{rc.l}</span></div>,
                      <div key={u.email+"j"} style={{padding:"9px 10px",borderBottom:`1px solid ${C.border}`,color:C.muted}}>{u.joinedAt?new Date(u.joinedAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"2-digit"}):"—"}</div>,
                      <div key={u.email+"l"} style={{padding:"9px 10px",borderBottom:`1px solid ${C.border}`,fontWeight:700,color:C.primary}}>{loginCount}</div>,
                      <div key={u.email+"ll"} style={{padding:"9px 10px",borderBottom:`1px solid ${C.border}`,color:C.muted,fontSize:11}}>{lastLogin?new Date(lastLogin.at).toLocaleString("en-LK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Never"}</div>,
                    ];
                  })}
                </div>
              </div>
            )}
            {/* Full event log */}
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>📋 Full Event Log</div>
              {loadActivityLog().length===0?<EmptyState icon="🕐" text="No activity recorded yet. Events appear as users log in or sign up."/>:
              loadActivityLog().slice().reverse().map((ev,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:ev.type==="signup"?C.successBg:C.infoBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                      {ev.type==="signup"?"✨":"🔐"}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{ev.name||ev.email}</div>
                      <div style={{fontSize:11,color:C.muted}}>{ev.email}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{background:ev.type==="signup"?C.successBg:C.infoBg,color:ev.type==="signup"?C.success:C.info,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block",marginBottom:3}}>
                      {ev.type==="signup"?"✨ New Signup":"🔐 Login"}
                    </span>
                    <div style={{fontSize:11,color:C.muted}}>{new Date(ev.at).toLocaleString("en-LK",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
                </div>
              ))}
            </div>
          </div>
        )}
<<<<<<< HEAD

        {tab==="bookings"&&<div><h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:18}}>All Bookings</h2>{allBookings.length===0?<EmptyState icon="📅" text="No bookings yet."/>:allBookings.slice().reverse().map(b=><div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><div><div style={{fontWeight:700,fontSize:14}}>{b.customerName||b.customerEmail}</div><div style={{fontSize:11,color:C.muted}}>#{b.id} · {b.chefAlias}</div></div><BookingStatusBadge status={b.status}/></div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,fontSize:12}}>{[["Date",b.date||"—"],["Time",b.time||"—"],["Guests",b.guests||"—"],["Phone",b.customerPhone||"—"],["Amount",b.amount?fmtLKR(b.amount):"TBD"]].map(([k,v])=><div key={k}><div style={{color:C.muted,fontSize:10}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>)}</div></div>)}</div>}
        {tab==="payments"&&<div><h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:16}}>Payments</h2><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:20}}><MetricCard label="Total Revenue" value={fmtLKR(totalRevenue)} color={C.primary}/><MetricCard label="Platform Fees" value={fmtLKR(allBookings.reduce((s,b)=>s+(b.commissionAmt||0),0))} color={C.info}/><MetricCard label="Safety Holds" value={fmtLKR(allBookings.reduce((s,b)=>s+(b.holdAmt||0),0))} color={C.warn}/></div>{allBookings.filter(b=>b.amount).length===0?<EmptyState icon="💳" text="No payments yet."/>:allBookings.filter(b=>b.amount).slice().reverse().map(b=><div key={b.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:16,marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600}}>{b.customerName||b.customerEmail}</div><div style={{fontSize:11,color:C.muted}}>{b.date} · {b.chefAlias}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.primary}}>{fmtLKR(b.amount)}</div><div style={{fontSize:11,color:C.muted}}>Fee: {fmtLKR(b.commissionAmt||0)} · Hold: {fmtLKR(b.holdAmt||0)}</div></div></div>)}</div>}
        {tab==="fee-sugs"&&<div><h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Fee Suggestions</h2><p style={{color:C.muted,marginBottom:18,fontSize:13}}>Chef suggested starting price adjustments. You control the final rates.</p>{feeSugs.length===0?<EmptyState icon="💡" text="No pending suggestions."/>:feeSugs.map(sug=><div key={sug.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:11}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><div><div style={{fontWeight:700,fontSize:14}}>{sug.chefAlias}</div><div style={{fontSize:11,color:C.muted}}>{sug.chefEmail}</div></div><span style={{background:C.warnBg,color:C.warn,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:700}}>Pending</span></div><div style={{display:"flex",gap:18,marginBottom:9}}><div><span style={{fontSize:12,color:C.muted}}>All Inclusive: </span><strong>{fmtLKR(sug.suggestAllIn)}</strong></div><div><span style={{fontSize:12,color:C.muted}}>Cook-at-Home: </span><strong>{fmtLKR(sug.suggestCook)}</strong></div></div>{sug.note&&<p style={{fontSize:13,color:C.muted,marginBottom:9}}>{sug.note}</p>}<div style={{display:"flex",gap:8}}><button onClick={()=>approveSug(sug)} style={{background:C.success,color:"white",padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✓ Approve</button><button onClick={()=>{const chef=getAllChefs().find(c=>c.alias===sug.chefAlias);if(chef){setEditFee(chef);setFeeForm({startingFrom:sug.suggestAllIn,extraPerGuest:settings.extraPerGuest});}}} style={{background:C.infoBg,color:C.info,padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✏️ Modify</button></div></div>)}</div>}
        {tab==="proposals"&&<div><h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:18}}>All Proposals</h2>{allProposals.length===0?<EmptyState icon="📝" text="No proposals yet."/>:allProposals.slice().reverse().map(p=>{const sc={pending_review:{bg:C.warnBg,c:C.warn,l:"Pending"},accepted:{bg:C.successBg,c:C.success,l:"Accepted"},rejected:{bg:C.dangerBg,c:C.danger,l:"Rejected"}}[p.status]||{bg:C.surface,c:C.muted,l:p.status};return(<div key={p.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:16,marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14}}>{p.chefAlias} → {p.customerEmail}</div><div style={{fontSize:11,color:C.muted}}>{new Date(p.submittedAt).toLocaleDateString()} · {(p.menuItems||[]).length} dishes</div></div><div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}><div style={{fontWeight:700,color:C.primary}}>{fmtLKR(p.finalPrice||p.proposedPrice)}</div><span style={{background:sc.bg,color:sc.c,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:600}}>{sc.l}</span></div></div>);})}</div>}
        {tab==="settings"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Platform Settings</h2>
            <p style={{color:C.muted,marginBottom:18,fontSize:13}}>Changes apply to all future payment calculations immediately.</p>
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:22,marginBottom:16}}>
              <h3 style={{fontFamily:F.heading,fontSize:16,marginBottom:14}}>💰 Commission Model</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:13}}>
                <div><RL>Platform Commission (%)</RL><input className="input" type="number" min="0" max="50" value={settings.commissionRate} onChange={e=>setSettings(s=>({...s,commissionRate:Number(e.target.value)}))}/></div>
                <div><RL>Safety Hold (%)</RL><input className="input" type="number" min="0" max="50" value={settings.safetyHoldRate} onChange={e=>setSettings(s=>({...s,safetyHoldRate:Number(e.target.value)}))}/></div>
                <div><RL>Extra per Guest above 4 (LKR)</RL><input className="input" type="number" value={settings.extraPerGuest} onChange={e=>setSettings(s=>({...s,extraPerGuest:Number(e.target.value)}))}/></div>
                <div><RL>Cancellation Window (hours)</RL><input className="input" type="number" value={settings.cancellationWindowHours} onChange={e=>setSettings(s=>({...s,cancellationWindowHours:Number(e.target.value)}))}/></div>
              </div>
              <div style={{background:C.infoBg,borderRadius:8,padding:"9px 13px",fontSize:12,color:C.info,marginBottom:13}}>
                📊 Chef earns <strong>{100-settings.commissionRate-settings.safetyHoldRate}%</strong> · Platform <strong>{settings.commissionRate}%</strong> · Safety hold <strong>{settings.safetyHoldRate}%</strong> (released after {settings.cancellationWindowHours}h)
              </div>
              <button className="btn-primary" style={{padding:"9px 24px"}} onClick={()=>{saveSettings(settings);alert("✅ Settings saved and active!");}}>Save Settings →</button>
            </div>
            <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:22}}>
              <h3 style={{fontFamily:F.heading,fontSize:16,marginBottom:9}}>💳 PayHere Config</h3>
              <div><RL>Merchant ID</RL><input className="input" defaultValue={PAYHERE_MERCHANT_ID} style={{maxWidth:280}}/></div>
              <div style={{marginTop:9,fontSize:12,color:C.muted}}>Replace PAYHERE_MERCHANT_ID constant in code with your actual Merchant ID for live payments.</div>
            </div>
          </div>
        )}
=======
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({mode,setMode,onClose}) {
  const {signIn,signUp,resetPassword}=useAuth();
  const [view,setView]=useState(mode);
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const submit=async()=>{
    setError("");setSuccess("");
    if(!form.email||(!form.password&&view!=="reset")) return setError("Please fill in all fields.");
    if(view==="signup"&&!form.name) return setError("Full name is required.");
    setLoading(true);
    try{
      if(view==="reset"){await resetPassword(form.email);setSuccess("✅ Reset link sent. Check your inbox.");setLoading(false);return;}
      if(view==="signup"){const d=await signUp(form.email,form.password,form.name);if(!d.access_token){setSuccess("✅ Account created! Check email to confirm.");setLoading(false);return;}}
      else await signIn(form.email,form.password);
      onClose();
    }catch(e){setError(e.message||e.error_description||"Something went wrong.");}
    setLoading(false);
  };
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <CloseBtn onClick={onClose}/>
        <div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:34,marginBottom:7}}>🍽️</div><h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:4}}>{view==="login"?"Welcome Back":view==="signup"?"Create Account":"Reset Password"}</h2><p style={{color:C.muted,fontSize:13}}>{view==="login"?"Login to manage your bookings":view==="signup"?"Join ChefAtHome today":"We'll send a reset link"}</p></div>
        <div style={{display:"grid",gap:11}}>
          {view==="signup"&&<div><RL>Full Name</RL><input className="input" placeholder="Your full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>}
          <div><RL>Email</RL><input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          {view!=="reset"&&<div><RL>Password</RL><input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>}
        </div>
        {view==="login"&&<div style={{textAlign:"right",marginTop:5}}><span style={{fontSize:12,color:C.primary,cursor:"pointer"}} onClick={()=>setView("reset")}>Forgot password?</span></div>}
        {error&&<div style={{marginTop:10,padding:"8px 11px",background:C.dangerBg,borderRadius:8,fontSize:13,color:C.danger}}>⚠️ {error}</div>}
        {success&&<div style={{marginTop:10,padding:"8px 11px",background:C.successBg,borderRadius:8,fontSize:13,color:C.success}}>{success}</div>}
        <button className="btn-primary" style={{width:"100%",padding:"12px",marginTop:15,fontSize:14,opacity:loading?.7:1}} onClick={submit} disabled={loading}>{loading?"Please wait…":view==="login"?"Login →":view==="signup"?"Create Account →":"Send Reset Link →"}</button>
        <p style={{textAlign:"center",marginTop:11,fontSize:12,color:C.muted}}>
          {view==="login"?<>No account? <span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>{setView("signup");setMode("signup");setError("");}}>Sign Up</span></>:view==="signup"?<>Have an account? <span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>{setView("login");setMode("login");setError("");}}>Login</span></>:<span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>{setView("login");setError("");}}>← Back</span>}
        </p>
        <div style={{marginTop:11,padding:"7px 11px",background:C.infoBg,borderRadius:8,fontSize:11,color:C.info}}>🔒 Secured by Supabase Auth · To become a chef, apply from your dashboard after signing up.</div>
        {view!=="reset"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:9,margin:"13px 0 4px"}}>
              <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:11,color:C.muted}}>or</span><div style={{flex:1,height:1,background:C.border}}/>
            </div>
            <button onClick={()=>sb.signInGoogle()} style={{width:"100%",padding:"11px",border:`1.5px solid ${C.border}`,borderRadius:8,background:"white",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:9,marginTop:4}}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
          </>
        )}
=======
// ─── Auth Modal (Supabase-powered) ───────────────────────────────────────────

function AuthModal({ mode, setMode, onClose }) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [view, setView] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength checker
  const checkPassword = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const strength = passed <= 2 ? "weak" : passed <= 3 ? "fair" : passed === 4 ? "good" : "strong";
    return { checks, strength, passed };
  };

  const pwdStrength = form.password ? checkPassword(form.password) : null;
  const strengthColor = { weak: COLORS.danger, fair: COLORS.warning, good: COLORS.info, strong: COLORS.success };
  const strengthLabel = { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong 💪" };

  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!form.email || (!form.password && view !== "reset")) return setError("Please fill in all fields.");

    // Password validation on signup
    if (view === "signup") {
      if (!form.name) return setError("Please enter your full name.");
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
      if (!/[A-Z]/.test(form.password)) return setError("Password must contain at least one uppercase letter.");
      if (!/[a-z]/.test(form.password)) return setError("Password must contain at least one lowercase letter.");
      if (!/[0-9]/.test(form.password)) return setError("Password must contain at least one number.");
    }

    setLoading(true);
    try {
      if (view === "reset") {
        await resetPassword(form.email);
        setSuccessMsg("✅ Password reset email sent! Check your inbox.");
        setLoading(false);
        return;
      }
      if (view === "signup") {
        const data = await signUp(form.email, form.password, form.name, form.role);
        if (!data.access_token) {
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
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder={view === "signup" ? "Min 8 chars, letters & numbers" : "••••••••"}
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: COLORS.textMuted }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Password strength meter — only on signup */}
              {view === "signup" && form.password && pwdStrength && (
                <div style={{ marginTop: 10 }}>
                  {/* Strength bar */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= pwdStrength.passed ? strengthColor[pwdStrength.strength] : COLORS.border, transition: "background 0.3s" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: strengthColor[pwdStrength.strength], fontWeight: 600 }}>
                      {strengthLabel[pwdStrength.strength]}
                    </span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{pwdStrength.passed}/5 requirements</span>
                  </div>
                  {/* Checklist */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {[
                      [pwdStrength.checks.length, "At least 8 characters"],
                      [pwdStrength.checks.upper, "Uppercase letter (A-Z)"],
                      [pwdStrength.checks.lower, "Lowercase letter (a-z)"],
                      [pwdStrength.checks.number, "Number (0-9)"],
                      [pwdStrength.checks.special, "Special character (!@#)"],
                    ].map(([passed, label]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                        <span style={{ color: passed ? COLORS.success : COLORS.textLight, fontWeight: 700 }}>{passed ? "✓" : "○"}</span>
                        <span style={{ color: passed ? COLORS.text : COLORS.textLight }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─── Static Pages ─────────────────────────────────────────────────────────────
function PricingPage(){return(<div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px"}}><div style={{textAlign:"center",marginBottom:40}}><h1 style={{fontFamily:F.heading,fontSize:36,fontWeight:700,marginBottom:10}}>Transparent Pricing</h1><p style={{color:C.muted,fontSize:15,maxWidth:480,margin:"0 auto"}}>Starting prices shown. Exact price confirmed by chef's personalised proposal after booking.</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:36}}>{[{type:"Standard Chef",desc:"Budget-friendly home dining",color:C.success,tiers:[["2–4 guests","Starting from LKR 6,000"],["5–8 guests","Starting from LKR 12,000"],["9+ guests","Starting from LKR 18,000"]]},{type:"Premium Chef",desc:"Luxury private dining",color:"#B45309",tiers:[["2–4 guests","Starting from LKR 25,000"],["5–8 guests","Starting from LKR 40,000"],["9+ guests","Starting from LKR 70,000"]]}].map(p=><div key={p.type} style={{background:"white",borderRadius:18,border:`2px solid ${p.color}22`,padding:26}}><h3 style={{fontFamily:F.heading,fontSize:22,marginBottom:6}}>{p.type}</h3><p style={{color:C.muted,fontSize:13,marginBottom:14}}>{p.desc}</p>{p.tiers.map(([t,pr])=><div key={t} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.muted}}>{t}</span><span style={{fontSize:13,fontWeight:700,color:p.color}}>{pr}</span></div>)}</div>)}</div><div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,borderRadius:18,padding:30,textAlign:"center",color:"white"}}><h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:8}}>How Pricing Works</h2><p style={{color:"rgba(255,255,255,.6)",marginBottom:20}}>Request → Chef proposes custom menu + price → Maintenance admin approves → You pay</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>{[["🍽️","Custom Menu","Chef tailors menu for your event"],["💡","Transparent Price","Exact price before you pay"],["🔒","Secure Payment","PayHere after admin approval"]].map(([ic,t,d])=><div key={t} style={{background:"rgba(255,255,255,.08)",borderRadius:11,padding:18}}><div style={{fontSize:28,marginBottom:7}}>{ic}</div><div style={{fontWeight:600,marginBottom:5}}>{t}</div><div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>{d}</div></div>)}</div></div></div>);}
function AIMenuPage(){return(<div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px"}}><div style={{textAlign:"center",marginBottom:36}}><div style={{display:"inline-flex",alignItems:"center",gap:7,background:"linear-gradient(135deg,#1e293b,#0f172a)",border:"1px solid rgba(232,116,59,.4)",borderRadius:20,padding:"6px 15px",marginBottom:16}}><span style={{color:C.primary,fontSize:12,fontWeight:600,letterSpacing:1}}>✨ AI-POWERED</span></div><h1 style={{fontFamily:F.heading,fontSize:36,fontWeight:700,marginBottom:9}}>AI Menu Planner</h1><p style={{color:C.muted,fontSize:14,maxWidth:480,margin:"0 auto"}}>Select your occasion and get personalised menu recommendations with estimated price ranges</p></div><AIMenuAssistant/></div>);}

// ─── App Root ─────────────────────────────────────────────────────────────────
function AppInner() {
  const {user,signOut,loading:authLoading,loginKey}=useAuth();
  const [page,setPage]=useState("home");
  const [showAuth,setShowAuth]=useState(null);
  const [selectedChef,setSelectedChef]=useState(null);
  const [bookingChef,setBookingChef]=useState(null);
  const [chefListKey,setChefListKey]=useState(0);
  // Re-render chef-related pages whenever removed list or dynamic chefs change
  useEffect(()=>{
    const onStorage=(e)=>{
      if(!e||["cah_removed_chefs","cah_dynamic_chefs"].includes(e.key)||e.key===null)
        setChefListKey(k=>k+1);
    };
    window.addEventListener("storage",onStorage);
    return()=>window.removeEventListener("storage",onStorage);
  },[]);

  useEffect(()=>{
    setSelectedChef(null); setBookingChef(null);
    if (!user) { if(["admin","chef-panel","dashboard","maintenance-panel"].includes(page)) setPage("home"); return; }
    if (user.role==="super_admin") setPage("admin");
    else if (user.role==="maintenance_admin") setPage("maintenance-panel");
  // eslint-disable-next-line
  },[loginKey]);

  useEffect(()=>{ window.scrollTo(0,0); },[page]);
  const handleLogout=async()=>{ await signOut(); };

  if(authLoading) return(
    <div style={{minHeight:"100vh",background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:13}}>
      <style>{css}</style>
      <div style={{fontSize:44}}>🍽️</div>
      <div style={{fontFamily:F.heading,fontSize:20,color:C.dark}}>Chef<span style={{color:C.primary}}>at</span>Home</div>
      <div style={{color:C.muted,fontSize:13}} className="pulse">Loading…</div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.surface}}>
      <style>{css}</style>
      <Navbar page={page} setPage={setPage} user={user} onLogout={handleLogout} setShowAuth={setShowAuth}/>
      {page==="home"&&<><HeroSection setPage={setPage}/><FeaturesRow/><PopularExperiences key={`pop-${chefListKey}`} setPage={setPage}/><HowItWorks/><StatsRow/><TrustSection/><Footer setPage={setPage}/></>}
      {page==="chefs"&&<><ChefsPage key={`chefs-${chefListKey}`} setPage={setPage} setSelectedChef={setSelectedChef}/><Footer setPage={setPage}/></>}
      {page==="chef-profile"&&<><ChefProfile chef={selectedChef} setPage={setPage} setBookingChef={setBookingChef}/><Footer setPage={setPage}/></>}
      {page==="booking"&&<><BookingPage chef={bookingChef||selectedChef} setPage={setPage} user={user} setShowAuth={setShowAuth}/><Footer setPage={setPage}/></>}
      {page==="experiences"&&<div style={{maxWidth:1200,margin:"0 auto",padding:"44px 24px"}}><h1 style={{fontFamily:F.heading,fontSize:34,fontWeight:700,marginBottom:20}}>All Experiences</h1><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:18}}>{getAllChefs().flatMap(c=>(c.menus||[]).map(m=>({menu:m,chef:c}))).map(({menu,chef})=><div key={menu+chef.id} className="card" style={{cursor:"pointer"}} onClick={()=>{setSelectedChef(chef);setPage("chef-profile");}}><div style={{height:110,background:`linear-gradient(135deg,${C.dark}22,${C.primary}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🍽️</div><div style={{padding:14}}><div style={{fontFamily:F.heading,fontSize:14,fontWeight:600,marginBottom:5}}>{menu}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:C.muted}}>by {chef.alias}</span><Badge type={chef.type}/></div><div style={{fontSize:11,color:C.primary,fontWeight:600,marginTop:5}}>Price on Request</div></div></div>)}</div></div>}
      {page==="pricing"&&<><PricingPage/><Footer setPage={setPage}/></>}
      {page==="ai-menu"&&<><AIMenuPage/><Footer setPage={setPage}/></>}
      {page==="about"&&<div style={{maxWidth:760,margin:"0 auto",padding:"60px 24px",textAlign:"center"}}><h1 style={{fontFamily:F.heading,fontSize:36,fontWeight:700,marginBottom:16}}>About ChefAtHome</h1><p style={{color:C.muted,fontSize:15,lineHeight:1.8,marginBottom:22}}>Sri Lanka's first premium private chef booking platform, connecting food lovers with verified professional chefs for unforgettable home dining.</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13}}>{[["🎯","Our Mission","Make luxury private dining accessible to every Sri Lankan household"],["🔧","Our Process","Transparent proposal system — chef sets menu and price per event"],["💎","Our Values","Trust, quality, and extraordinary culinary experiences"]].map(([ic,t,d])=><div key={t} style={{background:"white",borderRadius:13,padding:22,border:`1px solid ${C.border}`}}><div style={{fontSize:28,marginBottom:9}}>{ic}</div><div style={{fontFamily:F.heading,fontSize:16,fontWeight:600,marginBottom:6}}>{t}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{d}</div></div>)}</div></div>}
      {page==="dashboard"&&<CustomerDashboard key={`dash-${loginKey}`} user={user} setPage={setPage} loginKey={loginKey}/>}
      {page==="chef-panel"&&<ChefPanel key={`chef-${loginKey}`} user={user} loginKey={loginKey}/>}
      {page==="maintenance-panel"&&<MaintenanceAdminPanel key={`maint-${loginKey}`} user={user} loginKey={loginKey}/>}
      {page==="admin"&&<SuperAdminPanel key={`admin-${loginKey}`} loginKey={loginKey}/>}
      {showAuth&&<AuthModal mode={showAuth} setMode={setShowAuth} onClose={()=>setShowAuth(null)}/>}
=======
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
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
    </div>
  );
}

export default function App() {
<<<<<<< HEAD
  return <AuthProvider><AppInner/></AuthProvider>;
=======
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
>>>>>>> 7a25285adfa3ffefc870d2e2a6543b4ee3944cba
}
