/**
 * dashboards/DashboardRouter.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Single entry point for all authenticated dashboard views.
 *
 * Resolution order:
 *   1. Resolve role from user object via RBAC
 *   2. isPlatformRole  → AdminDashboard
 *   3. isVendorRole    → VendorDashboard (with category from user metadata)
 *   4. isCustomerRole  → CustomerDashboard
 *   5. Fallback        → CustomerDashboard
 *
 * Props
 *   user                – Supabase auth user object
 *   token               – auth token string
 *   sb                  – Supabase client instance
 *   vendor              – vendor record from DB (null if customer/admin)
 *   onSignOut           – () => void
 *   onBackToMarketplace – () => void
 */

import { resolveRole, isPlatformRole, isVendorRole, ROLES } from "../rbac/roles.js";
import AdminDashboard    from "./admin/AdminDashboard.jsx";
import VendorDashboard   from "./vendor/VendorDashboard.jsx";
import CustomerDashboard from "./customer/CustomerDashboard.jsx";

export default function DashboardRouter({
  user,
  token,
  sb,
  vendor,
  onSignOut,
  onBackToMarketplace,
}) {
  const role = resolveRole(user);

  const sharedProps = {
    user,
    token,
    sb,
    onSignOut,
    onBackToMarketplace,
  };

  // ── Platform staff → Admin Dashboard ──────────────────────────────────────
  if (isPlatformRole(role)) {
    return (
      <AdminDashboard
        {...sharedProps}
        role={role}
      />
    );
  }

  // ── Vendor → Vendor Dashboard ─────────────────────────────────────────────
  if (isVendorRole(role)) {
    // vendor prop carries the full listing record with category, name, etc.
    // Fall back to a synthetic vendor object built from user metadata.
    const vendorRecord = vendor || {
      id:       user?.id,
      name:     user?.user_metadata?.venue_name || user?.user_metadata?.full_name || "My Venue",
      category: user?.user_metadata?.category   || "sports",
      location: user?.user_metadata?.location   || "Sri Lanka",
    };

    return (
      <VendorDashboard
        {...sharedProps}
        vendor={vendorRecord}
      />
    );
  }

  // ── Customer (default) ────────────────────────────────────────────────────
  return <CustomerDashboard {...sharedProps} />;
}
