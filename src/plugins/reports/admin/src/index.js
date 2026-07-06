import { Download } from "@strapi/icons";
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
  },

  bootstrap() {},
};
