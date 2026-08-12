"use strict";

// Trim a "HH:MM:SS" (or "HH:MM") time string down to "HH:MM".
const normalizeTime = (t) => (t ? t.substring(0, 5) : "");

module.exports = { normalizeTime };
