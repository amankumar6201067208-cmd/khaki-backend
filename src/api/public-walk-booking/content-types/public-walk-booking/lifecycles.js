"use strict";

const {
  makeConfirmOnPaidHook,
  WALK,
} = require("../../../../utils/confirmBooking");

module.exports = makeConfirmOnPaidHook(WALK, "public-walk-booking");
