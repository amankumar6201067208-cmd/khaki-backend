"use strict";

const { errors } = require("@strapi/utils");
const { ValidationError } = errors;

const ONLINE = "Online";
// NOTE: the enum value is spelled "Ofline" in the schema (not "Offline").
const OFFLINE = "Ofline";

function validate(eventType, price) {
  if (eventType !== ONLINE && eventType !== OFFLINE) return;

  const p = Number(price || 0);

  if (eventType === OFFLINE && p === 0) {
    throw new ValidationError(
      "An Offline event's Price cannot be 0 — please enter a valid price.",
    );
  }

  if (eventType === ONLINE && p !== 0) {
    throw new ValidationError("An Online event's Price must be 0.");
  }
}

module.exports = {
  async beforeCreate(event) {
    const { EventType, Price } = event.params.data;
    validate(EventType, Price);
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    let { EventType, Price } = data;

    if (EventType === undefined || Price === undefined) {
      const existing = await strapi.db
        .query("api::public-walk-and-event.public-walk-and-event")
        .findOne({ where });
      if (existing) {
        if (EventType === undefined) EventType = existing.EventType;
        if (Price === undefined) Price = existing.Price;
      }
    }

    validate(EventType, Price);
  },
};
