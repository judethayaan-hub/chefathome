/**
 * rbac/roles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every role in the Evara platform.
 * No dashboard logic lives here — only identity, labels, and permission sets.
 *
 * Role resolution order (highest wins):
 *   super_admin > admin > support > [vendor roles] > event_planner > customer
 */

// ─── Role IDs ─────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:   "super_admin",
  ADMIN:         "admin",
  SUPPORT:       "support",

  SPORTS_OWNER:  "sports_owner",
  WEDDING_OWNER: "wedding_owner",
  PARTY_OWNER:   "party_owner",
  CATERING_OWNER:"catering_owner",
  CHEF_OWNER:    "chef_owner",
  DJ_OWNER:      "dj_owner",
  PHOTO_OWNER:   "photo_owner",

  EVENT_PLANNER: "event_planner",
  DECO_PROVIDER: "deco_provider",
  SOUND_PROVIDER:"sound_provider",

  CUSTOMER:      "customer",
};

// ─── Role metadata ─────────────────────────────────────────────────────────────
export const ROLE_META = {
  [ROLES.SUPER_ADMIN]:   { label: "Super Admin",             emoji: "👑", group: "platform" },
  [ROLES.ADMIN]:         { label: "Admin",                   emoji: "🛡️", group: "platform" },
  [ROLES.SUPPORT]:       { label: "Support Staff",           emoji: "🎧", group: "platform" },
  [ROLES.SPORTS_OWNER]:  { label: "Sports Ground Owner",     emoji: "🏸", group: "vendor",   category: "sports"   },
  [ROLES.WEDDING_OWNER]: { label: "Wedding Hall Owner",      emoji: "💒", group: "vendor",   category: "wedding"  },
  [ROLES.PARTY_OWNER]:   { label: "Party Hall Owner",        emoji: "🎉", group: "vendor",   category: "party"    },
  [ROLES.CATERING_OWNER]:{ label: "Catering Owner",          emoji: "🍽️", group: "vendor",   category: "catering" },
  [ROLES.CHEF_OWNER]:    { label: "Personal Chef",           emoji: "👨‍🍳", group: "vendor",   category: "chefs"    },
  [ROLES.DJ_OWNER]:      { label: "DJ & Music Owner",        emoji: "🎧", group: "vendor",   category: "djs"      },
  [ROLES.PHOTO_OWNER]:   { label: "Photographer Owner",      emoji: "📷", group: "vendor",   category: "photographers" },
  [ROLES.EVENT_PLANNER]: { label: "Event Planner",           emoji: "📋", group: "vendor",   category: "vendors"  },
  [ROLES.DECO_PROVIDER]: { label: "Decoration Provider",     emoji: "🎊", group: "vendor",   category: "vendors"  },
  [ROLES.SOUND_PROVIDER]:{ label: "Sound & Lighting",        emoji: "🔊", group: "vendor",   category: "vendors"  },
  [ROLES.CUSTOMER]:      { label: "Customer",                emoji: "👤", group: "customer" },
};

// ─── Permission flags ─────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Platform
  MANAGE_USERS:       "manage_users",
  MANAGE_VENDORS:     "manage_vendors",
  MANAGE_ALL_BOOKINGS:"manage_all_bookings",
  MANAGE_PAYMENTS:    "manage_payments",
  MANAGE_COMMISSIONS: "manage_commissions",
  MANAGE_REVIEWS:     "manage_reviews",
  VIEW_ANALYTICS:     "view_analytics",
  MANAGE_SUPPORT:     "manage_support",
  MANAGE_SETTINGS:    "manage_settings",

  // Vendor
  MANAGE_OWN_LISTING:   "manage_own_listing",
  MANAGE_OWN_BOOKINGS:  "manage_own_bookings",
  MANAGE_AVAILABILITY:  "manage_availability",
  MANAGE_PRICING:       "manage_pricing",
  MANAGE_PACKAGES:      "manage_packages",
  VIEW_OWN_ANALYTICS:   "view_own_analytics",
  MANAGE_OWN_PAYMENTS:  "manage_own_payments",
  USE_CRM:              "use_crm",
  USE_MARKETING:        "use_marketing",

  // Customer
  MAKE_BOOKINGS:    "make_bookings",
  VIEW_OWN_BOOKINGS:"view_own_bookings",
  WRITE_REVIEWS:    "write_reviews",
};

// ─── Role → Permissions map ────────────────────────────────────────────────────
const P = PERMISSIONS;
const ALL_PLATFORM   = [P.MANAGE_USERS, P.MANAGE_VENDORS, P.MANAGE_ALL_BOOKINGS, P.MANAGE_PAYMENTS, P.MANAGE_COMMISSIONS, P.MANAGE_REVIEWS, P.VIEW_ANALYTICS, P.MANAGE_SUPPORT, P.MANAGE_SETTINGS];
const VENDOR_CORE    = [P.MANAGE_OWN_LISTING, P.MANAGE_OWN_BOOKINGS, P.MANAGE_AVAILABILITY, P.MANAGE_PRICING, P.MANAGE_PACKAGES, P.VIEW_OWN_ANALYTICS, P.MANAGE_OWN_PAYMENTS, P.USE_CRM, P.USE_MARKETING];

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]:    [...ALL_PLATFORM],
  [ROLES.ADMIN]:          [...ALL_PLATFORM],
  [ROLES.SUPPORT]:        [P.MANAGE_SUPPORT, P.MANAGE_ALL_BOOKINGS, P.VIEW_ANALYTICS],
  [ROLES.SPORTS_OWNER]:   [...VENDOR_CORE],
  [ROLES.WEDDING_OWNER]:  [...VENDOR_CORE],
  [ROLES.PARTY_OWNER]:    [...VENDOR_CORE],
  [ROLES.CATERING_OWNER]: [...VENDOR_CORE],
  [ROLES.CHEF_OWNER]:     [...VENDOR_CORE],
  [ROLES.DJ_OWNER]:       [...VENDOR_CORE],
  [ROLES.PHOTO_OWNER]:    [...VENDOR_CORE],
  [ROLES.EVENT_PLANNER]:  [...VENDOR_CORE],
  [ROLES.DECO_PROVIDER]:  [...VENDOR_CORE],
  [ROLES.SOUND_PROVIDER]: [...VENDOR_CORE],
  [ROLES.CUSTOMER]:       [P.MAKE_BOOKINGS, P.VIEW_OWN_BOOKINGS, P.WRITE_REVIEWS],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the role string for a given Evara user object */
export function resolveRole(user) {
  if (!user) return ROLES.CUSTOMER;
  const meta = user.user_metadata || {};
  if (meta.role && ROLE_PERMISSIONS[meta.role]) return meta.role;
  // Hardcoded admin email fallback (matches App.jsx pattern)
  if (user.email === "judethayaan@gmail.com") return ROLES.SUPER_ADMIN;
  return ROLES.CUSTOMER;
}

/** Returns true if a role has a specific permission */
export function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

/** Returns true if a role belongs to the platform group (admin/support) */
export function isPlatformRole(role) {
  return ROLE_META[role]?.group === "platform";
}

/** Returns true if a role belongs to the vendor group */
export function isVendorRole(role) {
  return ROLE_META[role]?.group === "vendor";
}

/** Returns true if a role belongs to the customer group */
export function isCustomerRole(role) {
  return ROLE_META[role]?.group === "customer";
}

/** Returns the vendor category associated with a role, or null */
export function roleCategory(role) {
  return ROLE_META[role]?.category || null;
}
