"use strict";

const { errors } = require("@strapi/utils");
const { ValidationError } = errors;

const GROUP_TYPE = "Group Tour";
const PRIVATE_TYPE = "Private Tour";
const GROUP_CATEGORY = "Group Tours";

function validateCombo(tripType, tripCategory) {
  // Missing values are left to the schema's own `required` validation.
  if (!tripType || !tripCategory) return;

  if (tripType === GROUP_TYPE && tripCategory !== GROUP_CATEGORY) {
    throw new ValidationError(
      `A "${GROUP_TYPE}" must use the "${GROUP_CATEGORY}" category.`,
    );
  }

  if (tripType === PRIVATE_TYPE && tripCategory === GROUP_CATEGORY) {
    throw new ValidationError(
      `A "${PRIVATE_TYPE}" cannot use the "${GROUP_CATEGORY}" category — please choose a different category.`,
    );
  }
}

module.exports = {
  async beforeCreate(event) {
    const { tripType, tripCategory } = event.params.data;
    validateCombo(tripType, tripCategory);
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    let { tripType, tripCategory } = data;

    if (tripType === undefined || tripCategory === undefined) {
      const existing = await strapi.db
        .query("api::trip.trip")
        .findOne({ where });
      if (existing) {
        if (tripType === undefined) tripType = existing.tripType;
        if (tripCategory === undefined) tripCategory = existing.tripCategory;
      }
    }

    validateCombo(tripType, tripCategory);
  },
};
