module.exports = {
  routes: [
    {
      method: "POST",
      path: "/donation/create",
      handler: "donation-booking.create",
      config: { auth: false },
    },
  ],
};