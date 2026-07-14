import { useState, useEffect } from "react";
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

// Types that use the guided tour → date → slot flow, with per-type labels.
// (Private uses preferred date + start time; it has no payment status.)
const GUIDED = {
  group: {
    dateLabel: "Tour date",
    dateHelp: "The tour date (the day the tour runs), loaded from actual bookings.",
    slotLabel: "Time slot",
    slotHelp: "The time slot on the selected date.",
  },
  walk: {
    dateLabel: "Tour date",
    dateHelp: "The tour date (the day the walk runs), loaded from actual bookings.",
    slotLabel: "Time slot",
    slotHelp: "The time slot on the selected date.",
  },
  event: {
    dateLabel: "Tour date",
    dateHelp: "The tour date (the day the event runs), loaded from actual bookings.",
    slotLabel: "Time slot",
    slotHelp: "The time slot on the selected date.",
  },
  private: {
    dateLabel: "Preferred date",
    dateHelp: "The customer's preferred date, loaded from actual requests.",
    slotLabel: "Start time",
    slotHelp: "The requested start time on the selected date.",
  },
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

// Small grey explanatory line shown above a field.
const Help = ({ children }) => (
  <Box paddingBottom={1}>
    <Typography variant="pi" textColor="neutral600">
      {children}
    </Typography>
  </Box>
);

const FieldLabel = ({ children }) => (
  <Typography variant="pi" fontWeight="bold" tag="label">
    {children}
  </Typography>
);

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
  const [selectedDate, setSelectedDate] = useState("");
  const [dateOptions, setDateOptions] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slot, setSlot] = useState("");
  const [slotOptions, setSlotOptions] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guided flow (tour → date → slot). Group/Walk/Event use tour date + time
  // slot; Private uses preferred date + start time. Donation uses neither.
  const guided = type ? GUIDED[type] : null;
  const showGuided = !!guided;
  const showTour = type !== "donation";
  const showStatus = type !== "private";

  // Build the date/slot query params for the current selection (shared by the
  // status fetch and the export).
  const dateSlotParams = (params) => {
    if (showGuided) {
      if (selectedDate) {
        params.set("dateFrom", selectedDate);
        params.set("dateTo", selectedDate);
      }
      if (slot) params.set("slot", slot);
    } else {
      const f = fmtDate(from);
      const t = fmtDate(to);
      if (f) params.set("dateFrom", f);
      if (t) params.set("dateTo", t);
    }
    return params;
  };

  // Step 1 → 2: when the tour changes, load the dates that actually have
  // bookings for it so the admin picks from a real list.
  useEffect(() => {
    if (!open || !showGuided) return;
    const params = new URLSearchParams();
    params.set("type", type);
    if (tour.trim()) params.set("tour", tour.trim());

    let cancelled = false;
    setDatesLoading(true);
    get(`/reports/dates?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.dates || [];
        setDateOptions(list);
        setSelectedDate((d) => (list.includes(d) ? d : ""));
      })
      .catch(() => !cancelled && setDateOptions([]))
      .finally(() => !cancelled && setDatesLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showGuided, type, tour]);

  // Step 2 → 3: when a date is chosen, load that date's time slots.
  useEffect(() => {
    if (!open || !showGuided || !selectedDate) {
      setSlotOptions([]);
      return;
    }
    const params = new URLSearchParams();
    params.set("type", type);
    if (tour.trim()) params.set("tour", tour.trim());
    params.set("dateFrom", selectedDate);
    params.set("dateTo", selectedDate);

    let cancelled = false;
    setSlotsLoading(true);
    get(`/reports/slots?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.slots || [];
        setSlotOptions(list);
        setSlot((s) => (list.includes(s) ? s : ""));
      })
      .catch(() => !cancelled && setSlotOptions([]))
      .finally(() => !cancelled && setSlotsLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showGuided, type, tour, selectedDate]);

  // Final step: count bookings per status for the current tour/date/slot, so
  // the Status dropdown shows what exists and how many of each.
  useEffect(() => {
    if (!open || !showStatus) return;
    const params = new URLSearchParams();
    params.set("type", type);
    if (showTour && tour.trim()) params.set("tour", tour.trim());
    dateSlotParams(params);

    let cancelled = false;
    setStatusLoading(true);
    get(`/reports/statuses?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.statuses || [];
        setStatusOptions(list);
        // Drop the selected status if it no longer appears.
        setStatus((s) => (list.some((o) => o.status === s) ? s : ""));
      })
      .catch(() => !cancelled && setStatusOptions([]))
      .finally(() => !cancelled && setStatusLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showStatus, showTour, type, tour, selectedDate, slot, from, to]);

  // Not a supported collection → don't render anything in the toolbar.
  if (!type) return null;

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      if (showTour && tour.trim()) params.set("tour", tour.trim());
      if (showStatus && status) params.set("status", status);
      dateSlotParams(params);

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
        <Modal.Root open={open} onOpenChange={setOpen}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>{LABELS[type]} — filtered export</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Flex direction="column" alignItems="stretch" gap={4}>
                {/* Overall explanation */}
                <Box
                  background="neutral100"
                  padding={3}
                  hasRadius
                >
                  <Typography variant="omega" textColor="neutral700">
                    {showGuided
                      ? `Download a CSV of these bookings. Filter step by step: type a tour, then pick a ${guided.dateLabel.toLowerCase()}, then a ${guided.slotLabel.toLowerCase()}. Leave any filter empty to include everything.`
                      : "Download a CSV of these records. Use the filters below to narrow the export, or leave them empty to include everything."}
                  </Typography>
                </Box>

                {showTour && (
                  <Box>
                    <Help>
                      Which tour to export. Enter the tour&apos;s slug or title.
                      This also drives the tour dates below.
                    </Help>
                    <TextInput
                      label="Tour (slug or title)"
                      name="tour"
                      value={tour}
                      onChange={(e) => setTour(e.target.value)}
                      placeholder="e.g. fort-walk"
                      hint="Leave empty to include every tour"
                    />
                  </Box>
                )}

                {showGuided ? (
                  <>
                    {/* DATE (fetched from bookings for the tour) */}
                    <Box>
                      <Help>{guided.dateHelp}</Help>
                      <FieldLabel>{guided.dateLabel}</FieldLabel>
                      <Box paddingTop={1}>
                        <SingleSelect
                          value={selectedDate}
                          onChange={(v) => setSelectedDate(String(v))}
                          disabled={datesLoading || dateOptions.length === 0}
                        >
                          <SingleSelectOption value="">
                            All dates
                          </SingleSelectOption>
                          {dateOptions.map((d) => (
                            <SingleSelectOption key={d} value={d}>
                              {d}
                            </SingleSelectOption>
                          ))}
                        </SingleSelect>
                      </Box>
                      <Box paddingTop={1}>
                        <Typography variant="pi" textColor="neutral600">
                          {datesLoading
                            ? "Loading dates…"
                            : dateOptions.length
                              ? `${dateOptions.length} date(s) with bookings.`
                              : "No booking dates yet — type a tour to load its dates."}
                        </Typography>
                      </Box>
                    </Box>

                    {/* SLOT / START TIME (fetched for the chosen date) */}
                    <Box>
                      <Help>{guided.slotHelp}</Help>
                      <FieldLabel>{guided.slotLabel}</FieldLabel>
                      <Box paddingTop={1}>
                        <SingleSelect
                          value={slot}
                          onChange={(v) => setSlot(String(v))}
                          disabled={
                            !selectedDate ||
                            slotsLoading ||
                            slotOptions.length === 0
                          }
                        >
                          <SingleSelectOption value="">
                            {`Any ${guided.slotLabel.toLowerCase()}`}
                          </SingleSelectOption>
                          {slotOptions.map((s) => (
                            <SingleSelectOption key={s} value={s}>
                              {s}
                            </SingleSelectOption>
                          ))}
                        </SingleSelect>
                      </Box>
                      <Box paddingTop={1}>
                        <Typography variant="pi" textColor="neutral600">
                          {!selectedDate
                            ? `Pick a ${guided.dateLabel.toLowerCase()} first.`
                            : slotsLoading
                              ? "Loading…"
                              : slotOptions.length
                                ? `${slotOptions.length} option(s) on this date.`
                                : "None found for this date."}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  /* Donation → free date range on its createdAt date */
                  <Box>
                    <Help>
                      Filter by a date range. Leave empty to include all dates.
                    </Help>
                    <Flex gap={4} alignItems="flex-start">
                      <Box flex="1">
                        <DatePicker label="Date from" onChange={setFrom} />
                      </Box>
                      <Box flex="1">
                        <DatePicker label="Date to" onChange={setTo} />
                      </Box>
                    </Flex>
                  </Box>
                )}

                {/* STATUS — last; counts fetched for the current tour/date/slot */}
                {showStatus && (
                  <Box>
                    <Help>
                      Booking status for the current filters above. The number in
                      brackets is how many bookings have that status.
                    </Help>
                    <FieldLabel>Status</FieldLabel>
                    <Box paddingTop={1}>
                      <SingleSelect
                        value={status}
                        onChange={(v) => setStatus(String(v))}

                        disabled={statusLoading}
                      >
                        <SingleSelectOption value="">
                          Any status
                        </SingleSelectOption>
                        {statusOptions.map((o) => (
                          <SingleSelectOption key={o.status} value={o.status}>
                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}{" "}
                            ({o.count})
                          </SingleSelectOption>
                        ))}
                      </SingleSelect>
                    </Box>
                    <Box paddingTop={1}>
                      <Typography variant="pi" textColor="neutral600">
                        {statusLoading
                          ? "Loading statuses…"
                          : statusOptions.length
                            ? `${statusOptions
                                .map((o) => `${o.status}: ${o.count}`)
                                .join(", ")}`
                            : "No bookings match the filters above."}
                      </Typography>
                    </Box>
                  </Box>
                )}

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
