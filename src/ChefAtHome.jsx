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
  suspendedChefs:"cah_suspended_chefs",
  chefHistory:"cah_chef_history",
  chefIdCounter:"cah_chef_id_counter",
  maintAdminEmails:"cah_maint_admin_emails",
  supportAdmins:"cah_support_admins",
};
// Maintenance admin whitelist helpers
const loadMaintAdminEmails = () => ls.get(K.maintAdminEmails, []);
const saveMaintAdminEmails = (emails) => ls.set(K.maintAdminEmails, emails);
const isMaintAdminEmail = (email) => loadMaintAdminEmails().map(e=>e.toLowerCase()).includes((email||"").toLowerCase());
// Support Super Admin helpers
const loadSupportAdmins  = ()  => ls.get(K.supportAdmins, []);
const saveSupportAdmins  = (a) => ls.set(K.supportAdmins, a);
const isSupportAdmin     = (email) => loadSupportAdmins().some(a=>a.email.toLowerCase()===(email||"").toLowerCase());
const addSupportAdmin    = (admin) => { const all=loadSupportAdmins(); if(!all.find(a=>a.email.toLowerCase()===admin.email.toLowerCase())){ all.push({...admin,createdAt:new Date().toISOString()}); saveSupportAdmins(all); } };
const removeSupportAdmin = (email) => saveSupportAdmins(loadSupportAdmins().filter(a=>a.email.toLowerCase()!==email.toLowerCase()));
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
const addBooking    = (b) => { sbSaveBooking(b); };
const updateBooking = (id, patch) => { sbUpdateBooking(id, patch); };
const loadProposals = ()  => ls.get(K.proposals, []);
const saveProposals = (p) => ls.set(K.proposals, p);
const addProposal   = (p) => { sbSaveProposal(p); };
const updateProposal= (id, patch) => { const all=loadProposals(); const idx=all.findIndex(p=>p.id===id); if(idx>=0){all[idx]={...all[idx],...patch};sbSaveProposal(all[idx]);}  };
const loadReviews   = ()  => ls.get(K.reviews, []);
const addReview     = (r) => { sbAddReview(r); };
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

// ─── Suspended Chefs & Chef History ──────────────────────────────────────────
const loadSuspendedChefs  = ()  => ls.get(K.suspendedChefs, []);
const saveSuspendedChefs  = (s) => ls.set(K.suspendedChefs, s);
const loadChefHistory     = ()  => ls.get(K.chefHistory, []);
const addChefHistoryEvent = (ev) => { const all=loadChefHistory(); all.unshift({...ev, at:new Date().toISOString()}); if(all.length>1000) all.splice(1000); ls.set(K.chefHistory, all); };

// ─── Chef ID Counter ──────────────────────────────────────────────────────────
const getNextChefDisplayId = () => {
  const counter = (ls.get(K.chefIdCounter, 6)); // static chefs occupy 1–6
  const next = counter + 1;
  ls.set(K.chefIdCounter, next);
  return `CHF-${String(next).padStart(3,"0")}`;
};
const getStaticChefDisplayId = (idx) => `CHF-${String(idx+1).padStart(3,"0")}`;

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
    },
    // DB helpers
    from: (table) => ({
      select: (q="*",params="") => req(`/rest/v1/${table}?select=${q}${params}`),
      insert: (body)            => req(`/rest/v1/${table}`,"POST",body,{"Prefer":"return=representation"}),
      upsert: (body)            => req(`/rest/v1/${table}`,"POST",body,{"Prefer":"resolution=merge-duplicates,return=representation"}),
      delete: (match)           => req(`/rest/v1/${table}?${match}`,"DELETE"),
    }),
  };
})();

// ─── Supabase Maint Admin Whitelist ──────────────────────────────────────────
// Table: maint_admin_emails (id uuid, email text unique, created_at timestamptz)
// Falls back to localStorage if Supabase unavailable
const sbLoadMaintAdminEmails = async () => {
  try {
    const rows = await sb.from("maint_admin_emails").select("email");
    const emails = rows.map(r => r.email);
    saveMaintAdminEmails(emails); // keep local cache in sync
    return emails;
  } catch {
    return loadMaintAdminEmails(); // fallback to localStorage
  }
};
const sbAddMaintAdminEmail = async (email) => {
  try {
    await sb.from("maint_admin_emails").upsert({email: email.toLowerCase()});
  } catch(e) { console.warn("Supabase maint admin insert failed, using localStorage only", e); }
  const emails = loadMaintAdminEmails();
  if (!emails.map(e=>e.toLowerCase()).includes(email.toLowerCase())) {
    saveMaintAdminEmails([...emails, email.toLowerCase()]);
  }
};
const sbRemoveMaintAdminEmail = async (email) => {
  try {
    await sb.from("maint_admin_emails").delete(`email=eq.${encodeURIComponent(email.toLowerCase())}`);
  } catch(e) { console.warn("Supabase maint admin delete failed, using localStorage only", e); }
  saveMaintAdminEmails(loadMaintAdminEmails().filter(e => e.toLowerCase() !== email.toLowerCase()));
  // Signal all active sessions to re-evaluate their role
  window.dispatchEvent(new StorageEvent("storage", {key: K.maintAdminEmails}));
};
const sbIsMaintAdminEmail = async (email) => {
  const emails = await sbLoadMaintAdminEmails();
  return emails.map(e=>e.toLowerCase()).includes((email||"").toLowerCase());
};

// ─── Supabase Support Admin Persistence ──────────────────────────────────────
// Table: support_admins (id uuid, email text unique, name text, note text, created_at timestamptz)
// Falls back to localStorage if Supabase unavailable
const sbLoadSupportAdmins = async () => {
  try {
    const rows = await sb.from("support_admins").select("email,name,note,created_at");
    const admins = rows.map(r => ({
      email: r.email,
      name: r.name || r.email.split("@")[0].replace(/\./g," ").replace(/\b\w/g,c=>c.toUpperCase()),
      note: r.note || "",
      createdAt: r.created_at || new Date().toISOString(),
    }));
    saveSupportAdmins(admins); // keep local cache in sync
    return admins;
  } catch {
    return loadSupportAdmins(); // fallback to localStorage
  }
};
const sbAddSupportAdmin = async (admin) => {
  try {
    await sb.from("support_admins").upsert({
      email: admin.email.toLowerCase(),
      name: admin.name,
      note: admin.note || "",
    });
  } catch(e) { console.warn("Supabase support admin insert failed, using localStorage only", e); }
  addSupportAdmin(admin);
};
const sbRemoveSupportAdmin = async (email) => {
  try {
    await sb.from("support_admins").delete(`email=eq.${encodeURIComponent(email.toLowerCase())}`);
  } catch(e) { console.warn("Supabase support admin delete failed, using localStorage only", e); }
  removeSupportAdmin(email);
};
const sbIsSupportAdmin = async (email) => {
  const admins = await sbLoadSupportAdmins();
  return admins.some(a => a.email.toLowerCase() === (email||"").toLowerCase());
};


// ─── Supabase Chef Applications ──────────────────────────────────────────────
// Table: chef_applications
// Columns: id text, user_id text, email text, full_name text, chef_type text,
//          city text, phone text, bio text, specialties text, status text,
//          submitted_at timestamptz, data jsonb
const sbLoadApps = async () => {
  try {
    const rows = await sb.from("chef_applications").select("*");
    const apps = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      email: r.email,
      fullName: r.full_name,
      chefType: r.chef_type,
      city: r.city,
      phone: r.phone,
      bio: r.bio,
      specialties: r.specialties,
      status: r.status,
      submittedAt: r.submitted_at,
      ...(r.data || {}),
    }));
    saveApps(apps); // keep local cache
    return apps;
  } catch(e) {
    console.warn("Supabase chef apps load failed, using localStorage", e);
    return loadApps();
  }
};
const sbSaveApp = async (app) => {
  try {
    await sb.from("chef_applications").upsert({
      id: app.id,
      user_id: app.userId || app.email,
      email: app.email,
      full_name: app.fullName,
      chef_type: app.chefType,
      city: app.city,
      phone: app.phone,
      bio: app.bio,
      specialties: app.specialties,
      status: app.status || "pending",
      submitted_at: app.submittedAt || new Date().toISOString(),
      data: app, // include all fields including files
    });
  } catch(e) {
    console.warn("Supabase chef app save failed, using localStorage only", e);
  }
  // Always save full app (with files) locally
  const apps = loadApps();
  const idx = apps.findIndex(a => a.id === app.id);
  if (idx >= 0) apps[idx] = app; else apps.push(app);
  saveApps(apps);
};
const sbUpdateAppStatus = async (id, status) => {
  try {
    const apps = loadApps();
    const idx = apps.findIndex(a => a.id === id);
    const existingData = idx >= 0 ? {...apps[idx], status} : {status};
    await fetch(`${SB_URL}/rest/v1/chef_applications?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}`, "Prefer":"return=representation" },
      body: JSON.stringify({ status, data: existingData }),
    });
  } catch(e) {
    console.warn("Supabase chef app status update failed", e);
  }
  const apps = loadApps();
  const idx = apps.findIndex(a => a.id === id);
  if (idx >= 0) { apps[idx].status = status; saveApps(apps); }
};


// ─── Supabase Bookings ────────────────────────────────────────────────────────
const sbLoadBookings = async () => {
  try {
    const rows = await sb.from("bookings").select("id,data,created_at");
    const bookings = rows.map(r => ({id:r.id,...(r.data||{})}));
    saveBookings(bookings);
    return bookings;
  } catch(e) { console.warn("sbLoadBookings failed",e); return loadBookings(); }
};
const sbSaveBooking = async (booking) => {
  try {
    await sb.from("bookings").upsert({id:booking.id, data:booking});
  } catch(e) { console.warn("sbSaveBooking failed",e); }
  const all = loadBookings();
  const idx = all.findIndex(b=>b.id===booking.id);
  if(idx>=0) all[idx]=booking; else all.push(booking);
  saveBookings(all);
};
const sbUpdateBooking = async (id, patch) => {
  const all = await sbLoadBookings();
  const idx = all.findIndex(b=>b.id===id);
  if(idx>=0){
    all[idx]={...all[idx],...patch};
    await sbSaveBooking(all[idx]);
  }
};

// ─── Supabase Proposals ───────────────────────────────────────────────────────
const sbLoadProposals = async () => {
  try {
    const rows = await sb.from("proposals").select("id,booking_id,data,created_at");
    const proposals = rows.map(r => ({id:r.id,bookingId:r.booking_id,...(r.data||{})}));
    saveProposals(proposals);
    return proposals;
  } catch(e) { console.warn("sbLoadProposals failed",e); return loadProposals(); }
};
const sbSaveProposal = async (proposal) => {
  try {
    await sb.from("proposals").upsert({id:proposal.id, booking_id:proposal.bookingId, data:proposal});
  } catch(e) { console.warn("sbSaveProposal failed",e); }
  const all = loadProposals();
  const idx = all.findIndex(p=>p.id===proposal.id);
  if(idx>=0) all[idx]=proposal; else all.push(proposal);
  saveProposals(all);
};

// ─── Supabase Reviews ─────────────────────────────────────────────────────────
const sbLoadReviews = async () => {
  try {
    const rows = await sb.from("reviews").select("id,data,created_at");
    const reviews = rows.map(r => ({id:r.id,...(r.data||{})}));
    ls.set(K.reviews, reviews);
    return reviews;
  } catch(e) { console.warn("sbLoadReviews failed",e); return loadReviews(); }
};
const sbAddReview = async (review) => {
  try {
    await sb.from("reviews").upsert({id:review.id, data:review});
  } catch(e) { console.warn("sbAddReview failed",e); }
  addReview(review);
};

