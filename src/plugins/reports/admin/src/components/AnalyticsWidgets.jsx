import { useEffect, useState } from "react";
import { useFetchClient } from "@strapi/strapi/admin";
import { Flex, Typography, Loader } from "@strapi/design-system";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ORANGE = "#DB4D27";
const BLUE = "#4945FF";

// Long tour names → short X-axis ticks (full name still shows in the tooltip).
const shortLabel = (v) => {
  const s = String(v ?? "");
  return s.length > 10 ? `${s.slice(0, 10)}…` : s;
};

// Shared fetch of /reports/analytics (each widget calls it; endpoint is cheap).
const useAnalytics = () => {
  const { get } = useFetchClient();
  const [state, setState] = useState({ data: null, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    get("/reports/analytics")
      .then((res) => {
        if (!cancelled) setState({ data: res.data, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

const Shell = ({ loading, error, empty, children }) => {
  if (loading)
    return (
      <Flex justifyContent="center" alignItems="center" height="240px">
        <Loader small>Loading…</Loader>
      </Flex>
    );
  if (error)
    return (
      <Flex justifyContent="center" alignItems="center" height="240px">
        <Typography textColor="danger600">Failed to load analytics.</Typography>
      </Flex>
    );
  if (empty)
    return (
      <Flex justifyContent="center" alignItems="center" height="240px">
        <Typography textColor="neutral600">No paid bookings yet.</Typography>
      </Flex>
    );
  return children;
};

export const TopRevenueWidget = () => {
  const { data, loading, error } = useAnalytics();
  const rows = data?.topByRevenue || [];
  return (
    <Shell loading={loading} error={error} empty={!rows.length}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="tour"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
            tickFormatter={shortLabel}
            tick={{ fontSize: 10 }}
          />
          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`₹ ${v}`, "Revenue"]} />
          <Bar dataKey="revenue" fill={ORANGE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Shell>
  );
};

export const TopBookingsWidget = () => {
  const { data, loading, error } = useAnalytics();
  const rows = data?.topByBookings || [];
  return (
    <Shell loading={loading} error={error} empty={!rows.length}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="tour"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
            tickFormatter={shortLabel}
            tick={{ fontSize: 10 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [v, "Bookings"]} />
          <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Shell>
  );
};

export const MonthlyBookingsWidget = () => {
  const { data, loading, error } = useAnalytics();
  const rows = data?.monthly || [];
  const hasAny = rows.some((r) => r.count > 0);
  return (
    <Shell loading={loading} error={error} empty={!hasAny}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ left: 0, right: 24, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [v, "Bookings"]} />
          <Bar dataKey="count" fill={ORANGE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Shell>
  );
};
