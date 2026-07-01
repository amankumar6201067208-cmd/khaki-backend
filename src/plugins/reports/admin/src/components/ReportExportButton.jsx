import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useFetchClient } from "@strapi/strapi/admin";
import {
  Button,
  Modal,
  Flex,
  Box,
  Typography,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  DatePicker,
} from "@strapi/design-system";
import { Download } from "@strapi/icons";

// Which content-type maps to which report type. The button only appears on
// these collections; on any other list view it renders nothing.
const MODEL_TO_TYPE = {
  "api::booking.booking": "group",
  "api::public-walk-booking.public-walk-booking": "walk",
  "api::public-event-booking.public-event-booking": "event",
  "api::donation-booking.donation-booking": "donation",
  "api::private-tour-booking.private-tour-booking": "private",
};

const LABELS = {
  group: "Group Tour",
  walk: "Public Walk",
  event: "Public Event",
  donation: "Donation",
  private: "Private Tour",
};

// Format a Date (from DatePicker) to YYYY-MM-DD using local parts (no TZ shift).
const fmtDate = (d) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
};

const ReportExportButton = () => {
  const { pathname } = useLocation();
  const { get } = useFetchClient();

  // e.g. /content-manager/collection-types/api::booking.booking?page=1
  const match = pathname.match(/collection-types\/([^/?]+)/);
  const uid = match ? match[1] : null;
  const type = uid ? MODEL_TO_TYPE[uid] : null;

  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Not a supported collection → don't render anything in the toolbar.
  if (!type) return null;

  const showTour = type !== "donation";
  const showStatus = type !== "private";

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      if (showTour && tour.trim()) params.set("tour", tour.trim());
      if (showStatus && status) params.set("status", status);
      const f = fmtDate(from);
      const t = fmtDate(to);
      if (f) params.set("dateFrom", f);
      if (t) params.set("dateTo", t);

      const res = await get(`/reports/export?${params.toString()}`);
      const { csv, filename, rowCount } = res.data || {};

      if (!rowCount) {
        setError("No records match these filters.");
        setLoading(false);
        return;
      }

      // Rebuild the CSV file in the browser (BOM so Excel reads UTF-8).
      const blob = new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `report-${type}-${fmtDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setError("Export failed. Please adjust the filters and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        startIcon={<Download />}
        onClick={() => setOpen(true)}
      >
        Report
      </Button>

      {open && (
        <Modal.Root open={open} onClose={() => setOpen(false)}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>{LABELS[type]} — filtered export</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Flex direction="column" alignItems="stretch" gap={4}>
                {showTour && (
                  <TextInput
                    label="Tour (slug or title — optional)"
                    name="tour"
                    value={tour}
                    onChange={(e) => setTour(e.target.value)}
                    placeholder="e.g. fort-walk"
                    hint="Leave empty to include every tour"
                  />
                )}

                {showStatus && (
                  <Box>
                    <Typography variant="pi" fontWeight="bold" tag="label">
                      Status
                    </Typography>
                    <Box paddingTop={1}>
                      <SingleSelect
                        value={status}
                        onChange={(v) => setStatus(String(v))}
                        placeholder="Any status"
                      >
                        <SingleSelectOption value="">
                          Any status
                        </SingleSelectOption>
                        <SingleSelectOption value="paid">Paid</SingleSelectOption>
                        <SingleSelectOption value="pending">
                          Pending
                        </SingleSelectOption>
                        <SingleSelectOption value="failed">
                          Failed
                        </SingleSelectOption>
                      </SingleSelect>
                    </Box>
                  </Box>
                )}

                <Flex gap={4} alignItems="flex-start">
                  <Box flex="1">
                    <DatePicker label="Date from" onChange={setFrom} />
                  </Box>
                  <Box flex="1">
                    <DatePicker label="Date to" onChange={setTo} />
                  </Box>
                </Flex>

                {error ? (
                  <Typography textColor="danger600">{error}</Typography>
                ) : null}
              </Flex>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="tertiary">Cancel</Button>
              </Modal.Close>
              <Button
                onClick={handleDownload}
                loading={loading}
                startIcon={<Download />}
              >
                Download CSV
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}
    </>
  );
};

export { ReportExportButton };
