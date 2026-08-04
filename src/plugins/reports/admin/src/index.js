import {
  Download,
  Car,
  User,
  Walk,
  ChartPie,
  ChartBubble,
  ChartCircle,
} from "@strapi/icons";
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
    // Four per-type "Top 5 by bookings" (month-wise) + all-website monthly revenue.
    app.widgets.register([
      {
        id: "group-top-bookings",
        pluginId: PLUGIN_ID,
        icon: Car,
        title: {
          id: `${PLUGIN_ID}.widget.groupTop`,
          defaultMessage: "Group Tours — Top 5 by Bookings",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then((m) => m.GroupTopWidget),
      },
      {
        id: "group-top-revenue",
        pluginId: PLUGIN_ID,
        icon: ChartBubble,
        title: {
          id: `${PLUGIN_ID}.widget.groupRevenue`,
          defaultMessage: "Group Tours — Top 5 by Revenue",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then(
            (m) => m.GroupRevenueWidget,
          ),
      },
      {
        id: "private-top-bookings",
        pluginId: PLUGIN_ID,
        icon: User,
        title: {
          id: `${PLUGIN_ID}.widget.privateTop`,
          defaultMessage: "Private Tours — Top 5 by Requests",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then((m) => m.PrivateTopWidget),
      },
      {
        id: "walk-top-bookings",
        pluginId: PLUGIN_ID,
        icon: Walk,
        title: {
          id: `${PLUGIN_ID}.widget.walkTop`,
          defaultMessage: "Public Walks — Top 5 by Bookings",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then((m) => m.WalkTopWidget),
      },
      {
        id: "walk-top-revenue",
        pluginId: PLUGIN_ID,
        icon: ChartCircle,
        title: {
          id: `${PLUGIN_ID}.widget.walkRevenue`,
          defaultMessage: "Public Walks — Top 5 by Revenue",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then(
            (m) => m.WalkRevenueWidget,
          ),
      },
      {
        id: "website-revenue-monthly",
        pluginId: PLUGIN_ID,
        icon: ChartPie,
        title: {
          id: `${PLUGIN_ID}.widget.revenueMonthly`,
          defaultMessage: "Website Revenue — Last 6 Months",
        },
        component: () =>
          import("./components/AnalyticsWidgets").then(
            (m) => m.RevenueMonthlyWidget,
          ),
      },
    ]);
  },

  bootstrap() {},
};
