import { useState } from "react";
import { useFetchClient } from "@strapi/strapi/admin";
import {
  Main,
  Box,
  Button,
  Flex,
  Typography,
  SingleSelect,
  SingleSelectOption,
  TextInput,
} from "@strapi/design-system";
import { Download } from "@strapi/icons";

const TYPE_OPTIONS = [
  { value: "all", label: "All bookings (combined)" },
  { value: "group", label: "Group Tour" },
  { value: "walk", label: "Public Walk" },
  { value: "event", label: "Public Event" },
  { value: "donation", label: "Donation" },
  { value: "private", label: "Private Tour" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const dateInputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #dcdce4",
  fontSize: "14px",
  height: "40px",
};

const App = () => {
  const { get } = useFetchClient();
  const [type, setType] = useState("all");
  const [tour, setTour] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      if (tour.trim()) params.set("tour", tour.trim());
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await get(`/reports/export?${params.toString()}`);
      const { csv, filename, rowCount } = res.data || {};

      if (!rowCount) {
        setMessage({ type: "danger", text: "No records match these filters." });
        setLoading(false);
        return;
      }

      // Rebuild the CSV file in the browser (BOM so Excel reads UTF-8).
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename ||
        `report-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: `Report downloaded ✅ (${rowCount} rows)`,
      });
    } catch (err) {
      setMessage({
        type: "danger",
        text: "Export failed. Please adjust the filters and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" tag="h1">
          Reports
        </Typography>
        <Box paddingTop={2} paddingBottom={6}>
          <Typography variant="epsilon" textColor="neutral600">
            Export bookings &amp; donations as CSV. Filter by tour, status and
            date range, then download.
          </Typography>
        </Box>

        <Flex direction="column" alignItems="stretch" gap={4} maxWidth="520px">
          <Box>
            <Typography variant="pi" fontWeight="bold" tag="label">
              Report type
            </Typography>
            <Box paddingTop={1}>
              <SingleSelect value={type} onChange={(v) => setType(String(v))}>
                {TYPE_OPTIONS.map((o) => (
                  <SingleSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Box>
          </Box>

          <TextInput
            label="Tour (slug or title — optional)"
            name="tour"
            value={tour}
            onChange={(e) => setTour(e.target.value)}
            placeholder="e.g. fort-walk"
            hint="Leave empty to include every tour"
          />

          <Box>
            <Typography variant="pi" fontWeight="bold" tag="label">
              Status
            </Typography>
            <Box paddingTop={1}>
              <SingleSelect
                value={status}
                onChange={(v) => setStatus(String(v))}
              >
                {STATUS_OPTIONS.map((o) => (
                  <SingleSelectOption key={o.value || "any"} value={o.value}>
                    {o.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Box>
          </Box>

          <Flex gap={4} alignItems="flex-end">
            <Box flex="1">
              <Typography variant="pi" fontWeight="bold" tag="label">
                Date from
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={dateInputStyle}
                />
              </Box>
            </Box>
            <Box flex="1">
              <Typography variant="pi" fontWeight="bold" tag="label">
                Date to
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={dateInputStyle}
                />
              </Box>
            </Box>
          </Flex>

          {message ? (
            <Typography
              textColor={message.type === "danger" ? "danger600" : "success600"}
            >
              {message.text}
            </Typography>
          ) : null}

          <Box paddingTop={2}>
            <Button
              startIcon={<Download />}
              onClick={handleDownload}
              loading={loading}
              size="L"
            >
              Download CSV
            </Button>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { App };
