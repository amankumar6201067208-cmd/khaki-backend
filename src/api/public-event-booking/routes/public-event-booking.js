module.exports = {
  routes: [
    {
      method: "POST",
      path: "/public-booking/create",
      handler: "public-event-booking.create",
      config: {
        auth: false,
      },
    },
  ],
};