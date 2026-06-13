/**
 * dashboards/vendor/moduleRegistry.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-file registry that maps every vendor category to its ordered list of
 * dashboard modules.  Adding a new category = add one entry here + create
 * the relevant module components.  Zero dashboard rewrites required.
 *
 * Each module entry:
 *   id       – unique string key, used for routing / active state
 *   label    – sidebar display name
 *   icon     – emoji for sidebar
 *   component– lazy-importable component identifier (resolved by DashboardShell)
 */

// ─── Shared core modules every vendor gets ────────────────────────────────────
const CORE_MODULES = [
  { id: "dashboard",      label: "Dashboard",       icon: "📊" },
  { id: "bookings",       label: "Bookings",         icon: "📅" },
  { id: "calendar",       label: "Calendar",         icon: "🗓️" },
  { id: "availability",   label: "Availability",     icon: "🟢" },
  { id: "customers",      label: "Customers",        icon: "👥" },
  { id: "messages",       label: "Messages",         icon: "💬" },
  { id: "reviews",        label: "Reviews",          icon: "⭐" },
  { id: "payments",       label: "Payments",         icon: "💳" },
  { id: "analytics",      label: "Analytics",        icon: "📈" },
  { id: "marketing",      label: "Marketing",        icon: "📣" },
  { id: "profile",        label: "My Profile",       icon: "🪪" },
  { id: "settings",       label: "Settings",         icon: "⚙️" },
];

// ─── Category-specific extra modules ──────────────────────────────────────────
const SPORTS_EXTRA = [
  { id: "grounds",        label: "Ground Management", icon: "🏟️" },
  { id: "courts",         label: "Court Management",  icon: "🎾" },
  { id: "slots",          label: "Slot Management",   icon: "⏱️" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
];

const WEDDING_EXTRA = [
  { id: "packages",       label: "Wedding Packages",  icon: "💍" },
  { id: "tours",          label: "Venue Tours",        icon: "🏛️" },
  { id: "quotes",         label: "Quote Requests",     icon: "📋" },
  { id: "consultations",  label: "Consultations",      icon: "🤝" },
  { id: "pricing_rules",  label: "Pricing Rules",      icon: "💰" },
];

const PARTY_EXTRA = [
  { id: "hall",           label: "Hall Management",   icon: "🏢" },
  { id: "packages",       label: "Package Builder",   icon: "📦" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
  { id: "amenities",      label: "Amenities",         icon: "✨" },
];

const CATERING_EXTRA = [
  { id: "menu_builder",   label: "Menu Builder",      icon: "🍽️" },
  { id: "packages",       label: "Package Builder",   icon: "📦" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
  { id: "dietary",        label: "Dietary Options",   icon: "🥗" },
  { id: "staff",          label: "Staff Management",  icon: "👨‍🍳" },
];

const CHEF_EXTRA = [
  { id: "cuisine",        label: "Cuisine Manager",   icon: "🍜" },
  { id: "packages",       label: "Packages",          icon: "📦" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
  { id: "dietary",        label: "Dietary Expertise", icon: "🥗" },
];

const DJ_EXTRA = [
  { id: "equipment",      label: "Equipment",         icon: "🎛️" },
  { id: "packages",       label: "Packages",          icon: "📦" },
  { id: "genres",         label: "Music Genres",      icon: "🎵" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
];

const PHOTO_EXTRA = [
  { id: "portfolio",      label: "Portfolio",         icon: "🖼️" },
  { id: "packages",       label: "Packages",          icon: "📦" },
  { id: "pricing_rules",  label: "Pricing Rules",     icon: "💰" },
  { id: "albums",         label: "Albums & Videos",   icon: "🎬" },
];

const PLANNER_EXTRA = [
  { id: "projects",       label: "Projects",          icon: "🗂️" },
  { id: "tasks",          label: "Task Board",         icon: "✅" },
  { id: "vendors_mgmt",   label: "Vendor Coordination",icon: "🤝" },
  { id: "timeline",       label: "Timeline Builder",  icon: "⏳" },
  { id: "budget",         label: "Budget Planner",    icon: "💰" },
];

// ─── Registry export ──────────────────────────────────────────────────────────
function buildModules(extras) {
  // Insert category-specific modules after "calendar" in the core list
  const calIdx = CORE_MODULES.findIndex(m => m.id === "calendar");
  return [
    ...CORE_MODULES.slice(0, calIdx + 1),
    ...extras,
    ...CORE_MODULES.slice(calIdx + 1),
  ];
}

export const VendorModuleRegistry = {
  sports:         buildModules(SPORTS_EXTRA),
  wedding:        buildModules(WEDDING_EXTRA),
  party:          buildModules(PARTY_EXTRA),
  catering:       buildModules(CATERING_EXTRA),
  chefs:          buildModules(CHEF_EXTRA),
  djs:            buildModules(DJ_EXTRA),
  photographers:  buildModules(PHOTO_EXTRA),
  vendors:        buildModules(PLANNER_EXTRA),
  // Add new categories here — no other file needs to change
};

/** Returns the module list for a category, falling back to core modules */
export function getModulesForCategory(category) {
  return VendorModuleRegistry[category] || CORE_MODULES;
}

/** Returns metadata for a single module by id within a category */
export function getModuleMeta(category, moduleId) {
  return getModulesForCategory(category).find(m => m.id === moduleId) || null;
}
