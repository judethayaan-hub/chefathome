/**
 * componentMapper.js
 *
 * Maps Evara category IDs → their dedicated booking widget components.
 * VenueDetails (and any other consumer) imports this object and does:
 *
 *   const Widget = BookingWidgetMap[venue.category] ?? DefaultBookingWidget;
 *   return <Widget vendor={venue} user={user} onBook={handleBook} />;
 *
 * Adding a new category = add one line here + create the component file.
 * Zero if/else or switch statements needed anywhere else.
 */

import SportsGridWidget        from "../components/booking-widgets/SportsGridWidget";
import WeddingInquiryWidget    from "../components/booking-widgets/WeddingInquiryWidget";
import CateringCalculatorWidget from "../components/booking-widgets/CateringCalculatorWidget";
import DJMediaWidget           from "../components/booking-widgets/DJMediaWidget";

/**
 * BookingWidgetMap
 *
 * Keys must match the `category` field values stored in your Supabase
 * `vendors` table (see CAT_LABELS / CAT_EMOJI in App.jsx).
 *
 * Multiple keys can point to the same component (e.g. "party" and "sports"
 * both use SportsGridWidget because they share the slot-grid booking model).
 */
export const BookingWidgetMap = {
  // ── Time-slot grid (fixed-price per block) ────────────────────────────
  sports:  SportsGridWidget,   // Indoor Sports
  party:   SportsGridWidget,   // Party Halls  (hourly slot model)

  // ── Inquiry-first (no instant checkout) ───────────────────────────────
  wedding: WeddingInquiryWidget,

  // ── Per-head calculator ───────────────────────────────────────────────
  catering: CateringCalculatorWidget,
  chefs:    CateringCalculatorWidget,  // Personal chefs share the calculator UX

  // ── Rate toggle + media input ─────────────────────────────────────────
  djs: DJMediaWidget,

  // ── Placeholders — swap with real components as you build them ────────
  // photographers: PhotographyWidget,
  // vendors:       VendorWidget,
};

export default BookingWidgetMap;
