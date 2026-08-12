import { useEffect, useState } from "react";
import { useFetchClient } from "@strapi/strapi/admin";
import {
  Flex,
  Typography,
  Loader,
  SingleSelect,
  SingleSelectOption,
} from "@strapi/design-system";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const shortLabel = (v) => {
  const s = String(v ?? "");
  return s.length > 10 ? `${s.slice(0, 10)}…` : s;
};

const CLIENT_TTL_MS = 60 * 1000;
let _cache = { data: null, at: 0 };
let _promise = null;

const loadAnalytics = (get) => {
  const fresh = _cache.data && Date.now() - _cache.at < CLIENT_TTL_MS;
  if (fresh) return Promise.resolve(_cache.data);
  if (_promise) return _promise;
  _promise = get("/reports/analytics")
    .then((res) => {
      _cache = { data: res.data, at: Date.now() };
      _promise = null;
      return res.data;
    })
    .catch((err) => {
      _promise = null; // allow a retry on the next mount
      throw err;
    });
  return _promise;
};

const useAnalytics = () => {
  const { get } = useFetchClient();
  const [state, setState] = useState(() => {
    const fresh = _cache.data && Date.now() - _cache.at < CLIENT_TTL_MS;
    return fresh
      ? { data: _cache.data, loading: false, error: false }
      : { data: null, loading: true, error: false };
  });

  useEffect(() => {
    let cancelled = false;
    loadAnalytics(get)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: false });
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

const Shell = ({ loading, error, empty, emptyText, children }) => {
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
        <Typography textColor="neutral600">
          {emptyText || "No bookings yet."}
        </Typography>
      </Flex>
    );
  return children;
};

// A month picker (latest 6 months) shared by the per-type widgets.
const MonthPicker = ({ months, activeKey, onChange, disabled }) => (
  <Flex justifyContent="flex-end">
    <SingleSelect
      size="S"
      aria-label="Select month"
      value={activeKey || ""}
      onChange={onChange}
      disabled={disabled}
    >
      {months.map((m) => (
        <SingleSelectOption key={m.key} value={m.key}>
          {m.label}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  </Flex>
);

const TopByType = ({ typeKey, metric, color }) => {
  const { data, loading, error } = useAnalytics();
  const months = data?.months || [];
  const [selected, setSelected] = useState(null);

  // Default to the latest month (last entry) once data arrives.
  const latestKey = months.length ? months[months.length - 1].key : null;
  const activeKey = selected || latestKey;
  const bucket = (activeKey && data?.byType?.[typeKey]?.[activeKey]) || null;

  const isRevenue = metric === "revenue";
  const rows = bucket
    ? isRevenue
      ? bucket.topByRevenue
      : bucket.topByBookings
    : [];
  const dataKey = isRevenue ? "revenue" : "count";

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      <MonthPicker
        months={months}
        activeKey={activeKey}
        onChange={(v) => setSelected(v)}
        disabled={loading || error || !months.length}
      />
      <Shell
        loading={loading}
        error={error}
        empty={!rows.length}
        emptyText={
          isRevenue ? "No revenue in this month." : "No bookings in this month."
        }
      >
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
            <YAxis
              allowDecimals={false}
              tickFormatter={isRevenue ? (v) => `₹${v}` : undefined}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(v) =>
                isRevenue ? [`₹ ${v}`, "Revenue"] : [v, "Bookings"]
              }
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Shell>
    </Flex>
  );
};

// Distinct colours so the widgets are easy to tell apart.
export const GroupTopWidget = () => (
  <TopByType typeKey="group" metric="bookings" color="#4945FF" />
);
export const GroupRevenueWidget = () => (
  <TopByType typeKey="group" metric="revenue" color="#4945FF" />
);
export const PrivateTopWidget = () => (
  <TopByType typeKey="private" metric="bookings" color="#DB4D27" />
);
export const WalkTopWidget = () => (
  <TopByType typeKey="walk" metric="bookings" color="#328048" />
);
export const WalkRevenueWidget = () => (
  <TopByType typeKey="walk" metric="revenue" color="#328048" />
);

export const RevenueMonthlyWidget = () => {
  const { data, loading, error } = useAnalytics();
  const rows = data?.revenueMonthly || [];
  const hasAny = rows.some((r) => r.revenue > 0);
  return (
    <Shell
      loading={loading}
      error={error}
      empty={!hasAny}
      emptyText="No revenue yet."
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ left: 0, right: 24, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`₹ ${v}`, "Revenue"]} />
          <Bar dataKey="revenue" fill="#DB4D27" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Shell>
  );
};
