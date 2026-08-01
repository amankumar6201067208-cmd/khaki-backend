import { Download, ChartPie, ChartBubble, Calendar } from "@strapi/icons";
import { ReportExportButton } from "./components/ReportExportButton";

const PLUGIN_ID = "reports";

export default {
  register(app) {
    // Sidebar menu link → the Reports page (all-types combined export).
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: Download,
      intlLabel: {
        id: `${PLUGIN_ID}.menu.label`,
        defaultMessage: "Reports",
      },
      Component: async () => {
        const { App } = await import("./pages/App");
        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
    });

    app
      .getPlugin("content-manager")
      .injectComponent("listView", "actions", {
        name: "reportsFilteredExport",
        Component: ReportExportButton,
      });

    // Homepage dashboard chart widgets.
    app.widgets.register([
      {
        id: "top-tours-revenue",
        pluginId: PLUGIN_ID,
        icon: ChartPie,
        title: {
          id: `${PLUGIN_ID}.widget.topRevenue`,
          defaultMessage: "Top 5 Tours by Revenue",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then((m) => m.TopRevenueWidget),
      },
      {
        id: "top-tours-bookings",
        pluginId: PLUGIN_ID,
        icon: ChartBubble,
        title: {
          id: `${PLUGIN_ID}.widget.topBookings`,
          defaultMessage: "Top 5 Tours by Bookings",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then(
            (m) => m.TopBookingsWidget,
          ),
      },
      {
        id: "monthly-bookings",
        pluginId: PLUGIN_ID,
        icon: Calendar,
        title: {
          id: `${PLUGIN_ID}.widget.monthly`,
          defaultMessage: "Bookings — Last 6 Months",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then(
            (m) => m.MonthlyBookingsWidget,
          ),
      },
    ]);
  },

  bootstrap() {},
};