// ─── Supabase Users ───────────────────────────────────────────────────────────
const sbLoadUsers = async () => {
  try {
    const rows = await sb.from("users").select("email,data,created_at");
    const users = rows.map(r => ({email:r.email,...(r.data||{})}));
    saveUsers(users);
    return users;
  } catch(e) { console.warn("sbLoadUsers failed",e); return loadUsers(); }
};
const sbSaveUser = async (user) => {
  try {
    await sb.from("users").upsert({email:user.email, data:user});
  } catch(e) { console.warn("sbSaveUser failed",e); }
  const all = loadUsers();
  const idx = all.findIndex(u=>u.email===user.email);
  if(idx>=0) all[idx]=user; else all.push(user);
  saveUsers(all);
};

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
    let role = "customer";
    if (email === SUPER_ADMIN_EMAIL) {
      role = "super_admin";
    } else if (isSupportAdmin(email)) {
      // Support super admin — full admin access, created by super admin
      role = "support_admin";
    } else if (isMaintAdminEmail(email)) {
      // Maintenance admin whitelist
      role = "maintenance_admin";
    } else {
      // Fall back to stored role (chef, customer, etc.)
      const stored = loadUsers().find(u => u.email === email);
      role = stored?.role || ud.user_metadata?.role || "customer";
    }
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
    sbSaveUser(users.find(u=>u.email===email)||{email,name,role});
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
        // Refresh both whitelists from Supabase before formatting user (Google OAuth login)
        Promise.allSettled([sbLoadMaintAdminEmails(),sbLoadSupportAdmins()]).finally(()=>{
          sb.getUser(access_token)
            .then(ud => {
              ls.set(K.session, sessionData); setSession(sessionData);
              const u = formatUser(ud); setUser(u); ensureStore(u.email, u.name, u.role);
              addActivityEvent({type:"login", email:u.email, name:u.name});
              setLoginKey(k=>k+1);
              window.history.replaceState(null, "", window.location.pathname);
            })
            .catch(()=>{})
            .finally(()=>setLoading(false));
        });
        return;
      }
    }
    const stored = ls.get(K.session);
    if (stored?.access_token) {
      // Refresh both whitelists AND user roles on session restore too
      Promise.allSettled([sbLoadMaintAdminEmails(),sbLoadSupportAdmins(),sbLoadUsers()]).finally(()=>{
        sb.getUser(stored.access_token)
          .then(ud => { setSession(stored); const u=formatUser(ud); setUser(u); ensureStore(u.email,u.name,u.role); })
          .catch(() => ls.rm(K.session))
          .finally(() => setLoading(false));
      });
    } else setLoading(false);
  }, []);

  // Re-evaluate role instantly when maint/support admin whitelist changes
  useEffect(() => {
    const handle = async (e) => {
      if (e.key !== K.maintAdminEmails && e.key !== K.supportAdmins) return;
      const stored = ls.get(K.session);
      if (!stored?.access_token) return;
      await Promise.allSettled([sbLoadMaintAdminEmails(), sbLoadSupportAdmins()]);
      sb.getUser(stored.access_token).then(ud => {
        const u = formatUser(ud); setUser(u);
      }).catch(() => {});
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, [formatUser]);

  const signIn = async (email, password) => {
    const data = await sb.signIn(email, password);
    if (!data.access_token) throw new Error(data.error_description||"Login failed");
    ls.set(K.session, data); setSession(data);
    // Refresh both Supabase whitelists AND user roles before formatting user so role is correct
    await Promise.allSettled([sbLoadMaintAdminEmails(), sbLoadSupportAdmins(), sbLoadUsers()]);
    const ud = await sb.getUser(data.access_token);
    const u = formatUser(ud); setUser(u);
    ensureStore(u.email, u.name, u.role);
    addActivityEvent({type:"login", email:u.email, name:u.name});
    setLoginKey(k=>k+1); return u;
  };
  const signUp = async (email, password, name) => {
    const data = await sb.signUp(email, password, {full_name:name,role:"customer"});
    if (data.error) throw new Error(data.error.message||"Signup failed");
    // Refresh both whitelist caches so new user gets correct role immediately
    await Promise.allSettled([sbLoadMaintAdminEmails(), sbLoadSupportAdmins()]);
    const isMAdmin = isMaintAdminEmail(email);
    const isSAdmin = isSupportAdmin(email);
    const role = isSAdmin ? "support_admin" : isMAdmin ? "maintenance_admin" : "customer";
    const users = loadUsers();
    if (!users.find(u=>u.email===email)) {
      users.push({email,name,role,joinedAt:new Date().toISOString()});
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
  const suspendedIds = loadSuspendedChefs().map(s => s.id);
  const staticChefs = CHEFS_DATA
    .filter(c => !removedIds.includes(c.id) && !suspendedIds.includes(c.id))
    .map((c, idx) => ({...c, displayId: getStaticChefDisplayId(idx)}));
  const newChefs = dynamic.filter(d =>
    !CHEFS_DATA.find(c => c.alias === d.alias) && !removedIds.includes(d.id) && !suspendedIds.includes(d.id)
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
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
  body{font-family:${F.body};color:${C.text};background:${C.surface};overflow-x:hidden;-webkit-font-smoothing:antialiased}
  button{cursor:pointer;font-family:${F.body};border:none;touch-action:manipulation}
  input,select,textarea{font-family:${F.body};font-size:16px!important;-webkit-appearance:none;appearance:none}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
  .nav-link{color:rgba(255,255,255,.8);font-size:14px;font-weight:500;transition:color .2s;padding:6px 0;cursor:pointer;touch-action:manipulation}
  .nav-link:hover{color:white}
  .btn-primary{background:${C.primary};color:white;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;border:none;touch-action:manipulation;-webkit-appearance:none;transition:background .15s}
  .btn-primary:active{background:${C.primaryDark}}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed}
  @media(hover:hover){.btn-primary:hover{background:${C.primaryDark};transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,116,59,.4)}}
  .btn-outline{background:transparent;color:${C.primary};padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;border:2px solid ${C.primary};transition:all .15s;touch-action:manipulation}
  .btn-outline:active{background:${C.primaryLight}}
  @media(hover:hover){.btn-outline:hover{background:${C.primary};color:white}}
  .btn-ghost{background:rgba(255,255,255,.15);color:white;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;border:none;touch-action:manipulation;transition:background .15s}
  .btn-ghost:active{background:rgba(255,255,255,.3)}
  .card{background:white;border-radius:16px;border:1px solid ${C.border};overflow:hidden;transition:box-shadow .25s}
  @media(hover:hover){.card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.1)}}
  .badge-premium{background:linear-gradient(135deg,#B45309,#D97706);color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
  .badge-standard,.badge-local{background:${C.successBg};color:${C.success};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
  .badge-verified{background:${C.infoBg};color:${C.info};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
  .star{color:${C.gold}}
  .input{width:100%;padding:12px 14px;border:1.5px solid ${C.border};border-radius:8px;font-size:16px!important;outline:none;transition:border .2s;background:white;-webkit-appearance:none;appearance:none}
  .input:focus{border-color:${C.primary}}.input.error{border-color:${C.danger}}
  select.input{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%23666' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:38px}
  .label{font-size:13px;font-weight:600;color:${C.muted};margin-bottom:6px;display:block;letter-spacing:.3px}
  .sidebar-link{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:8px;color:rgba(255,255,255,.65);font-size:14px;font-weight:500;cursor:pointer;transition:background .15s;touch-action:manipulation;white-space:nowrap}
  .sidebar-link.active{background:${C.primary};color:white}
  @media(hover:hover){.sidebar-link:hover{background:rgba(255,255,255,.1);color:white}}
  .tab{padding:9px 16px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;background:transparent;color:${C.muted};touch-action:manipulation;white-space:nowrap;transition:background .15s}
  .tab.active{background:${C.primary};color:white}
  @media(hover:hover){.tab:hover:not(.active){background:${C.primaryLight};color:${C.primary}}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .3s ease forwards}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.pulse{animation:pulse 1.5s ease-in-out infinite}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);padding:0}
  @media(min-width:600px){.modal-overlay{align-items:center;padding:16px}}
  .modal{background:white;border-radius:20px 20px 0 0;padding:24px 18px 36px;width:100%;max-width:100%;position:relative;animation:fadeUp .25s ease;max-height:90vh;overflow-y:auto}
  @media(min-width:600px){.modal{border-radius:20px;padding:32px;width:480px;max-width:95vw}}
  .modal-wide{background:white;border-radius:20px 20px 0 0;padding:24px 18px 36px;width:100%;position:relative;animation:fadeUp .25s ease;max-height:90vh;overflow-y:auto}
  @media(min-width:600px){.modal-wide{border-radius:20px;padding:32px;width:700px;max-width:96vw}}
  .hide-mobile{display:none!important}
  @media(min-width:769px){.hide-mobile{display:flex!important}}
  .show-mobile{display:flex!important}
  @media(min-width:769px){.show-mobile{display:none!important}}
  .ai-bubble{background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:16px;color:white;border:1px solid rgba(232,116,59,.3)}
  .typing-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.primary};margin:0 2px;animation:pulse 1s ease-in-out infinite}
  .typing-dot:nth-child(2){animation-delay:.2s}.typing-dot:nth-child(3){animation-delay:.4s}
  .cal-day{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid transparent;margin:0 auto;touch-action:manipulation}
  .cal-sel{background:${C.primary}!important;color:white!important;border-color:${C.primary}!important}
  .cal-today{border-color:${C.primary};color:${C.primary};font-weight:700}.cal-dis{color:#ccc;cursor:not-allowed}
  .upload-zone{border:2px dashed ${C.border};border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:border .2s;background:${C.surface}}
  .upload-zone.has-file{border-color:${C.success};background:${C.successBg}}
  .req{color:${C.danger};margin-left:2px}
  .payhere-badge{background:linear-gradient(135deg,#0055CC,#0077FF);color:white;font-weight:800;font-size:14px;padding:5px 12px;border-radius:6px}
  .proposal-badge{background:linear-gradient(135deg,${C.purple},#6D28D9);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
  .maint-admin-badge{background:linear-gradient(135deg,#0284C7,#0EA5E9);color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
  .mob-nav{position:fixed;bottom:0;left:0;right:0;background:${C.darkNav};border-top:1px solid rgba(255,255,255,.1);display:flex;z-index:200;padding:4px 0 env(safe-area-inset-bottom,4px)}
  @media(min-width:769px){.mob-nav{display:none}}
  .mob-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;cursor:pointer;touch-action:manipulation;border:none;background:transparent;color:rgba(255,255,255,.5);font-size:9px;font-weight:600;font-family:${F.body}}
  .mob-nav-item.active{color:${C.primary}}
  .mob-nav-item span:first-child{font-size:18px}
  .mob-scroll-tabs{display:flex;overflow-x:auto;gap:6px;padding:10px 16px;background:${C.darkNav};-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .mob-scroll-tabs::-webkit-scrollbar{display:none}
  .mob-scroll-tab{flex-shrink:0;padding:8px 14px;border-radius:20px;color:rgba(255,255,255,.6);font-size:12px;font-weight:600;cursor:pointer;touch-action:manipulation;border:none;background:rgba(255,255,255,.08);white-space:nowrap;font-family:${F.body}}
  .mob-scroll-tab.active{background:${C.primary};color:white}
  .panel-layout{display:flex;min-height:calc(100vh - 64px)}
  .panel-sidebar{width:220px;background:${C.darkNav};padding:22px 11px;flex-shrink:0}
  @media(max-width:768px){.panel-sidebar{display:none}.panel-layout{flex-direction:column;min-height:calc(100vh - 64px - 56px)}}
  .panel-content{flex:1;padding:28px;overflow-x:hidden;min-width:0}
  @media(max-width:768px){.panel-content{padding:16px}}
  .r2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:500px){.r2{grid-template-columns:1fr}}
  .r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px}
  @media(max-width:700px){.r3{grid-template-columns:1fr 1fr}}
  @media(max-width:400px){.r3{grid-template-columns:1fr}}
  .r4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  @media(max-width:900px){.r4{grid-template-columns:1fr 1fr}}
  @media(max-width:480px){.r4{grid-template-columns:1fr}}
  .r5{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
  @media(max-width:900px){.r5{grid-template-columns:1fr 1fr}}
  @media(max-width:480px){.r5{grid-template-columns:1fr}}
  .hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
  @media(max-width:768px){.hero-grid{grid-template-columns:1fr;gap:32px}}
  .chef-row-btns{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  @media(max-width:600px){.chef-row-btns{gap:5px}}
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
    </div>
  );
}

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
    </div>
  );
}

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
    }
    setLoading(false);
  };

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
        </div>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({page,setPage,user,onLogout,setShowAuth}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const dashPage = user?.role==="super_admin"||user?.role==="support_admin"?"admin":user?.role==="maintenance_admin"?"maintenance-panel":user?.role==="chef"?"chef-panel":"dashboard";
  const dashLabel = user?.role==="super_admin"?"⚙️ Super Admin":user?.role==="support_admin"?"🛡️ Support Admin":user?.role==="maintenance_admin"?"🔧 M.Admin":user?.role==="chef"?"👨‍🍳 Panel":"Dashboard";
  const navPages=[["home","Home"],["chefs","Chefs"],["experiences","Experiences"],["pricing","Pricing"],["ai-menu","✨ AI Menu"],["about","About"]];
  return(
    <>
    <nav style={{background:C.darkNav,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 20px rgba(0,0,0,.2)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        <div onClick={()=>{setPage("home");setMenuOpen(false);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:20,color:C.primary}}>🍽️</span>
          <span style={{fontFamily:F.heading,fontWeight:700,fontSize:18,color:"white"}}>Chef<span style={{color:C.primary}}>at</span>Home</span>
        </div>
        <div className="hide-mobile" style={{display:"flex",alignItems:"center",gap:22}}>
          {navPages.map(([p,l])=><span key={p} className="nav-link" onClick={()=>setPage(p)} style={{color:page===p?C.primary:undefined}}>{l}</span>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user?(
            <>
              <button className="btn-primary" style={{fontSize:12,padding:"7px 11px",whiteSpace:"nowrap"}} onClick={()=>setPage(dashPage)}>{dashLabel}</button>
              <Avatar initials={user.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"U"} size={30}/>
              <button onClick={onLogout} style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.7)",padding:"6px 10px",borderRadius:6,fontSize:12,border:"none",whiteSpace:"nowrap"}}>Logout</button>
            </>
          ):(
            <button className="btn-ghost" style={{padding:"7px 14px",fontSize:13}} onClick={()=>setShowAuth("login")}>Log In</button>
          )}
          <button className="show-mobile" onClick={()=>setMenuOpen(o=>!o)} style={{background:"rgba(255,255,255,.1)",color:"white",padding:"7px 10px",borderRadius:7,fontSize:18,border:"none",lineHeight:1}}>☰</button>
        </div>
      </div>
    </nav>
    {menuOpen&&(
      <div style={{position:"fixed",inset:0,zIndex:199,background:"rgba(0,0,0,.5)"}} onClick={()=>setMenuOpen(false)}>
        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:60,left:0,right:0,background:C.darkNav,padding:"12px 0 20px",borderBottom:`1px solid rgba(255,255,255,.1)`}}>
          {navPages.map(([p,l])=>(
            <div key={p} onClick={()=>{setPage(p);setMenuOpen(false);}} style={{padding:"13px 24px",color:page===p?C.primary:"rgba(255,255,255,.85)",fontSize:15,fontWeight:500,cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              {l}
            </div>
          ))}
        </div>
      </div>
    )}
    </>
  );
}

// ─── Public Pages ─────────────────────────────────────────────────────────────
function HeroSection({setPage}){return(<section style={{background:`linear-gradient(135deg,${C.dark} 0%,#2D1810 50%,#3D1F0D 100%)`,minHeight:"88vh",display:"flex",alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 70% 50%,rgba(232,116,59,.15) 0%,transparent 60%)"}}/><div style={{maxWidth:1200,margin:"0 auto",padding:"60px 20px",width:"100%"}} className="hero-grid"><div className="fade-up"><div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(232,116,59,.2)",border:"1px solid rgba(232,116,59,.4)",borderRadius:20,padding:"6px 14px",marginBottom:18}}><span style={{color:C.primary,fontSize:12,fontWeight:600,letterSpacing:1}}>✦ PREMIUM PRIVATE DINING</span></div><h1 style={{fontFamily:F.heading,fontSize:"clamp(28px,5vw,54px)",fontWeight:700,color:"white",lineHeight:1.2,marginBottom:16}}>Book a Private Chef for <em style={{color:C.primary}}>Unforgettable</em> Dining at Home</h1><p style={{color:"rgba(255,255,255,.65)",fontSize:"clamp(14px,2vw,16px)",lineHeight:1.7,marginBottom:26,maxWidth:480}}>Enjoy restaurant-quality meals prepared by verified professional chefs in the comfort of your home.</p><div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:28}}><button className="btn-primary" style={{padding:"12px 24px",fontSize:15}} onClick={()=>setPage("chefs")}>Book a Chef</button><button className="btn-ghost" style={{padding:"12px 24px",fontSize:15}} onClick={()=>setPage("ai-menu")}>✨ AI Menu</button></div><div style={{display:"flex",gap:18,flexWrap:"wrap"}}>{[["✓ Verified Chefs","Background-checked"],["🛡️ Hygienic","Certified"],["⭐ 4.8/5","Satisfaction"]].map(([t,s])=><div key={t}><div style={{color:"white",fontSize:13,fontWeight:600}}>{t}</div><div style={{color:"rgba(255,255,255,.5)",fontSize:12}}>{s}</div></div>)}</div></div><div className="hide-mobile" style={{display:"flex",justifyContent:"center"}}><div style={{position:"relative"}}><div style={{width:360,height:400,borderRadius:24,background:"linear-gradient(135deg,#3D2010,#5C3020)",border:"1px solid rgba(232,116,59,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:28}}><div style={{fontSize:68}}>👨‍🍳</div><div style={{textAlign:"center"}}><div style={{fontFamily:F.heading,fontSize:17,color:"white",marginBottom:7}}>Private Chef Experience</div><div style={{color:C.primary,fontSize:13,marginBottom:12}}>⭐ 4.9 · 120+ Reviews · Verified</div><div style={{background:"rgba(232,116,59,.2)",borderRadius:10,padding:"8px 12px",color:"rgba(255,255,255,.8)",fontSize:12,marginBottom:12}}>💡 Chef sends personalised menu + price after booking</div><button className="btn-primary" style={{padding:"10px 24px"}} onClick={()=>setPage("chefs")}>Browse Chefs</button></div></div><div style={{position:"absolute",top:-16,right:-16,background:C.primary,borderRadius:12,padding:"8px 13px",color:"white",fontSize:12,fontWeight:600,boxShadow:"0 8px 24px rgba(232,116,59,.4)"}}>🎉 Just booked!</div></div></div></div></section>);}
function FeaturesRow(){return(<div style={{background:C.dark,padding:"22px 16px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}><style>{`@media(min-width:640px){.feat-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>{[["✓","Verified Chefs","Background-checked"],["💡","Proposal System","Chef sends menu & price"],["🍽️","Custom Menus","Tailored for you"],["🧹","Hassle-Free","Cook, serve & clean"]].map(([ic,t,d])=><div key={t} style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:18,flexShrink:0}}>{ic}</span><div><div style={{color:"white",fontWeight:600,fontSize:13}}>{t}</div><div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:1}}>{d}</div></div></div>)}</div></div>);}
function PopularExperiences({setPage}){return(<section style={{padding:"50px 16px",background:"white"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><div style={{color:C.primary,fontSize:12,fontWeight:600,letterSpacing:1,marginBottom:5}}>✦ EXPERIENCES</div><h2 style={{fontFamily:F.heading,fontSize:"clamp(22px,4vw,32px)",fontWeight:700}}>Popular Experiences</h2></div><button className="btn-outline" style={{fontSize:12,padding:"8px 16px",flexShrink:0}} onClick={()=>setPage("experiences")}>View All</button></div><div className="r4">{EXPERIENCES.map(exp=><div key={exp.name} className="card" style={{cursor:"pointer"}} onClick={()=>setPage("chefs")}><div style={{height:120,background:`linear-gradient(135deg,${C.dark}22,${C.primary}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>{exp.emoji}</div><div style={{padding:12}}><div style={{fontFamily:F.heading,fontSize:14,fontWeight:600,marginBottom:3}}>{exp.name}</div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>by {exp.chef}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><Stars value={exp.rating}/><span style={{fontSize:11,color:C.muted}}> ({exp.count})</span></div><div style={{fontSize:11,fontWeight:600,color:C.primary}}>Price on Request</div></div></div></div>)}</div></div></section>);}
function HowItWorks(){return(<section style={{padding:"50px 16px",background:C.surface}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{color:C.primary,fontSize:13,fontWeight:600,letterSpacing:1,marginBottom:7}}>✦ PROCESS</div><h2 style={{fontFamily:F.heading,fontSize:"clamp(24px,4vw,34px)",fontWeight:700}}>How It Works</h2></div><div className="r5">{[["🔍","Choose a Chef","Browse and request"],["📝","Chef Proposes","Menu & price sent"],["🔧","Admin Reviews","Maintenance admin approves"],["✅","Approve & Pay","Confirm via PayHere"],["🍽️","Enjoy","Chef cooks & cleans"]].map((s,i)=><div key={s[1]} style={{textAlign:"center",padding:"20px 12px",background:"white",borderRadius:14,border:`1px solid ${C.border}`,position:"relative"}}><div style={{width:48,height:48,borderRadius:"50%",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 10px"}}>{s[0]}</div><div style={{position:"absolute",top:12,left:12,width:20,height:20,borderRadius:"50%",background:C.primary,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{i+1}</div><div style={{fontFamily:F.heading,fontSize:14,fontWeight:600,marginBottom:4}}>{s[1]}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{s[2]}</div></div>)}</div></div></section>);}
function StatsRow(){return(<div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,padding:"32px 16px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,textAlign:"center"}}>{[["500+","Happy Customers"],["50+","Verified Chefs"],["1000+","Completed Events"],["4.9/5","Customer Rating"]].map(([v,l])=><div key={l}><div style={{fontFamily:F.heading,fontSize:"clamp(26px,6vw,34px)",fontWeight:700,color:C.primary}}>{v}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:13,marginTop:3}}>{l}</div></div>)}</div></div>);}
function TrustSection(){return(<div style={{background:C.dark,padding:"28px 16px"}}><div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,textAlign:"center"}}>{[["🛡️","Verified & Trusted"],["🔒","Secure Payments"],["⭐","Real Reviews"],["🕐","24/7 Support"],["🧼","Hygienic & Safe"],["🏆","Best Quality"]].map(([ic,t])=><div key={t}><div style={{fontSize:22,marginBottom:5}}>{ic}</div><div style={{color:"white",fontSize:11,fontWeight:600}}>{t}</div></div>)}</div></div>);}
function Footer({setPage}){return(<footer style={{background:C.dark,color:"rgba(255,255,255,.6)",padding:"36px 16px 22px"}}><div style={{maxWidth:1200,margin:"0 auto"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:24}}><div><div style={{fontFamily:F.heading,fontSize:18,color:"white",marginBottom:8}}>Chef<span style={{color:C.primary}}>at</span>Home</div><p style={{fontSize:12,lineHeight:1.6,maxWidth:220}}>Sri Lanka's premier private chef booking platform.</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[["Platform",["Browse Chefs","Pricing","AI Menu"]],["Support",["Help","FAQs","WhatsApp"]]].map(([t,ls])=><div key={t}><div style={{color:"white",fontWeight:600,marginBottom:8,fontSize:12}}>{t}</div>{ls.map(l=><div key={l} style={{fontSize:12,marginBottom:6,cursor:"pointer"}}>{l}</div>)}</div>)}</div></div><div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:16,display:"flex",flexWrap:"wrap",gap:8,justifyContent:"space-between",fontSize:11}}><span>© 2026 ChefAtHome.</span><span>Made with ❤️ in Sri Lanka 🇱🇰</span></div></div></footer>);}

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
        </div>
      </div>
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
function CustomerDashboard({user,setPage,loginKey}) {
  const [tab,setTab]=useState("overview");
  const [myBookings,setMyBookings]=useState([]);
  const [reviewTarget,setReviewTarget]=useState(null);
  const [payTarget,setPayTarget]=useState(null);
  const [showChefApp,setShowChefApp]=useState(false);

  const refresh=()=>sbLoadBookings().then(all=>setMyBookings(all.filter(b=>b.customerEmail===user?.email)));
  useEffect(()=>{ sbLoadBookings().then(all=>setMyBookings(all.filter(b=>b.customerEmail===user?.email))); },[user?.email,loginKey,reviewTarget,payTarget]);

  const upcoming=myBookings.filter(b=>!isBookingPast(b)&&b.status!=="cancelled"&&b.status!=="completed");
  const past=myBookings.filter(b=>isBookingPast(b)||b.status==="completed");
  const proposalReady=myBookings.filter(b=>b.status==="proposal_accepted");
  const pendingReview=past.filter(b=>!b.reviewed&&b.status==="confirmed");
  const reviews=loadReviews().filter(r=>r.customerEmail===user?.email);
  const [myApp,setMyApp]=useState(()=>loadApps().find(a=>a.email===user?.email)||null);
  useEffect(()=>{
    const loadMyApp=()=>sbLoadApps().then(apps=>setMyApp(apps.find(a=>a.email===user?.email)||null));
    loadMyApp();
    const interval=setInterval(loadMyApp,5000);
    return()=>clearInterval(interval);
  },[user?.email]);

  if(showChefApp) return <div style={{maxWidth:680,margin:"0 auto",padding:"36px 22px"}}><ChefJoinRequestForm user={user} onSubmit={(app)=>{setMyApp(app);setShowChefApp(false);setTab("become-chef");}} onCancel={()=>setShowChefApp(false)}/></div>;

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 60px)"}}>
      {/* Mobile scroll tabs */}
      <div className="show-mobile mob-scroll-tabs" style={{display:"flex"}}>
        {[["overview","🏠","Home"],["upcoming","📅","Upcoming"],["proposals","📋","Proposals"],["history","🗂","History"],["reviews","⭐","Reviews"],["become-chef","👨‍🍳","Chef"],["support","💬","Support"]].map(([id,ic,l])=>(
          <button key={id} className={`mob-scroll-tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{ic} {l}</button>
        ))}
      </div>
      <div className="panel-layout" style={{flex:1}}>
        {/* Desktop sidebar */}
        <div className="panel-sidebar">
          <div style={{padding:"0 7px 16px",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:11}}>
            <Avatar initials={user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"U"} size={38}/>
            <div style={{color:"white",fontWeight:600,fontSize:13,marginTop:7}}>{user?.name}</div>
            <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>Customer</div>
          </div>
        {[["overview","🏠","Overview"],["upcoming","📅","Upcoming",upcoming.length],["proposals","📋","Proposals",proposalReady.length],["history","🗂","History"],["reviews","⭐","Reviews",pendingReview.length],["become-chef","👨‍🍳","Become a Chef"],["support","💬","Support"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>setTab(id)} style={{position:"relative"}}>
            <span>{ic}</span><span>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:id==="proposals"?C.success:id==="reviews"?C.warn:C.primary,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      <div style={{flex:1,padding:28,background:C.surface,overflowY:"auto",minWidth:0}} className="panel-content" key={`dash-${loginKey}`}>

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
            <div className="r3" style={{marginBottom:22}}>
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
              </div>
            ))}
          </div>
        )}

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
                <h3 style={{fontFamily:F.heading,fontSize:19,marginBottom:7}}>{myApp.status==="approved"?"Approved! You have Chef Panel access.":myApp.status==="rejected"?"Application Rejected":"Application Under Review (2–3 business days)"}</h3>
                {myApp.status==="rejected"&&<div style={{marginTop:10}}><p style={{color:C.danger,fontSize:13,marginBottom:14}}>Your application was not approved. You may resubmit with updated documents.</p><button className="btn-primary" style={{padding:"10px 24px"}} onClick={()=>{setMyApp(null);setShowChefApp(true);}}>Resubmit Application →</button></div>}
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
      onSuccess();    }}
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
      </div>
    </div>
  );
}

// ─── Chef Panel ───────────────────────────────────────────────────────────────
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
              </div>
            ))}
          </div>
        )}

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
  const [submitting,setSubmitting]=useState(false);
  const submit=async()=>{
    if(submitting) return;
    setSubmitting(true);
    const app={id:genId(),userId:user?.id,email:user?.email,...form,submittedAt:new Date().toISOString(),status:"pending"};
    await sbSaveApp(app);
    window.dispatchEvent(new StorageEvent("storage",{key:K.apps}));
    setSubmitting(false);
    onSubmit(app);
  };
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
      {[{k:"nicFile",label:"NIC Copy",desc:"Front & back of National Identity Card (PDF only)",types:"application/pdf",icon:"🪪",req:true},{k:"policeFile",label:"Police Clearance Certificate",desc:"Valid Police Clearance Report (PDF only)",types:"application/pdf",icon:"🚔",req:true},{k:"photoFile",label:"Professional Chef Photo",desc:"Clear headshot in chef attire (PDF only)",types:"application/pdf",icon:"📸",req:true},{k:"certFile",label:"Culinary Certificates",desc:"Hotel/culinary school certificates (PDF only, optional)",types:"application/pdf",icon:"🎓",req:false}].map(doc=>(
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
      <button className="btn-primary" style={{width:"100%",padding:12,fontSize:14,opacity:submitting?0.7:1}} onClick={submit} disabled={submitting}>{submitting?"Submitting...":"Submit Application →"}</button>
    </div>}
    {step<4&&<div style={{display:"flex",gap:9,marginTop:18}}>{step>1&&<button className="btn-outline" style={{flex:1,padding:10}} onClick={()=>setStep(s=>s-1)}>← Back</button>}<button className="btn-primary" style={{flex:2,padding:10}} onClick={()=>{if(validate())setStep(s=>s+1);}}>Continue →</button></div>}
  </div>);
}

// ─── Maintenance Admin Panel ──────────────────────────────────────────────────
function MaintenanceAdminPanel({user,loginKey}) {
  const [tab,setTab]=useState("dashboard");
  const [tick,setTick]=useState(0);
  const proposals=loadProposals().filter(p=>p.status==="pending_review");
  const allProposals=loadProposals();
  const allBookings=loadBookings();
  const [viewProposal,setViewProposal]=useState(null);
  const [editPrice,setEditPrice]=useState("");
  const [rejectReason,setRejectReason]=useState("");
  const [viewBooking,setViewBooking]=useState(null);
  const [bookingNote,setBookingNote]=useState("");
  const [chefFilter,setChefFilter]=useState("");
  const [bookingFilter,setBookingFilter]=useState("all");
  const [searchQ,setSearchQ]=useState("");
  const [toastMsg,setToastMsg]=useState("");
  const [confirmAction,setConfirmAction]=useState(null);

  const refresh=()=>{sbLoadBookings();sbLoadProposals();setTick(t=>t+1);};

  const toast=(msg)=>{setToastMsg(msg);setTimeout(()=>setToastMsg(""),3000);};

  // Auto-refresh every 5s
  useEffect(()=>{
    const iv=setInterval(()=>setTick(t=>t+1),5000);
    return()=>clearInterval(iv);
  },[]);

  const acceptProposal=(proposal,finalPrice)=>{
    const price=Number(finalPrice||proposal.proposedPrice);
    updateProposal(proposal.id,{status:"accepted",finalPrice:price,reviewedAt:new Date().toISOString(),reviewedBy:user?.email});
    updateBooking(proposal.bookingId,{status:"proposal_accepted",proposalId:proposal.id});
    const bookings=loadBookings();
    const bk=bookings.find(b=>b.id===proposal.bookingId);
    if(bk){
      const notifs=ls.get("cah_notifs",{});
      notifs[bk.customerEmail]=[...(notifs[bk.customerEmail]||[]),{type:"proposal_accepted",bookingId:bk.id,chefAlias:bk.chefAlias,price,at:new Date().toISOString()}];
      ls.set("cah_notifs",notifs);
    }
    addActivityEvent({type:"proposal_accepted",by:user?.email,proposalId:proposal.id,price});
    toast("✅ Proposal accepted — customer notified!");
    refresh(); setViewProposal(null);
  };

  const rejectProposal=(proposal,reason)=>{
    updateProposal(proposal.id,{status:"rejected",rejectionReason:reason||"",reviewedAt:new Date().toISOString(),reviewedBy:user?.email});
    updateBooking(proposal.bookingId,{status:"proposal_rejected"});
    addActivityEvent({type:"proposal_rejected",by:user?.email,proposalId:proposal.id,reason});
    toast("❌ Proposal rejected.");
    refresh(); setViewProposal(null);
  };

  const cancelBooking=(bk,reason)=>{
    updateBooking(bk.id,{status:"cancelled",cancelledAt:new Date().toISOString(),cancelledBy:user?.email,cancelReason:reason||""});
    addActivityEvent({type:"booking_cancelled",by:user?.email,bookingId:bk.id,reason});
    toast("Booking cancelled.");
    refresh(); setViewBooking(null);
  };

  const addNoteToBooking=(bk,note)=>{
    if(!note.trim()) return;
    const notes=bk.adminNotes||[];
    updateBooking(bk.id,{adminNotes:[...notes,{note,by:user?.email,at:new Date().toISOString()}]});
    addActivityEvent({type:"booking_note",by:user?.email,bookingId:bk.id});
    toast("Note added!");
    setBookingNote("");
    refresh();
  };

  const markBookingComplete=(bk)=>{
    updateBooking(bk.id,{status:"completed",completedAt:new Date().toISOString(),completedBy:user?.email});
    addActivityEvent({type:"booking_completed",by:user?.email,bookingId:bk.id});
    toast("✅ Booking marked complete!");
    refresh(); setViewBooking(null);
  };

  const markBookingConfirmed=(bk)=>{
    updateBooking(bk.id,{status:"confirmed",confirmedAt:new Date().toISOString(),confirmedBy:user?.email});
    addActivityEvent({type:"booking_confirmed",by:user?.email,bookingId:bk.id});
    toast("✅ Booking confirmed!");
    refresh(); setViewBooking(null);
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

  // ── Stats ──
  const pendingProposals=proposals.length;
  const totalRevenue=allBookings.reduce((s,b)=>s+(b.amount||0),0);
  const confirmedCount=allBookings.filter(b=>b.status==="confirmed"||b.status==="completed").length;
  const cancelledCount=allBookings.filter(b=>b.status==="cancelled").length;
  const filteredBookings=allBookings.filter(b=>{
    const matchStatus=bookingFilter==="all"||b.status===bookingFilter;
    const matchSearch=!searchQ||(b.customerName||"").toLowerCase().includes(searchQ.toLowerCase())||(b.customerEmail||"").toLowerCase().includes(searchQ.toLowerCase())||(b.chefAlias||"").toLowerCase().includes(searchQ.toLowerCase())||(b.id||"").toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus&&matchSearch;
  });

  const BookingModal=()=>{
    if(!viewBooking) return null;
    const bk=viewBooking;
    const bkProposal=allProposals.find(p=>p.bookingId===bk.id);
    return(
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewBooking(null)}>
        <div className="modal-wide">
          <CloseBtn onClick={()=>setViewBooking(null)}/>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
            <span className="maint-admin-badge">Booking Detail</span>
            <h2 style={{fontFamily:F.heading,fontSize:19}}>#{bk.id}</h2>
            <BookingStatusBadge status={bk.status}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
            {[["Customer",bk.customerName||"—"],["Email",bk.customerEmail||"—"],["Phone",bk.customerPhone||"—"],["Chef",bk.chefAlias||"—"],["Date",bk.date||"—"],["Time",bk.time||"—"],["Guests",bk.guests||"—"],["Package",bk.package==="all-inclusive"?"All Inclusive":"Cook-at-Home"],["Amount",bk.amount?fmtLKR(bk.amount):"TBD"],["Occasion",bk.occasion||"—"]].map(([k,v])=>(
              <div key={k} style={{background:C.surface,borderRadius:7,padding:"7px 11px"}}><div style={{fontSize:10,color:C.muted}}>{k}</div><div style={{fontWeight:600,fontSize:13}}>{v}</div></div>
            ))}
          </div>
          {bk.address&&<div style={{background:C.surface,borderRadius:8,padding:"8px 12px",fontSize:12,marginBottom:10}}>📍 {bk.address}</div>}
          {bk.specialRequests&&<div style={{background:C.warnBg,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.warn,marginBottom:10}}>📝 Special: {bk.specialRequests}</div>}
          {bkProposal&&<div style={{background:C.infoBg,borderRadius:9,padding:"9px 13px",marginBottom:12,fontSize:12,color:C.info}}>
            📋 Proposal: {bkProposal.status} · Price: {fmtLKR(bkProposal.finalPrice||bkProposal.proposedPrice)} · {(bkProposal.menuItems||[]).length} dishes
          </div>}
          {/* Admin Notes */}
          <div style={{marginBottom:13}}>
            <div style={{fontWeight:700,fontSize:12,color:C.muted,marginBottom:7}}>ADMIN NOTES</div>
            {(bk.adminNotes||[]).length===0&&<div style={{fontSize:12,color:C.muted,marginBottom:7}}>No notes yet.</div>}
            {(bk.adminNotes||[]).map((n,i)=><div key={i} style={{background:C.surface,borderRadius:7,padding:"6px 10px",fontSize:12,marginBottom:5}}><span style={{fontWeight:600}}>{n.by}</span> · {new Date(n.at).toLocaleString()}<br/>{n.note}</div>)}
            <div style={{display:"flex",gap:8,marginTop:7}}>
              <input className="input" placeholder="Add a note..." value={bookingNote} onChange={e=>setBookingNote(e.target.value)} style={{flex:1,fontSize:12}}/>
              <button onClick={()=>addNoteToBooking(bk,bookingNote)} style={{background:C.info,color:"white",padding:"8px 14px",borderRadius:7,fontWeight:600,fontSize:12,border:"none"}}>Add</button>
            </div>
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {bk.status==="proposal_accepted"&&<button onClick={()=>markBookingConfirmed(bk)} style={{flex:1,padding:10,background:C.success,color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:13}}>✓ Mark Confirmed</button>}
            {(bk.status==="confirmed")&&<button onClick={()=>markBookingComplete(bk)} style={{flex:1,padding:10,background:C.info,color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:13}}>✅ Mark Complete</button>}
            {!["cancelled","completed"].includes(bk.status)&&<button onClick={()=>setConfirmAction({label:"Cancel this booking?",action:()=>cancelBooking(bk,"")})} style={{flex:1,padding:10,background:C.dangerBg,color:C.danger,border:"none",borderRadius:8,fontWeight:700,fontSize:13}}>✗ Cancel Booking</button>}
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal=()=>{
    if(!confirmAction) return null;
    return(
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmAction(null)}>
        <div className="modal" style={{maxWidth:380}}>
          <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:12}}>{confirmAction.label}</h3>
          <p style={{color:C.muted,fontSize:13,marginBottom:20}}>This action cannot be undone.</p>
          <div style={{display:"flex",gap:9}}>
            <button onClick={()=>setConfirmAction(null)} style={{flex:1,padding:10,background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,fontWeight:600}}>Cancel</button>
            <button onClick={()=>{confirmAction.action();setConfirmAction(null);}} style={{flex:1,padding:10,background:C.danger,color:"white",border:"none",borderRadius:8,fontWeight:700}}>Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 60px)"}}>
      <ProposalModal/>
      <BookingModal/>
      <ConfirmModal/>
      {toastMsg&&<div style={{position:"fixed",bottom:80,right:16,background:C.dark,color:"white",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toastMsg}</div>}
      {/* Mobile scroll tabs */}
      <div className="show-mobile mob-scroll-tabs" style={{display:"flex"}}>
        {[["dashboard","📊","Dashboard"],["proposals","📋",`Proposals${pendingProposals>0?` (${pendingProposals})`:""}`],["all-proposals","🗂","All"],["bookings","📅","Bookings"],["chefs","👨‍🍳","Chefs"],["activity","🕐","Activity"]].map(([id,ic,l])=>(
          <button key={id} className={`mob-scroll-tab ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}}>{ic} {l}</button>
        ))}
      </div>
      <div className="panel-layout" style={{flex:1}}>
      <div className="panel-sidebar" style={{background:"#0C1A2E",padding:"22px 11px"}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:13}}>
          <div style={{fontFamily:F.heading,fontSize:15,color:"white",fontWeight:700}}>🔧 Maintenance Admin</div>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2}}>{user?.email}</div>
        </div>
        {[["dashboard","📊","Dashboard"],["proposals","📋","Proposals",pendingProposals],["all-proposals","🗂","All Proposals"],["bookings","📅","Bookings"],["chefs","👨‍🍳","Chef Overview"],["activity","🕐","Activity Log"]].map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}} style={{position:"relative"}}>
            <span>{ic}</span><span>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:C.danger,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="panel-content" style={{flex:1,background:C.surface,overflowY:"auto"}} key={`maint-${loginKey}-${tick}`}>

        {/* ── Dashboard ── */}
        {tab==="dashboard"&&(
          <div className="fade-up">
            <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:4}}>Maintenance Dashboard</h2>
            <p style={{color:C.muted,fontSize:13,marginBottom:22}}>Real-time overview of bookings, proposals and chef activity.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
              {[["Pending Proposals",pendingProposals,C.warn,"📋"],["Total Bookings",allBookings.length,C.info,"📅"],["Confirmed",confirmedCount,C.success,"✅"],["Cancelled",cancelledCount,C.danger,"❌"]].map(([l,v,c,ic])=>(
                <div key={l} style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:"16px 18px"}}>
                  <div style={{fontSize:22,marginBottom:5}}>{ic}</div>
                  <div style={{fontFamily:F.heading,fontSize:26,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Recent Pending Proposals */}
              <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:18}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:13}}>⏳ Pending Proposals</div>
                {proposals.length===0?<EmptyState icon="✅" text="All caught up!"/>:proposals.slice(0,4).map(p=>(
                  <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{p.chefAlias}</div>
                      <div style={{fontSize:11,color:C.muted}}>{new Date(p.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontWeight:700,color:C.primary,fontSize:13}}>{fmtLKR(p.proposedPrice)}</span>
                      <button onClick={()=>{setViewProposal(p);setEditPrice("");}} style={{background:C.primaryLight,color:C.primary,padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,border:"none"}}>Review</button>
                    </div>
                  </div>
                ))}
                {proposals.length>4&&<div style={{fontSize:12,color:C.muted,marginTop:8}}>{proposals.length-4} more pending...</div>}
              </div>
              {/* Recent Bookings */}
              <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:18}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:13}}>📅 Recent Bookings</div>
                {allBookings.length===0?<EmptyState icon="📅" text="No bookings yet."/>:allBookings.slice().reverse().slice(0,5).map(b=>(
                  <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>setViewBooking(b)}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{b.customerName||b.customerEmail}</div>
                      <div style={{fontSize:11,color:C.muted}}>{b.chefAlias} · {b.date||"—"}</div>
                    </div>
                    <BookingStatusBadge status={b.status}/>
                  </div>
                ))}
              </div>
            </div>
            {/* Revenue summary */}
            <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:18,marginTop:16}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>💰 Total Revenue Processed</div>
              <div style={{fontFamily:F.heading,fontSize:28,fontWeight:700,color:C.success}}>{fmtLKR(totalRevenue)}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:3}}>Across {allBookings.filter(b=>b.amount).length} paid bookings</div>
            </div>
          </div>
        )}

        {/* ── Pending Proposals ── */}
        {tab==="proposals"&&(
          <div className="fade-up">
            <h3 style={{fontFamily:F.heading,fontSize:20,marginBottom:4}}>Pending Proposals</h3>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Review and approve or reject chef proposals before customers see them.</p>
            {proposals.length===0?<EmptyState icon="✅" text="No pending proposals. All caught up!"/>:proposals.map(p=>{
              const bk=allBookings.find(b=>b.id===p.bookingId)||{};
              return(
                <div key={p.id} style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:18,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{p.chefAlias}</div>
                      <div style={{fontSize:12,color:C.muted}}>Customer: {bk.customerName||p.customerEmail} · {bk.date||"—"} · {bk.guests||"—"} guests</div>
                      <div style={{fontSize:11,color:C.muted}}>Submitted: {new Date(p.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:F.heading,fontSize:20,fontWeight:700,color:C.primary}}>{fmtLKR(p.proposedPrice)}</div>
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
                    <button onClick={()=>setConfirmAction({label:"Reject this proposal?",action:()=>rejectProposal(p,"")})} style={{background:C.dangerBg,color:C.danger,padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>✗ Reject</button>
                    <button onClick={()=>acceptProposal(p,"")} style={{background:C.success,color:"white",padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>✓ Accept</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── All Proposals ── */}
        {tab==="all-proposals"&&(
          <div className="fade-up">
            <h3 style={{fontFamily:F.heading,fontSize:20,marginBottom:18}}>All Proposals</h3>
            {allProposals.length===0?<EmptyState icon="📋" text="No proposals yet."/>:allProposals.slice().reverse().map(p=>{
              const sc={pending_review:{bg:C.warnBg,c:C.warn,l:"Pending"},accepted:{bg:C.successBg,c:C.success,l:"Accepted ✓"},rejected:{bg:C.dangerBg,c:C.danger,l:"Rejected"}}[p.status]||{bg:C.surface,c:C.muted,l:p.status};
              return(
                <div key={p.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{p.chefAlias}</div>
                    <div style={{fontSize:11,color:C.muted}}>Customer: {p.customerEmail} · {new Date(p.submittedAt).toLocaleDateString()}</div>
                    <div style={{fontSize:11,color:C.muted}}>{(p.menuItems||[]).length} dishes · {p.reviewedBy?`Reviewed by ${p.reviewedBy}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                    <div style={{fontWeight:700,color:C.primary}}>{fmtLKR(p.finalPrice||p.proposedPrice)}</div>
                    <span style={{background:sc.bg,color:sc.c,padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:600}}>{sc.l}</span>
                    {p.rejectionReason&&<div style={{fontSize:11,color:C.danger}}>Reason: {p.rejectionReason}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Bookings ── */}
        {tab==="bookings"&&(
          <div className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <h3 style={{fontFamily:F.heading,fontSize:20}}>All Bookings</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <input className="input" placeholder="Search name, email, chef, ID..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:230,fontSize:13}}/>
                <select className="input" value={bookingFilter} onChange={e=>setBookingFilter(e.target.value)} style={{width:170,fontSize:13}}>
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Showing {filteredBookings.length} of {allBookings.length} bookings</div>
            {filteredBookings.length===0?<EmptyState icon="📅" text="No bookings match your filter."/>:filteredBookings.slice().reverse().map(b=>(
              <div key={b.id} onClick={()=>setViewBooking(b)} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:17,marginBottom:10,cursor:"pointer",transition:"box-shadow .2s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,.09)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{b.customerName||b.customerEmail}</div>
                    <div style={{fontSize:11,color:C.muted}}>{b.chefAlias} · #{b.id}</div>
                  </div>
                  <BookingStatusBadge status={b.status}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,fontSize:12}}>
                  {[["Date",b.date||"—"],["Guests",b.guests||"—"],["Phone",b.customerPhone||"—"],["Amount",b.amount?fmtLKR(b.amount):"TBD"]].map(([k,v])=><div key={k}><div style={{color:C.muted,fontSize:10}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>)}
                </div>
                {(b.adminNotes||[]).length>0&&<div style={{marginTop:8,fontSize:11,color:C.info}}>🗒 {(b.adminNotes||[]).length} admin note(s)</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Chef Overview ── */}
        {tab==="chefs"&&(
          <div className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontFamily:F.heading,fontSize:20}}>Chef Activity Overview</h3>
              <input className="input" placeholder="Filter by name..." value={chefFilter} onChange={e=>setChefFilter(e.target.value)} style={{width:200,fontSize:13}}/>
            </div>
            {getAllChefs().filter(c=>!chefFilter||(c.alias||"").toLowerCase().includes(chefFilter.toLowerCase())).map((c,idx)=>{
              const chefBookings=allBookings.filter(b=>b.chefAlias===c.alias);
              const chefProposals=allProposals.filter(p=>p.chefAlias===c.alias);
              const accepted=chefProposals.filter(p=>p.status==="accepted").length;
              const revenue=chefBookings.reduce((s,b)=>s+(b.amount||0),0);
              const displayId=c.displayId||getStaticChefDisplayId(idx);
              const isSuspended=loadSuspendedChefs().some(s=>s.id===c.id);
              return(
                <div key={c.id} style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:18,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"space-between",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:11}}>
                      <div style={{background:C.dark,color:"white",borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:800,fontFamily:"monospace"}}>{displayId}</div>
                      <Avatar initials={c.image||c.alias?.slice(0,2)} size={38} color={c.type==="premium"?"#B45309":C.primary}/>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{c.alias}
                          {isSuspended&&<span style={{marginLeft:7,background:C.dangerBg,color:C.danger,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>SUSPENDED</span>}
                          {c.isDynamic&&<span style={{marginLeft:7,background:C.successBg,color:C.success,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>NEW</span>}
                        </div>
                        <div style={{fontSize:12,color:C.muted}}>{c.location} · {c.type==="premium"?"Premium":"Standard"}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                      {[["Bookings",chefBookings.length,C.primary],["Proposals",chefProposals.length,C.info],["Accepted",accepted,C.success],["Revenue",fmtLKR(revenue),C.warn]].map(([l,v,c2])=>(
                        <div key={l} style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>{l}</div><div style={{fontWeight:700,color:c2,fontSize:l==="Revenue"?12:16}}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                  {chefBookings.length>0&&<div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,display:"flex",gap:7,flexWrap:"wrap"}}>
                    {chefBookings.slice(-3).reverse().map(b=>(
                      <div key={b.id} onClick={()=>setViewBooking(b)} style={{background:C.surface,borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",border:`1px solid ${C.border}`}}>
                        {b.customerName||b.customerEmail?.split("@")[0]} · {b.date||"—"} · <BookingStatusBadge status={b.status}/>
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Activity Log ── */}
        {tab==="activity"&&(
          <div className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontFamily:F.heading,fontSize:20}}>Activity Log</h3>
              <button onClick={refresh} style={{background:C.surface,border:`1px solid ${C.border}`,padding:"7px 14px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer"}}>🔄 Refresh</button>
            </div>
            {loadActivityLog().length===0?<EmptyState icon="🕐" text="No activity yet."/>:loadActivityLog().slice().reverse().map((ev,i)=>{
              const icons={proposal_accepted:"✅",proposal_rejected:"❌",booking_cancelled:"🚫",booking_note:"🗒",booking_completed:"✅",booking_confirmed:"📌"};
              const labels={proposal_accepted:"Proposal Accepted",proposal_rejected:"Proposal Rejected",booking_cancelled:"Booking Cancelled",booking_note:"Note Added",booking_completed:"Booking Completed",booking_confirmed:"Booking Confirmed"};
              return(
                <div key={i} style={{background:"white",borderRadius:9,border:`1px solid ${C.border}`,padding:"10px 14px",marginBottom:7,display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:18}}>{icons[ev.type]||"🔧"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{labels[ev.type]||ev.type}</div>
                    <div style={{fontSize:11,color:C.muted}}>By {ev.by} · {new Date(ev.at).toLocaleString()}</div>
                  </div>
                  {ev.price&&<div style={{fontWeight:700,color:C.primary,fontSize:13}}>{fmtLKR(ev.price)}</div>}
                </div>
              );
            })}
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

// ─── Maintenance Admin Manager
function MaintAdminManager({setUserRole,removeUserRole,allUsers}) {
  const [emails,setEmails]=useState(loadMaintAdminEmails);
  const [input,setInput]=useState("");
  const [error,setError]=useState("");
  const [toast,setToast]=useState("");
  const [sbLoading,setSbLoading]=useState(true);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),3000);};

  useEffect(()=>{
    sbLoadMaintAdminEmails().then(e=>{setEmails(e);setSbLoading(false);}).catch(()=>setSbLoading(false));
  },[]);

  const addEmail=async()=>{
    const email=input.trim().toLowerCase();
    if(!email){setError("Enter an email address.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}
    if(emails.map(e=>e.toLowerCase()).includes(email)){setError("This email is already in the list.");return;}
    setError("");
    await sbAddMaintAdminEmail(email);
    const updated=await sbLoadMaintAdminEmails();
    setEmails(updated);
    setUserRole(email,"maintenance_admin");
    setInput("");
    showToast("✅ Added! When this email logs in or signs up, they get Maintenance Admin access.");
  };

  const removeEmail=async(email)=>{
    await sbRemoveMaintAdminEmail(email);
    const updated=await sbLoadMaintAdminEmails();
    setEmails(updated);
    removeUserRole(email);
    showToast("Removed from whitelist. Access revoked.");
  };

  const matchedUser=(email)=>allUsers.find(u=>u.email.toLowerCase()===email.toLowerCase());

  return(
    <div>
      {toast&&<div style={{position:"fixed",bottom:28,right:28,background:C.dark,color:"white",padding:"11px 20px",borderRadius:10,fontSize:14,fontWeight:600,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toast}</div>}
      <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Maintenance Admins</h2>
      <p style={{color:C.muted,marginBottom:16,fontSize:13}}>Add any email address below (Gmail, .lk, or any domain). When that person logs in or signs up, they automatically get Maintenance Admin access. This is the only way to grant M.Admin access.</p>
      <div style={{background:C.infoBg,borderRadius:10,padding:"11px 16px",marginBottom:20,fontSize:13,color:C.info}}>
        ℹ️ Maintenance admins can: review proposals, accept/reject, adjust prices, view bookings and activity. They cannot manage users, settings, or chef applications.
      </div>
      {/* Add email input */}
      <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:20,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>➕ Add Maintenance Admin by Email</div>
        <div style={{display:"flex",gap:9}}>
          <input
            className={`input${error?" error":""}`}
            placeholder="e.g. admin@gmail.com or admin@company.lk"
            value={input}
            onChange={e=>{setInput(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&addEmail()}
            style={{flex:1}}
          />
          <button onClick={addEmail} style={{background:C.primary,color:"white",padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:14,border:"none",whiteSpace:"nowrap"}}>Add →</button>
        </div>
        {error&&<div style={{color:C.danger,fontSize:12,marginTop:6}}>{error}</div>}
        <div style={{fontSize:12,color:C.muted,marginTop:7}}>💡 Any email works — Gmail, .lk, or any domain. When they sign up or log in, they automatically get Maintenance Admin access.</div>
      </div>
      {/* Whitelist */}
      <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🔧 Authorised Maintenance Admin Emails ({emails.length})</div>
        {emails.length===0
          ? <div style={{textAlign:"center",padding:"28px 0",color:C.muted}}>
              <div style={{fontSize:32,marginBottom:8}}>📭</div>
              <div style={{fontSize:13}}>No maintenance admin emails added yet.</div>
              <div style={{fontSize:12,marginTop:4}}>Add a Gmail address above to get started.</div>
            </div>
          : emails.map(email=>{
            const u=matchedUser(email);
            const hasAccount=!!u;
            return(
              <div key={email} style={{background:"#E0F2FE",borderRadius:9,border:"1px solid #BAE6FD",padding:"13px 16px",marginBottom:9,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:11}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:"#0369A1",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:15}}>
                    {(u?.name||email)[0].toUpperCase()}
                  </div>
                  <div>
                    {u?.name&&<div style={{fontWeight:600,fontSize:13}}>{u.name}</div>}
                    <div style={{fontSize:12,color:"#0369A1"}}>{email}</div>
                    <div style={{fontSize:11,marginTop:2}}>
                      {hasAccount
                        ? <span style={{background:C.successBg,color:C.success,padding:"1px 7px",borderRadius:10,fontWeight:700}}>✓ Account exists · Active M.Admin</span>
                        : <span style={{background:C.warnBg,color:C.warn,padding:"1px 7px",borderRadius:10,fontWeight:700}}>⏳ No account yet — access granted on signup</span>
                      }
                    </div>
                  </div>
                </div>
                <button onClick={()=>removeEmail(email)} style={{background:C.dangerBg,color:C.danger,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>🗑 Remove</button>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── Support Admin Manager ───────────────────────────────────────────────────
function SupportAdminManager({allUsers,refresh}) {
  const [newEmail,setNewEmail]=useState("");
  const [newName,setNewName]=useState("");
  const [newNote,setNewNote]=useState("");
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [supportAdmins,setSupportAdmins]=useState(loadSupportAdmins);
  const [confirmDelete,setConfirmDelete]=useState(null);

  const reload=async()=>{ const admins=await sbLoadSupportAdmins().catch(()=>loadSupportAdmins()); setSupportAdmins(admins); refresh(); };

  useEffect(()=>{ reload(); },[]);

  const handleAdd=async()=>{
    setError(""); setSuccess("");
    if(!newEmail.trim()) return setError("Email is required.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) return setError("Enter a valid email address.");
    if(newEmail.trim().toLowerCase()===SUPER_ADMIN_EMAIL.toLowerCase()) return setError("Cannot add the Super Admin as a Support Admin.");
    if(isSupportAdmin(newEmail.trim())) return setError("This email is already a Support Admin.");
    const displayName=newName.trim()||newEmail.split("@")[0].replace(/\./g," ").replace(/\w/g,c=>c.toUpperCase());
    await sbAddSupportAdmin({email:newEmail.trim().toLowerCase(),name:displayName,note:newNote.trim()});
    // Also update role in users store if they already exist
    const users=loadUsers();
    const idx=users.findIndex(u=>u.email.toLowerCase()===newEmail.trim().toLowerCase());
    if(idx>=0){users[idx].role="support_admin";saveUsers(users);}
    window.dispatchEvent(new StorageEvent("storage",{key:K.users}));
    setSuccess(`✅ ${displayName} added as Support Admin. They will get full admin access on next login.`);
    setNewEmail(""); setNewName(""); setNewNote("");
    reload();
  };

  const handleRemove=async(admin)=>{
    await sbRemoveSupportAdmin(admin.email);
    // Demote in users store
    const users=loadUsers();
    const idx=users.findIndex(u=>u.email.toLowerCase()===admin.email.toLowerCase());
    if(idx>=0){users[idx].role="customer";saveUsers(users);}
    window.dispatchEvent(new StorageEvent("storage",{key:K.users}));
    setConfirmDelete(null);
    reload();
  };

  const existingUser=(email)=>allUsers.find(u=>u.email.toLowerCase()===email.toLowerCase());

  return(
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:4}}>🛡️ Support Super Admins</h2>
        <p style={{color:C.muted,fontSize:13}}>Support admins have <strong>full access</strong> to this panel — same as Super Admin, except they cannot manage other Support Admins. Add by email address; they get access on their next login.</p>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:22}}>
        <div style={{background:"white",borderRadius:11,border:`2px solid ${C.info}`,padding:"16px 20px"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,marginBottom:4}}>TOTAL SUPPORT ADMINS</div>
          <div style={{fontSize:32,fontWeight:800,color:C.info}}>{supportAdmins.length}</div>
        </div>
        <div style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:"16px 20px"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,marginBottom:4}}>PLATFORM ACCESS</div>
          <div style={{fontSize:13,fontWeight:700,color:C.success,marginTop:4}}>✅ Full Admin Panel</div>
          <div style={{fontSize:11,color:C.muted}}>All tabs except Support Admin management</div>
        </div>
        <div style={{background:"white",borderRadius:11,border:`1px solid ${C.border}`,padding:"16px 20px"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.5,marginBottom:4}}>RESTRICTIONS</div>
          <div style={{fontSize:13,fontWeight:700,color:C.warn,marginTop:4}}>🔒 Cannot add/remove Support Admins</div>
          <div style={{fontSize:11,color:C.muted}}>Only Super Admin manages this list</div>
        </div>
      </div>

      {/* Add form */}
      <div style={{background:"white",borderRadius:13,border:`1px solid ${C.border}`,padding:22,marginBottom:22}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:C.infoBg,color:C.info,padding:"4px 10px",borderRadius:8,fontSize:13}}>➕</span>
          Add New Support Admin
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:C.dark,display:"block",marginBottom:5}}>Gmail Address <span style={{color:C.danger}}>*</span></label>
            <input className="input" type="email" placeholder="support@gmail.com" value={newEmail}
              onChange={e=>{setNewEmail(e.target.value);setError("");setSuccess("");}}
              onKeyDown={e=>e.key==="Enter"&&handleAdd()}
              style={{border:error?`1.5px solid ${C.danger}`:"",borderRadius:8}}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:C.dark,display:"block",marginBottom:5}}>Display Name <span style={{color:C.muted,fontWeight:400}}>(optional)</span></label>
            <input className="input" type="text" placeholder="Auto-generated from email if blank" value={newName}
              onChange={e=>setNewName(e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:13}}>
          <label style={{fontSize:12,fontWeight:600,color:C.dark,display:"block",marginBottom:5}}>Internal Note <span style={{color:C.muted,fontWeight:400}}>(optional)</span></label>
          <input className="input" type="text" placeholder="e.g. Customer support team, handles refunds..." value={newNote}
            onChange={e=>setNewNote(e.target.value)}/>
        </div>
        {error&&<div style={{background:C.dangerBg,color:C.danger,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:11}}>⚠️ {error}</div>}
        {success&&<div style={{background:C.successBg,color:C.success,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:11}}>{success}</div>}
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={handleAdd} disabled={!newEmail.trim()}
            style={{background:newEmail.trim()?C.info:"#93C5FD",color:"white",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:700,fontSize:13,cursor:newEmail.trim()?"pointer":"not-allowed"}}>
            🛡️ Add Support Admin
          </button>
          <span style={{fontSize:12,color:C.muted}}>They will have full access on next login with this email.</span>
        </div>
      </div>

      {/* Current support admins list */}
      {confirmDelete&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(null)}>
          <div className="modal">
            <CloseBtn onClick={()=>setConfirmDelete(null)}/>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:44,marginBottom:8}}>🗑️</div>
              <h3 style={{fontFamily:F.heading,fontSize:18,marginBottom:6}}>Remove Support Admin?</h3>
              <p style={{color:C.muted,fontSize:13}}>This will remove <strong>{confirmDelete.name}</strong> ({confirmDelete.email}) from the Support Admin list. They will lose all admin access on next login.</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>handleRemove(confirmDelete)} style={{flex:1,padding:11,background:C.danger,color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>🗑 Remove Access</button>
            </div>
          </div>
        </div>
      )}

      <div style={{fontWeight:700,fontSize:15,marginBottom:13}}>
        Current Support Admins ({supportAdmins.length})
      </div>
      {supportAdmins.length===0?(
        <div style={{background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:40,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:10}}>🛡️</div>
          <p style={{color:C.muted,fontWeight:600,marginBottom:4}}>No support admins yet</p>
          <p style={{color:C.muted,fontSize:13}}>Add a Gmail address above to grant full admin access.</p>
        </div>
      ):supportAdmins.map((admin,i)=>{
        const user=existingUser(admin.email);
        const isActive=user?.role==="support_admin";
        return(
          <div key={admin.email} style={{background:"white",borderRadius:12,border:`2px solid ${isActive?C.info:C.border}`,padding:18,marginBottom:11}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:13}}>
                {/* Badge */}
                <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{color:"rgba(255,255,255,.6)",fontSize:9,fontWeight:700,letterSpacing:1}}>SUP</div>
                  <div style={{color:"white",fontSize:13,fontWeight:800}}>{String(i+1).padStart(2,"0")}</div>
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontWeight:700,fontSize:15}}>{admin.name}</span>
                    <span style={{background:isActive?C.infoBg:C.surface,color:isActive?C.info:C.muted,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>
                      {isActive?"🛡️ Active":"⏳ Pending Login"}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:C.muted}}>{admin.email}</div>
                  {admin.note&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>📝 {admin.note}</div>}
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>Added: {new Date(admin.createdAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
                {!isActive&&(
                  <div style={{background:C.warnBg,color:C.warn,padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600}}>
                    ⚠️ Not logged in yet
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 11px",fontSize:11,color:C.muted}}>
                    🍽️ Full Panel Access
                  </div>
                  <button onClick={()=>setConfirmDelete(admin)}
                    style={{background:C.dangerBg,color:C.danger,border:`1px solid ${C.danger}33`,borderRadius:7,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    🗑 Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Super Admin Panel ────────────────────────────────────────────────────────
function SuperAdminPanel({loginKey,user:panelUser}) {
  const {setRole}=useAuth();
  const isSupportAdminUser=panelUser?.role==="support_admin";
  const [tab,setTab]=useState("dashboard");
  const [settings,setSettings]=useState(loadSettings);
  const [pendingApps,setPendingApps]=useState([]);
  const [allApps,setAllApps]=useState([]);
  const [feeSugs,setFeeSugs]=useState(()=>loadFeeSugs().filter(s=>s.status==="pending"));
  const [allBookings,setAllBookings]=useState(loadBookings);
  useEffect(()=>{sbLoadApps().then(apps=>{setAllApps(apps);setPendingApps(apps.filter(a=>a.status==="pending"));});},[]);
  const [allProposals,setAllProposals]=useState(loadProposals);
  const [chefFeeMap,setChefFeeMap]=useState(loadChefFees);
  const [viewApp,setViewApp]=useState(null);
  const [editFee,setEditFee]=useState(null);
  const [feeForm,setFeeForm]=useState({startingFrom:25000,extraPerGuest:2000});
  const [removedChefIds,setRemovedChefIds]=useState(()=>ls.get("cah_removed_chefs",[]));
  const [suspendedChefs,setSuspendedChefs]=useState(loadSuspendedChefs);
  const [suspendTarget,setSuspendTarget]=useState(null);
  const [suspendReason,setSuspendReason]=useState("");
  const [chefHistoryLog,setChefHistoryLog]=useState(loadChefHistory);
  const [expandedChef,setExpandedChef]=useState(null);
  const [userRoles,setUserRoles]=useState(()=>{const r={};loadUsers().forEach(u=>{if(u.role)r[u.email]=u.role;});return r;});

  const loadAllUsers=()=>{
    const stored=loadUsers();
    const merged=[...stored];
    return merged;
  };
  const [allUsers,setAllUsers]=useState(loadAllUsers);
  useEffect(()=>{sbLoadUsers().then(users=>setAllUsers(users));},[]);

  const refresh=()=>{
    sbLoadBookings().then(setAllBookings);
    sbLoadProposals().then(setAllProposals);
    sbLoadApps().then(apps=>{setAllApps(apps);setPendingApps(apps.filter(a=>a.status==="pending"));});
    setFeeSugs(loadFeeSugs().filter(s=>s.status==="pending"));
    setChefFeeMap(loadChefFees());
    setAllUsers(loadAllUsers());
    const r={};loadUsers().forEach(u=>{if(u.role)r[u.email]=u.role;});
    setUserRoles(r);
    setRemovedChefIds(ls.get("cah_removed_chefs",[]));
    setSuspendedChefs(loadSuspendedChefs());
    setChefHistoryLog(loadChefHistory());
  };

  useEffect(()=>{
    const doRefresh=()=>{
      sbLoadBookings().then(setAllBookings);
      sbLoadProposals().then(setAllProposals);
      const apps=loadApps();
      setPendingApps(apps.filter(a=>a.status==="pending"));
      setFeeSugs(loadFeeSugs().filter(s=>s.status==="pending"));
      setChefFeeMap(loadChefFees());
      const stored=loadUsers();
      setAllUsers([...stored]);
      const r={};stored.forEach(u=>{if(u.role)r[u.email]=u.role;});
      setUserRoles(r);
      setRemovedChefIds(ls.get("cah_removed_chefs",[]));
      setSuspendedChefs(loadSuspendedChefs());
      setChefHistoryLog(loadChefHistory());
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
  const confirmSuspend=()=>{
    if(!suspendTarget) return;
    const {id:chefId,alias:chefAlias}=suspendTarget;
    const reason=suspendReason.trim()||"No reason provided";
    const updated=[...loadSuspendedChefs(),{id:chefId,alias:chefAlias,suspendedAt:new Date().toISOString(),reason}];
    saveSuspendedChefs(updated);
    setSuspendedChefs(updated);
    addChefHistoryEvent({chefId,chefAlias,action:"suspended",reason});
    window.dispatchEvent(new StorageEvent("storage",{key:K.suspendedChefs}));
    setSuspendTarget(null);setSuspendReason("");
    refresh();
  };
  const reactivateChef=(chefId,chefAlias)=>{
    const updated=loadSuspendedChefs().filter(s=>s.id!==chefId);
    saveSuspendedChefs(updated);
    setSuspendedChefs(updated);
    addChefHistoryEvent({chefId,chefAlias,action:"reactivated",reason:"Reactivated by super admin"});
    window.dispatchEvent(new StorageEvent("storage",{key:K.suspendedChefs}));
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
    sbUpdateAppStatus(id,"approved");
    const apps=loadApps();
    const i=apps.findIndex(a=>a.id===id);
    if(i>=0){
      apps[i].status="approved";
      saveApps(apps);
      setRole(apps[i].email,"chef");
      // Also update role in Supabase users table so user sees chef role on next load
      sb.from("users").upsert({email:apps[i].email, data:{...loadUsers().find(u=>u.email===apps[i].email)||{}, email:apps[i].email, role:"chef"}}).catch(()=>{});
      // Create a dynamic chef profile so they appear in the public chef listing
      const app=apps[i];
      const specialties=(app.specialties||"").split(",").map(s=>s.trim()).filter(Boolean);
      const initials=app.fullName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"CH";
      const newId=`dyn_${app.id}`;
      const displayId=getNextChefDisplayId();
      const chefProfile={
        id:newId, alias:app.fullName, email:app.email,
        displayId,
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
    setViewApp(null);
    sbLoadApps().then(apps=>{setAllApps(apps);setPendingApps(apps.filter(a=>a.status==="pending"));});
  };
  const rejectApp=async(id)=>{await sbUpdateAppStatus(id,"rejected");setViewApp(null);sbLoadApps().then(apps=>{setAllApps(apps);setPendingApps(apps.filter(a=>a.status==="pending"));});};
  const setChefStarting=(chefId,data)=>{const fees=loadChefFees();fees[chefId]={...fees[chefId],...data};saveChefFees(fees);setChefFeeMap({...fees});setEditFee(null);};
  const approveSug=(sug)=>{const chef=getAllChefs().find(c=>c.alias===sug.chefAlias);if(chef){const fees=loadChefFees();fees[chef.id]={...fees[chef.id],startingFrom:sug.suggestAllIn,cookStartingFrom:sug.suggestCook};saveChefFees(fees);}const all=loadFeeSugs().map(s=>s.id===sug.id?{...s,status:"approved"}:s);saveFeeSugs(all);setFeeSugs(p=>p.filter(s=>s.id!==sug.id));};

  const totalRevenue=allBookings.reduce((s,b)=>s+(b.amount||0),0);
  const allCustomers=[...new Set(allBookings.map(b=>b.customerEmail))];

  // SuspendModal rendered inline (not as inner component) to prevent re-mount on every keystroke
  const suspendModalJSX = suspendTarget ? (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget){setSuspendTarget(null);setSuspendReason("");}}}>
      <div className="modal">
        <CloseBtn onClick={()=>{setSuspendTarget(null);setSuspendReason("");}}/>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🚫</div>
        <h2 style={{fontFamily:F.heading,fontSize:19,marginBottom:4,textAlign:"center"}}>Suspend Chef</h2>
        <p style={{color:C.muted,fontSize:13,textAlign:"center",marginBottom:16}}>
          <strong>{suspendTarget.alias}</strong> ({suspendTarget.displayId}) will be hidden from the platform. Their data is preserved and they can be re-activated at any time.
        </p>
        <div style={{background:C.warnBg,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.warn}}>
          ⚠️ The chef will no longer appear in public listings or accept new bookings while suspended.
        </div>
        <label className="label">Reason for Suspension <span className="req">*</span></label>
        <textarea className="input" rows={3} placeholder="e.g. Complaint received — under review, violation of policy..." value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} style={{resize:"vertical",minHeight:70}}/>
        {suspendReason.trim().length<5&&suspendReason.length>0&&<p style={{fontSize:11,color:C.danger,marginTop:4}}>Please provide a meaningful reason (min 5 chars).</p>}
        <div style={{display:"flex",gap:9,marginTop:14}}>
          <button onClick={()=>{setSuspendTarget(null);setSuspendReason("");}} style={{flex:1,padding:11,background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button disabled={suspendReason.trim().length<5} onClick={confirmSuspend} style={{flex:1,padding:11,background:C.danger,color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",opacity:suspendReason.trim().length<5?0.5:1}}>🚫 Confirm Suspend</button>
        </div>
      </div>
    </div>
  ) : null;

  const openFilePDF=(fileData)=>{
    try{
      if(fileData.startsWith("data:")){
        const [,b64]=fileData.split(",");
        const binary=atob(b64);
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
        const blob=new Blob([bytes],{type:"application/pdf"});
        const url=URL.createObjectURL(blob);
        window.open(url,"_blank");
      } else {
        window.open(fileData,"_blank");
      }
    } catch(err){ alert("Could not open PDF. Please check the file."); }
  };

  const appModalJSX = viewApp ? (
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
          {[["🪪 NIC",viewApp.nicFile],["🚔 Police Clearance",viewApp.policeFile],["📸 Photo",viewApp.photoFile],["🎓 Certificates",viewApp.certFile]].map(([l,f])=>{
            const hasFile=f?.data||typeof f==="string";
            const fileData=f?.data||null;
            const fileType=f?.type||"";
            const fileName=f?.name||f||"";
            const isImage=fileType.startsWith("image/");
            const isPDF=fileType==="application/pdf"||fileName.endsWith(".pdf")||(fileData&&fileData.includes("application/pdf"));
            return(
              <div key={l} style={{background:hasFile?C.successBg:C.dangerBg,borderRadius:9,padding:"10px 12px",fontSize:12,border:`1px solid ${hasFile?C.success+"44":C.danger+"44"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hasFile&&fileData?8:0}}>
                  <span style={{fontWeight:700}}>{l}</span>
                  <span style={{fontWeight:700,color:hasFile?C.success:C.danger}}>{hasFile?"✓":"✗"}</span>
                </div>
                {hasFile&&fileData&&isImage&&(
                  <div>
                    <img
                      src={fileData} alt={l}
                      onClick={()=>window.open(fileData,"_blank")}
                      style={{width:"100%",borderRadius:6,maxHeight:120,objectFit:"cover",marginBottom:4,cursor:"zoom-in"}}
                    />
                    <div style={{fontSize:10,color:C.muted,textAlign:"center"}}>Click to view full size</div>
                  </div>
                )}
                {hasFile&&fileData&&isPDF&&(
                  <button onClick={()=>openFilePDF(fileData)} style={{display:"block",width:"100%",background:C.info,color:"white",textAlign:"center",padding:"7px 10px",borderRadius:6,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",marginBottom:4}}>
                    📄 Open PDF
                  </button>
                )}
                {hasFile&&!fileData&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>File name: {fileName}</div>}
                {hasFile&&fileName&&fileData&&<div style={{fontSize:10,color:C.muted,wordBreak:"break-all",marginTop:2}}>{fileName}</div>}
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
  ) : null;

  const feeModalJSX = editFee ? (
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
  ) : null;


  const ROLE_COLORS={super_admin:{bg:"#F3E8FF",c:"#7C3AED",l:"Super Admin"},support_admin:{bg:"#DBEAFE",c:"#1D4ED8",l:"Support Admin"},maintenance_admin:{bg:"#E0F2FE",c:"#0369A1",l:"Maint. Admin"},chef:{bg:C.successBg,c:C.success,l:"Chef"},customer:{bg:C.infoBg,c:C.info,l:"Customer"}};
  const getRoleDisplay=(email)=>{ const stored=loadUsers().find(u=>u.email===email); return userRoles[email]||stored?.role||"customer"; };

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 60px)"}}>
      {appModalJSX}{feeModalJSX}{suspendModalJSX}
      {/* Mobile scroll tabs */}
      <div className="show-mobile mob-scroll-tabs" style={{display:"flex"}}>
        {[["dashboard","📊","Dashboard"],["chef-apps","📋",`Apps${pendingApps.length>0?` (${pendingApps.length})`:""}`],["maint-admins","🔧","M.Admins"],!isSupportAdminUser&&["support-admins","🛡️","Support"],["chefs","👨‍🍳","Chefs"],["users","👥","Users"],["bookings","📅","Bookings"],["payments","💳","Payments"],["proposals","📝","Proposals"],["activity","🕐","Activity"],["settings","⚙️","Settings"]].filter(Boolean).map(([id,ic,l])=>(
          <button key={id} className={`mob-scroll-tab ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}}>{ic} {l}</button>
        ))}
      </div>
      <div className="panel-layout" style={{flex:1}}>
      <div className="panel-sidebar" style={{width:240,background:"#0A0F1E",padding:"22px 11px"}}>
        <div style={{padding:"0 7px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:13}}>
          <div style={{fontFamily:F.heading,fontSize:15,color:"white",fontWeight:700}}>🍽️ ChefAtHome</div>
          <div style={{color:isSupportAdminUser?C.info:C.primary,fontSize:11,marginTop:2}}>{isSupportAdminUser?"🛡️ Support Admin Panel":"⚡ Super Admin Panel"}</div>
        </div>
        {[["dashboard","📊","Dashboard"],["chef-apps","📋","Chef Applications",pendingApps.length],["maint-admins","🔧","Maintenance Admins"],!isSupportAdminUser&&["support-admins","🛡️","Support Admins"],["chefs","👨‍🍳","Chef Management"],["users","👥","All Users"],["bookings","📅","All Bookings"],["payments","💳","Payments"],["fee-sugs","💡","Fee Suggestions",feeSugs.length],["proposals","📝","All Proposals"],["activity","🕐","Login History"],["settings","⚙️","Settings"]].filter(Boolean).map(([id,ic,l,cnt])=>(
          <div key={id} className={`sidebar-link ${tab===id?"active":""}`} onClick={()=>{setTab(id);refresh();}} style={{position:"relative"}}>
            <span>{ic}</span><span style={{fontSize:13}}>{l}</span>
            {cnt>0&&<span style={{marginLeft:"auto",background:C.danger,color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{cnt}</span>}
          </div>
        ))}
      </div>

      <div className="panel-content" style={{flex:1,background:C.surface,overflowY:"auto"}} key={`super-${loginKey}`}>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="chef-apps"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h2 style={{fontFamily:F.heading,fontSize:20}}>Chef Applications</h2>
              <button onClick={()=>sbLoadApps().then(apps=>{setAllApps(apps);setPendingApps(apps.filter(a=>a.status==="pending"));})} style={{background:C.infoBg,color:C.info,border:"none",borderRadius:7,padding:"7px 14px",fontWeight:600,fontSize:12,cursor:"pointer"}}>🔄 Refresh</button>
            </div>
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
          <MaintAdminManager setUserRole={setUserRole} removeUserRole={removeUserRole} allUsers={allUsers}/>
        )}

        {tab==="support-admins"&&(
          <SupportAdminManager allUsers={allUsers} refresh={refresh}/>
        )}

        {tab==="chefs"&&(
          <div>
            <h2 style={{fontFamily:F.heading,fontSize:20,marginBottom:6}}>Chef Management</h2>
            <p style={{color:C.muted,marginBottom:12,fontSize:13}}>Set starting prices, suspend chefs, and view order history. Only Super Admin can suspend chefs.</p>
            <input className="input" placeholder="🔍 Search by Chef ID (e.g. CHF-001) or name..." style={{marginBottom:16,fontSize:14}} onChange={e=>{const v=e.target.value.toLowerCase();document.querySelectorAll(".chef-row").forEach(el=>{const match=el.dataset.search?.toLowerCase().includes(v);el.style.display=match||!v?"block":"none";});}}/>
            {getAllChefs().map((c,idx)=>{
              const fee=chefFeeMap[c.id];
              const displayId=c.displayId||getStaticChefDisplayId(idx);
              const chefBookings=allBookings.filter(b=>b.chefAlias===c.alias);
              const chefProposals=allProposals.filter(p=>p.chefAlias===c.alias);
              const totalEarned=chefBookings.reduce((s,b)=>s+(b.amount||0),0);
              const completedOrders=chefBookings.filter(b=>b.status==="completed");
              return(
                <div key={c.id} className="chef-row" data-search={`${displayId} ${c.alias}`.toLowerCase()} style={{background:"white",borderRadius:11,border:`1px solid ${c.isDynamic?C.success:C.border}`,marginBottom:10,overflow:"hidden"}}>
                  {/* Chef row */}
                  <div style={{padding:17,display:"flex",alignItems:"center",gap:13,justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:11}}>
                      <div style={{textAlign:"center",minWidth:52}}>
                        <div style={{background:C.dark,color:"white",borderRadius:7,padding:"3px 7px",fontSize:10,fontWeight:800,letterSpacing:.5,fontFamily:"monospace"}}>{displayId}</div>
                      </div>
                      <Avatar initials={c.image||c.alias?.slice(0,2)} size={38} color={c.type==="premium"?"#B45309":C.primary}/>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{c.alias}</div>
                        <div style={{fontSize:11,color:C.muted}}>{c.type==="premium"?"Premium":"Standard"} · {c.location}
                          {c.isDynamic&&<span style={{marginLeft:7,background:C.successBg,color:C.success,padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>NEW ✓ Approved</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      {/* Clickable quick stats */}
                      <button onClick={()=>setExpandedChef(expandedChef===c.id?null:c.id)} style={{textAlign:"center",background:C.primaryLight,border:`1px solid ${C.primary}33`,borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>
                        <div style={{fontSize:10,color:C.muted}}>📋 Bookings</div><div style={{fontWeight:700,color:C.primary,fontSize:14}}>{chefBookings.length}</div>
                      </button>
                      <button onClick={()=>setExpandedChef(expandedChef===c.id?null:c.id)} style={{textAlign:"center",background:C.successBg,border:`1px solid ${C.success}33`,borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>
                        <div style={{fontSize:10,color:C.muted}}>✅ Done</div><div style={{fontWeight:700,color:C.success,fontSize:14}}>{completedOrders.length}</div>
                      </button>
                      <button onClick={()=>setExpandedChef(expandedChef===c.id?null:c.id)} style={{textAlign:"center",background:C.infoBg,border:`1px solid ${C.info}33`,borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>
                        <div style={{fontSize:10,color:C.muted}}>📝 Proposals</div><div style={{fontWeight:700,color:C.info,fontSize:14}}>{chefProposals.length}</div>
                      </button>
                      <button onClick={()=>{setEditFee(c);setFeeForm({startingFrom:fee?.startingFrom||c.startingFrom||0,extraPerGuest:fee?.extraPerGuest||2000});}} style={{background:C.infoBg,color:C.info,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer"}}>✏️ Price</button>
                      <button onClick={()=>setSuspendTarget({id:c.id,alias:c.alias,displayId})} style={{background:"#FFF7ED",color:"#C2410C",padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600,border:"1px solid #FDBA74",cursor:"pointer"}}>🚫</button>
                    </div>
                  </div>
                  {/* Expanded detail view */}
                  {expandedChef===c.id&&(
                    <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 17px",background:C.surface}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                        <div style={{background:"white",borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted}}>Total Bookings</div><div style={{fontWeight:700,fontSize:16,color:C.primary}}>{chefBookings.length}</div></div>
                        <div style={{background:"white",borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted}}>Completed</div><div style={{fontWeight:700,fontSize:16,color:C.success}}>{completedOrders.length}</div></div>
                        <div style={{background:"white",borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted}}>Proposals</div><div style={{fontWeight:700,fontSize:16,color:C.info}}>{chefProposals.length}</div></div>
                        <div style={{background:"white",borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}><div style={{fontSize:10,color:C.muted}}>Total Earned</div><div style={{fontWeight:700,fontSize:16,color:C.success}}>{fmtLKR(totalEarned)}</div></div>
                      </div>
                      {chefBookings.length===0
                        ? <div style={{textAlign:"center",padding:"18px 0",color:C.muted,fontSize:13}}>No orders yet for this chef.</div>
                        : <div>
                            <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>Order History</div>
                            <div style={{maxHeight:280,overflowY:"auto"}}>
                              {chefBookings.slice().reverse().map(b=>(
                                <div key={b.id} style={{background:"white",borderRadius:8,padding:"10px 13px",marginBottom:7,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div>
                                    <div style={{fontWeight:600,fontSize:13}}>{b.customerName||b.customerEmail}</div>
                                    <div style={{fontSize:11,color:C.muted}}>#{b.id} · {b.date||"—"} · {b.guests||"?"} guests</div>
                                    {b.occasion&&<div style={{fontSize:11,color:C.muted}}>🎉 {b.occasion}</div>}
                                  </div>
                                  <div style={{textAlign:"right"}}>
                                    <div style={{fontWeight:700,color:C.primary,fontSize:13}}>{b.amount?fmtLKR(b.amount):"TBD"}</div>
                                    <BookingStatusBadge status={b.status}/>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      }
                    </div>
                  )}
                </div>
              );
            })}

            {/* Suspended Chefs */}
            {suspendedChefs.length>0&&(
              <div style={{marginTop:22}}>
                <h3 style={{fontFamily:F.heading,fontSize:16,marginBottom:13,color:C.danger}}>🚫 Suspended Chefs ({suspendedChefs.length})</h3>
                {suspendedChefs.map(s=>(
                  <div key={s.id} style={{background:"white",borderRadius:10,border:`1px solid ${C.danger}44`,padding:14,marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{background:C.dark,color:"white",borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:800,fontFamily:"monospace"}}>{String(s.id).startsWith("dyn_")?"CHF-?":s.id}</span>
                        <span style={{fontWeight:700,fontSize:14}}>{s.alias}</span>
                        <span style={{background:C.dangerBg,color:C.danger,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>SUSPENDED</span>
                      </div>
                      <div style={{fontSize:11,color:C.muted}}>Suspended {new Date(s.suspendedAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric"})}</div>
                      <div style={{fontSize:11,color:C.warn,marginTop:2}}>📝 Reason: {s.reason}</div>
                    </div>
                    <button onClick={()=>reactivateChef(s.id,s.alias)} style={{background:C.successBg,color:C.success,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:700,border:`1px solid ${C.success}44`,cursor:"pointer"}}>✅ Re-activate</button>
                  </div>
                ))}
              </div>
            )}

            {/* Chef History Log */}
            {chefHistoryLog.length>0&&(
              <div style={{marginTop:22,background:"white",borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
                <h3 style={{fontFamily:F.heading,fontSize:15,marginBottom:13}}>📋 Chef Action History</h3>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  {chefHistoryLog.map((ev,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:ev.action==="suspended"?C.dangerBg:C.successBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                          {ev.action==="suspended"?"🚫":"✅"}
                        </div>
                        <div>
                          <div><strong>{ev.chefAlias}</strong> — <span style={{color:ev.action==="suspended"?C.danger:C.success,fontWeight:700,textTransform:"capitalize"}}>{ev.action}</span></div>
                          <div style={{color:C.muted,fontSize:11}}>📝 {ev.reason}</div>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:C.muted,textAlign:"right",flexShrink:0}}>{new Date(ev.at).toLocaleString("en-LK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                </div>
              ))}
            </div>
          </div>
        )}

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
      </div>
      </div>
    </div>
  );
}
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
      </div>
    </div>
  );
}

// ─── Static Pages ─────────────────────────────────────────────────────────────
function PricingPage(){return(<div style={{maxWidth:1100,margin:"0 auto",padding:"44px 16px"}}><style>{`.pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:20;margin-bottom:36px}.pricing-how{display:grid;grid-template-columns:repeat(3,1fr);gap:14}@media(max-width:640px){.pricing-grid{grid-template-columns:1fr!important}.pricing-how{grid-template-columns:1fr!important}}`}</style><div style={{textAlign:"center",marginBottom:32}}><h1 style={{fontFamily:F.heading,fontSize:28,fontWeight:700,marginBottom:10}}>Transparent Pricing</h1><p style={{color:C.muted,fontSize:14,maxWidth:480,margin:"0 auto"}}>Starting prices shown. Exact price confirmed by chef's personalised proposal after booking.</p></div><div className="pricing-grid">{[{type:"Standard Chef",desc:"Budget-friendly home dining",color:C.success,tiers:[["2–4 guests","Starting from LKR 6,000"],["5–8 guests","Starting from LKR 12,000"],["9+ guests","Starting from LKR 18,000"]]},{type:"Premium Chef",desc:"Luxury private dining",color:"#B45309",tiers:[["2–4 guests","Starting from LKR 25,000"],["5–8 guests","Starting from LKR 40,000"],["9+ guests","Starting from LKR 70,000"]]}].map(p=><div key={p.type} style={{background:"white",borderRadius:18,border:`2px solid ${p.color}22`,padding:26}}><h3 style={{fontFamily:F.heading,fontSize:22,marginBottom:6}}>{p.type}</h3><p style={{color:C.muted,fontSize:13,marginBottom:14}}>{p.desc}</p>{p.tiers.map(([t,pr])=><div key={t} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.muted}}>{t}</span><span style={{fontSize:13,fontWeight:700,color:p.color}}>{pr}</span></div>)}</div>)}</div><div style={{background:`linear-gradient(135deg,${C.dark},#2D1810)`,borderRadius:18,padding:"30px 20px",textAlign:"center",color:"white",marginTop:20}}><h2 style={{fontFamily:F.heading,fontSize:22,marginBottom:8}}>How Pricing Works</h2><p style={{color:"rgba(255,255,255,.6)",marginBottom:20,fontSize:14}}>Request → Chef proposes custom menu + price → Maintenance admin approves → You pay</p><div className="pricing-how">{[["🍽️","Custom Menu","Chef tailors menu for your event"],["💡","Transparent Price","Exact price before you pay"],["🔒","Secure Payment","PayHere after admin approval"]].map(([ic,t,d])=><div key={t} style={{background:"rgba(255,255,255,.08)",borderRadius:11,padding:18}}><div style={{fontSize:28,marginBottom:7}}>{ic}</div><div style={{fontWeight:600,marginBottom:5}}>{t}</div><div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>{d}</div></div>)}</div></div></div>);}
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
    if (user.role==="super_admin"||user.role==="support_admin") setPage("admin");
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
      {page==="admin"&&<SuperAdminPanel key={`admin-${loginKey}`} loginKey={loginKey} user={user}/>}
      {showAuth&&<AuthModal mode={showAuth} setMode={setShowAuth} onClose={()=>setShowAuth(null)}/>}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>;
}
