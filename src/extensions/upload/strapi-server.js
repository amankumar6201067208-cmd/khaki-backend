"use strict";

module.exports = (plugin) => {
  const original = plugin.services["image-manipulation"];

  const overrides = {
    generateThumbnail: async () => null,
    generateResponsiveFormats: async () => [],
  };

  if (typeof original === "function") {
    // Service defined as a factory ({ strapi }) => ({ ... }).
    plugin.services["image-manipulation"] = (ctx) => ({
      ...original(ctx),
      ...overrides,
    });
  } else {
    // Service defined as a plain object (current Strapi build).
    plugin.services["image-manipulation"] = { ...original, ...overrides };
  }

  return plugin;
};
