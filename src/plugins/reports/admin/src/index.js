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

    // Inject a "Report" button into every collection list-view toolbar (next to
    // Export / Import). It only renders on the supported booking/donation
    // collections; elsewhere it shows nothing.
    app
      .getPlugin("content-manager")
      .injectComponent("listView", "actions", {
        name: "reportsFilteredExport",
        Component: ReportExportButton,
      });
  },

  bootstrap() {},
};
