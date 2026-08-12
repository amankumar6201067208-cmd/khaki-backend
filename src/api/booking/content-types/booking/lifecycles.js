"use strict";

const {
  makeConfirmOnPaidHook,
  BOOKING,
} = require("../../../../utils/confirmBooking");

module.exports = makeConfirmOnPaidHook(BOOKING, "booking");
