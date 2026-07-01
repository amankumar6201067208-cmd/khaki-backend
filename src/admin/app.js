const config = {
  // Override built-in admin translation strings. The login page heading and
  // subtitle live under these two keys — change the text below to taste.
  translations: {
    en: {
      "Auth.form.welcome.title": "Welcome to Khaki Tours!",
      "Auth.form.welcome.subtitle": "Log in to manage your tours & bookings",
    },
  },
  locales: [],
};

const bootstrap = (app) => {};

export default {
  config,
  bootstrap,
};
