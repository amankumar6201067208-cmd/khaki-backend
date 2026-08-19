# Post-booking success URL scheme (Meta conversion tracking)

Changed 2026-08-18 so success pages have a per-tour, path-based URL that Meta (Facebook)
can track as a conversion. Failures stay on the bare path (not tracked).

## URL patterns
| Flow | URL | Set by |
|------|-----|--------|
| Paid booking (group / walk / event) | `/thank-you/<tourSlug>?bookingId=..&status=paid` | backend `payment.js` `thankYou()`, `event-payment.js` |
| Free event | `/thank-you/<tourSlug>?bookingId=..&status=confirmed&free=true` | frontend `PublicEventBookingForm.jsx` |
| Donation | `/thank-you/donation?donationId=..&status=paid` | backend `donation-payment.js` |
| Private tour request | `/thank-you/<tourSlug>?status=received` (shows "Request Received", no booking id) | frontend `PrivateTourRequestForm.jsx` |
| Payment failure | `/thank-you?...&status=failed` (bare, no slug) | backend failure handlers |
| Contact + 4 enquiry forms (volunteer/friend/expertise/bunder) | `/message-received` (bare, no slug) | `Contact.jsx`, `useEnquirySubmit.js` |

Rule now: **every TOUR booking (incl. private) → the thank-you page; every plain FORM (contact +
enquiry) → the message-received page.** `SuccessPage.jsx` treats `status=received` as a private
request (positive layout, "Request Received!" title, no id line — id line only renders when a
booking/donation id is present).

Frontend routes are `/thank-you/:tourSlug?` and `/message-received/:tourSlug?` (optional param, so
the bare paths still render). `SuccessPage.jsx` reads `tourSlug` from the path (was a query param);
bookingId/donationId/status come from the query. **txnid is no longer in any success URL** (nor
shown on the thank-you page) — only the booking/donation id is kept. txnid is still used internally
for the confirmation email (confirmBookingOnce { txnid }).

## Meta custom conversions to create
- **Purchase** (paid bookings): URL **contains** `/thank-you/` — matches every success (has a slug
  segment) but NOT failures (bare `/thank-you?status=failed`).
- **Lead** (private tour requests): URL **contains** `/message-received/` — matches tour leads (has
  slug) but NOT plain contact/enquiry forms (bare `/message-received`).
- Per-tour conversions: URL contains `/thank-you/fort-walk` etc.

More robust than URL rules: fire a Pixel `Purchase` / `Lead` event with value+currency on these
pages (not implemented yet).
