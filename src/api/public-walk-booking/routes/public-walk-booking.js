module.exports = {
  routes: [
    {
      method: "POST",
      path: "/public-walk-booking/create",
      handler: "public-walk-booking.create",
      config: {
        auth: false,
      },
    },

    // NEW — fresh totalAmount calculate karne ke liye
    {
      method: "POST",
      path: "/public-walk-booking/calculate",
      handler: "public-walk-booking.calculate",
      config: {
        auth: false,
      },
    },
  ],
};