"use strict";

const {
  makeConfirmOnPaidHook,
  EVENT,
} = require("../../../../utils/confirmBooking");

module.exports = makeConfirmOnPaidHook(EVENT, "public-event-booking");
