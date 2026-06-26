import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function WaitTimeChart({ history, staticWaitHistory, scheduleMode }) {
  const base = history.slice(-40);
  const staticBase = scheduleMode === 'dynamic' && staticWaitHistory ? staticWaitHistory.slice(-40) : [];
  const staticMap = new Map(staticBase.map((item) => [`${item.day}-${item.time}`, item.staticWait]));
  const data = base.map((item) => ({
    ...item,
    staticWait: staticMap.get(`${item.day}-${item.time}`) ?? null,
  }));

  return (
    <div className="h-44 rounded-xl border border-pulse-border bg-pulse-bg p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        Passenger Influx Trend
      </p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid #1e293b',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="wait"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Waiting Passengers"
          />
          <Line
            type="monotone"
            dataKey="satisfaction"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Satisfaction (%)"
          />
          {scheduleMode === 'dynamic' && (
            <Line
              type="monotone"
              dataKey="staticWait"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Static Waiting"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
