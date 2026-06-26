import { useEffect, useRef } from 'react';

const TYPE_STYLES = {
  alert: 'text-red-400',
  optimization: 'text-emerald-400',
  info: 'text-slate-400',
};

export default function ActionLog({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="flex h-48 flex-col rounded-xl border border-pulse-border bg-black/40">
      <div className="border-b border-pulse-border px-3 py-2">
        <p className="font-mono text-xs font-medium text-slate-500">SYSTEM ACTION LOG</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {logs.map((entry) => (
          <div key={entry.id} className="mb-1.5">
            <span className="text-indigo-400">
              [{entry.day} {entry.time}]
            </span>{' '}
            <span className={TYPE_STYLES[entry.type] || TYPE_STYLES.info}>
              {entry.type === 'alert' && 'ALERT: '}
              {entry.type === 'optimization' && 'OPTIMIZATION: '}
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
