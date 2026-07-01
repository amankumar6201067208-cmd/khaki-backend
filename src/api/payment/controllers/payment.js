"use strict";
const userEmail = require("../../../utils/eventUserEmail");
const crypto = require("crypto");
const { runWithLock } = require("../../../utils/asyncLock");

// Address that receives a BCC copy of every booking confirmation.
// Configurable via BOOKING_ADMIN_EMAIL; falls back to the original value so
// existing deployments keep working until the env var is set.
const BOOKING_ADMIN_EMAIL =
  process.env.BOOKING_ADMIN_EMAIL || "amankumar6201067208@gmail.com";

module.exports = {
  // ===========================
  // CREATE PAYMENT
  // ===========================
  async create(ctx) {
    try {
      const { amount, firstname, email, phone, productinfo, bookingId } =
        ctx.request.body;

      const key = process.env.PAYU_KEY;
      const salt = process.env.PAYU_SALT;
      const payuBaseUrl = process.env.PAYU_BASE_URL;
      const backendUrl = process.env.BACKEND_URL;

      const txnid = "txn_" + Date.now();

      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${bookingId}||||||||||${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      ctx.send({
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        udf1: bookingId,
        hash,
        payuBaseUrl,
        surl: `${backendUrl}/api/payment/success`,
        furl: `${backendUrl}/api/payment/failure`,
      });
    } catch (err) {
      ctx.throw(500, "Payment creation failed");
    }
  },

  // ===========================
  // PAYMENT SUCCESS
  // ===========================
  async success(ctx) {
    try {
      const response = ctx.request.body;

      const {
        status,
        firstname,
        amount,
        txnid,
        hash,
        key,
        productinfo,
        email,
        udf1,
      } = response;

      const bookingId = udf1;
      const salt = process.env.PAYU_SALT;
      const frontendUrl = process.env.FRONTEND_URL;

      // 🔐 HASH VERIFY
      const reverseString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const calculatedHash = crypto
        .createHash("sha512")
        .update(reverseString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return ctx.redirect(`${frontendUrl}/failed?error=hash_mismatch`);
      }

      // ===================================================
      // 1️⃣ TRY GROUP BOOKING
      // ===================================================
      let booking = await strapi.db.query("api::booking.booking").findOne({
        where: { bookingId },
      });

      if (booking) {
        // 🛡️ IDEMPOTENCY GUARD — PayU can fire the success webhook more than once.
        // If this booking is already paid, do NOT reduce seats / resend email again.
        if (booking.Bookingstatus === "paid") {
          return ctx.redirect(
            `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${booking.tourSlug}`,
          );
        }

        // ✅ Update booking status to paid
        await strapi.db.query("api::booking.booking").update({
          where: { bookingId },
          data: { Bookingstatus: "paid" },
        });

        // 📧 SEND EMAIL (non-blocking — email failure must not break the payment flow)
        try {
          await strapi.plugins["email"].services.email.send({
            to: booking.contactEmail,
            bcc: [BOOKING_ADMIN_EMAIL],
            subject: `Booking Confirmed for ${booking.tourTitle} ✅`,
            html: userEmail({
              ...booking,
              tourTitle: booking.tourTitle,
              startingPoint: booking.startingPoint,
              txnid: txnid,
            }),
          });
        } catch (emailErr) {
          // @ts-ignore
          console.error("⚠️ Booking confirmation email failed:", emailErr.message);
        }

        // ✅ SEAT REDUCTION — use entityService to keep Strapi cache in sync
        const { tourSlug, date, slot: slotTime, tickets } = booking;

        const normalizeTime = (t) => (t ? t.substring(0, 5) : "");
        const normalizedSlotTime = normalizeTime(slotTime);

        // 🔒 Serialize seat reduction per trip so two concurrent confirmations
        // for the same slot cannot both read the old count and oversell.
        await runWithLock(`trip:${tourSlug}`, async () => {
        // Fetch the trip with full schedule populated using Documents Service
        const trips = await strapi.documents("api::trip.trip").findMany({
          filters: { Slug: tourSlug },
          populate: {
            GroupTourBookingDetails: {
              on: {
                "trip.schedule": {
                  populate: { Slots: true },
                },
              },
            },
          },
          status: "published",
        });

        const trip = trips?.[0];

        if (trip) {
          const bookingDate = new Date(date).toDateString();

          const scheduleComponent = trip.GroupTourBookingDetails?.find(
            (c) => new Date(c.Date).toDateString() === bookingDate,
          );

          if (scheduleComponent) {
            const matchingSlot = scheduleComponent.Slots?.find(
              (s) => normalizeTime(s.Time) === normalizedSlotTime,
            );

            if (matchingSlot) {
              const currentSeats = Number(matchingSlot.availableSeats);
              const newSeats = Math.max(0, currentSeats - Number(tickets));

              console.log(
                `✅ Reducing seats: ${currentSeats} → ${newSeats} for slot ${slotTime}`,
              );

              // ✅ Use documents.update with status: published so cache/draft matches
              const updatedBookingDetails = trip.GroupTourBookingDetails.map(
                (component) => {
                  if (new Date(component.Date).toDateString() !== bookingDate) {
                    return {
                      __component: "trip.schedule",
                      Date: component.Date,
                      Slots: component.Slots.map((s) => ({
                        Time: s.Time,
                        availableSeats: String(s.availableSeats),
                      })),
                    };
                  }

                  return {
                    __component: "trip.schedule",
                    Date: component.Date,
                    Slots: component.Slots.map((s) => {
                      if (normalizeTime(s.Time) !== normalizedSlotTime) {
                        return {
                          Time: s.Time,
                          availableSeats: String(s.availableSeats),
                        };
                      }
                      return {
                        Time: s.Time,
                        availableSeats: String(newSeats),
                      };
                    }),
                  };
                },
              );

              await strapi.documents("api::trip.trip").update({
                documentId: trip.documentId,
                data: {
                  // @ts-ignore
                  GroupTourBookingDetails: updatedBookingDetails,
                },
              });

              await strapi.documents("api::trip.trip").publish({
                documentId: trip.documentId,
              });

              console.log(
                `✅ Seat reduction saved & published via documents.update for trip: ${tourSlug}`,
              );
            } else {
              console.warn(
                "⚠️ No matching slot found for time:",
                normalizedSlotTime,
              );
            }
          } else {
            console.warn("⚠️ No matching schedule found for date:", date);
          }
        } else {
          console.warn("⚠️ No trip found for slug:", tourSlug);
        }
        });

        // ✅ Include tourSlug in redirect so frontend can refresh
        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${tourSlug}`,
        );
      }

      // ===================================================
      // Helper function to reduce seats natively via Strapi v5 Documents
      // ===================================================
      const reducePublicSeats = async (
        tourSlug,
        dateString,
        slotTime,
        ticketsToReduce,
      ) => {
        if (!tourSlug) return;
        const normalizeTime = (t) => (t ? t.substring(0, 5) : "");
        const normalizedSlotTime = normalizeTime(slotTime);
        const activities = await strapi
          .documents("api::public-walk-and-event.public-walk-and-event")
          .findMany({
            filters: { Slug: tourSlug },
            populate: {
              BookingSlots: { populate: { Slots: true } },
            },
            status: "published",
          });
        const activity = activities?.[0];
        if (activity && activity.BookingSlots) {
          const bookingDate = new Date(dateString).toDateString();
          const updatedBookingSlots = activity.BookingSlots.map((component) => {
            if (new Date(component.TourDate).toDateString() !== bookingDate) {
              return {
                __component: "walk-event-trip.booking-slots",
                TourDate: component.TourDate,
                Slots: component.Slots
                  ? {
                      TourTime: component.Slots.TourTime,
                      availableTickets: String(
                        component.Slots.availableTickets,
                      ),
                    }
                  : null,
              };
            }
            if (
              component.Slots &&
              normalizeTime(component.Slots.TourTime) === normalizedSlotTime
            ) {
              const currentSeats = Number(component.Slots.availableTickets);
              const newSeats = Math.max(0, currentSeats - ticketsToReduce);
              console.log(
                `✅ Reducing public seats: ${currentSeats} → ${newSeats} for slot ${slotTime}`,
              );
              return {
                __component: "walk-event-trip.booking-slots",
                TourDate: component.TourDate,
                Slots: {
                  TourTime: component.Slots.TourTime,
                  availableTickets: String(newSeats),
                },
              };
            }
            return {
              __component: "walk-event-trip.booking-slots",
              TourDate: component.TourDate,
              Slots: component.Slots
                ? {
                    TourTime: component.Slots.TourTime,
                    availableTickets: String(component.Slots.availableTickets),
                  }
                : null,
            };
          });

          await strapi
            .documents("api::public-walk-and-event.public-walk-and-event")
            .update({
              documentId: activity.documentId,
              data: {
                // @ts-ignore
                BookingSlots: updatedBookingSlots,
              },
            });

          await strapi
            .documents("api::public-walk-and-event.public-walk-and-event")
            .publish({
              documentId: activity.documentId,
            });

          console.log(
            `✅ Seat reduction saved & published via documents for public walk/event: ${tourSlug}`,
          );
        }
      };

      // ===================================================
      // 2️⃣ TRY PUBLIC EVENT BOOKING
      // ===================================================
      const eventBooking = await strapi.db
        .query("api::public-event-booking.public-event-booking")
        .findOne({ where: { bookingId } });

      if (eventBooking) {
        // 🛡️ IDEMPOTENCY GUARD — skip if already processed (duplicate webhook).
        if (eventBooking.Bookingstatus === "paid") {
          return ctx.redirect(
            `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${eventBooking.tourSlug}`,
          );
        }

        await strapi.db
          .query("api::public-event-booking.public-event-booking")
          .update({
            where: { bookingId },
            data: { Bookingstatus: "paid" },
          });

        const fullEventBooking = await strapi.db
          .query("api::public-event-booking.public-event-booking")
          .findOne({ where: { bookingId } });

        try {
          await strapi.plugins["email"].services.email.send({
            to: fullEventBooking.contactEmail,
            bcc: [BOOKING_ADMIN_EMAIL],
            subject: "Booking Confirmed",
            html: userEmail({
              ...eventBooking,
              tourTitle: eventBooking.tourTitle,
              startingPoint: eventBooking.startingPoint,
              txnid: txnid,
            }),
          });
        } catch (emailErr) {
          // @ts-ignore
          console.error("⚠️ Event booking email failed:", emailErr.message);
        }

        const ticketsToReduce = Number(
          eventBooking.totalParticipants || eventBooking.tickets || 1,
        );
        // 🔒 Serialize per activity so event + walk bookings can't oversell.
        await runWithLock(`pubwalk:${eventBooking.tourSlug}`, () =>
          reducePublicSeats(
            eventBooking.tourSlug,
            eventBooking.date,
            eventBooking.slot,
            ticketsToReduce,
          ),
        );

        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${eventBooking.tourSlug}`,
        );
      }

      // ===================================================
      // 3️⃣ TRY PUBLIC WALK BOOKING
      // ===================================================
      const walkBooking = await strapi.db
        .query("api::public-walk-booking.public-walk-booking")
        .findOne({ where: { bookingId } });

      if (walkBooking) {
        // 🛡️ IDEMPOTENCY GUARD — skip if already processed (duplicate webhook).
        if (walkBooking.Bookingstatus === "paid") {
          return ctx.redirect(
            `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${walkBooking.tourSlug}`,
          );
        }

        // ✅ STATUS UPDATE
        await strapi.db
          .query("api::public-walk-booking.public-walk-booking")
          .update({
            where: { bookingId },
            data: { Bookingstatus: "paid" },
          });

        // 📧 EMAIL (non-blocking)
        try {
          await strapi.plugins["email"].services.email.send({
            to: walkBooking.contactEmail,
            bcc: [BOOKING_ADMIN_EMAIL],
            subject: `Booking Confirmed for ${walkBooking.tourTitle}`,
            html: userEmail({
              ...walkBooking,
              txnid: txnid,
            }),
          });
        } catch (emailErr) {
          // @ts-ignore
          console.error("⚠️ Walk booking email failed:", emailErr.message);
        }

        const normalizeTime = (t) => (t ? t.substring(0, 5) : "");

        // 🔒 Serialize per activity so concurrent confirmations can't oversell
        // seats or exceed the discount quota (read-modify-write below).
        await runWithLock(`pubwalk:${walkBooking.tourSlug}`, async () => {
        const activities = await strapi
          .documents("api::public-walk-and-event.public-walk-and-event")
          .findMany({
            filters: { Slug: walkBooking.tourSlug },
            populate: {
              BookingSlots: { populate: { Slots: true } },
            },
            status: "published",
          });

        const activity = activities?.[0];

        if (activity) {
          const bookingDate = new Date(walkBooking.date).toDateString();
          const normalizedSlotTime = normalizeTime(walkBooking.slot);

          const updatedBookingSlots = activity.BookingSlots.map((component) => {
            // Non-matching date
            if (new Date(component.TourDate).toDateString() !== bookingDate) {
              return {
                __component: "walk-event-trip.booking-slots",
                TourDate: component.TourDate,
                Slots: component.Slots ? {
                  TourTime: component.Slots.TourTime,
                  availableTickets: String(component.Slots.availableTickets),
                  discountUsedCount: Number(component.Slots.discountUsedCount || 0),
                } : null,
              };
            }

            // Matching date + matching slot
            if (
              component.Slots &&
              normalizeTime(component.Slots.TourTime) === normalizedSlotTime
            ) {
              const currentSeats = Number(component.Slots.availableTickets);
              const newSeats = Math.max(0, currentSeats - Number(walkBooking.tickets));

              // 🔥 DISCOUNT LOGIC — fresh from DB, not from frontend
              // Parse passengers — DB mein JSON string ya array dono handle karo
              let passengers = walkBooking.passengers || [];
              if (typeof passengers === "string") {
                try { passengers = JSON.parse(passengers); } catch { passengers = []; }
              }
              if (!Array.isArray(passengers)) passengers = [];

              const discountEligibleCount = passengers.filter(
                (p) => p?.category === "student" || p?.category === "senior",
              ).length;

              // Fresh discountUsedCount from DB — race condition safe
              const currentDiscountUsed = Number(component.Slots.discountUsedCount || 0);
              const maxDiscount = 3;
              const remainingDiscount = Math.max(0, maxDiscount - currentDiscountUsed);

              // Only apply as many discounts as remaining quota allows
              const appliedDiscount = Math.min(discountEligibleCount, remainingDiscount);

              console.log(`🎯 Eligible: ${discountEligibleCount}, Remaining: ${remainingDiscount}, Applied: ${appliedDiscount}, NewTotal: ${currentDiscountUsed + appliedDiscount}`);

              return {
                __component: "walk-event-trip.booking-slots",
                TourDate: component.TourDate,
                Slots: {
                  TourTime: component.Slots.TourTime,
                  availableTickets: String(newSeats),
                  discountUsedCount: currentDiscountUsed + appliedDiscount,
                },
              };
            }

            // Matching date, different slot
            return {
              __component: "walk-event-trip.booking-slots",
              TourDate: component.TourDate,
              Slots: component.Slots ? {
                TourTime: component.Slots.TourTime,
                availableTickets: String(component.Slots.availableTickets),
                discountUsedCount: Number(component.Slots.discountUsedCount || 0),
              } : null,
            };
          });

          await strapi
            .documents("api::public-walk-and-event.public-walk-and-event")
            .update({
              documentId: activity.documentId,
              data: {
                // @ts-ignore
                BookingSlots: updatedBookingSlots,
              },
            });

          await strapi
            .documents("api::public-walk-and-event.public-walk-and-event")
            .publish({
              documentId: activity.documentId,
            });

          console.log("✅ Seats + Discount Updated");
        }
        });

        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${walkBooking.tourSlug}`,
        );
      }

      // Fallback
      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid`,
      );
    } catch (error) {
      console.error("=== PAYMENT SUCCESS ERROR ===", error);
      ctx.throw(500, "Verification failed");
    }
  },

  // ===========================
  // PAYMENT FAILURE
  // ===========================
  async failure(ctx) {
    try {
      const response = ctx.request.body;
      const bookingId = response.udf1;
      const frontendUrl = process.env.FRONTEND_URL;

      // Try updating all booking types — safe to run all, only one will match
      try {
        await strapi.db.query("api::booking.booking").update({
          where: { bookingId },
          data: { Bookingstatus: "failed" },
        });
      } catch (_) {}

      try {
        await strapi.db
          .query("api::public-event-booking.public-event-booking")
          .update({
            where: { bookingId },
            data: { Bookingstatus: "failed" },
          });
      } catch (_) {}

      try {
        await strapi.db
          .query("api::public-walk-booking.public-walk-booking")
          .update({
            where: { bookingId },
            data: { Bookingstatus: "failed" },
          });
      } catch (_) {}

      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=failed`,
      );
    } catch (error) {
      console.error("=== PAYMENT FAILURE ERROR ===", error);
      ctx.throw(500, "Failure handling failed");
    }
  },
};