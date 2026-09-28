import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';

const COLORS = { ALLOW: '#10b981', BLOCK: '#ef4444', HUMAN_REVIEW: '#f59e0b', RETRY: '#06b6d4' };

const TIMELINE_DATA = [
  { time: '09:00', allow: 8, block: 1, review: 0, retry: 1 },
  { time: '09:30', allow: 6, block: 2, review: 1, retry: 0 },
  { time: '10:00', allow: 5, block: 1, review: 2, retry: 1 },
  { time: '10:30', allow: 7, block: 0, review: 1, retry: 0 },
  { time: '11:00', allow: 3, block: 2, review: 0, retry: 2 },
  { time: '11:30', allow: 4, block: 1, review: 1, retry: 1 },
  { time: '12:00', allow: 6, block: 2, review: 1, retry: 0 },
];

const FAILURE_DATA = [
  { name: 'Policy Violation', count: 5, color: '#f59e0b' },
  { name: 'Evidence Mismatch', count: 3, color: '#ef4444' },
  { name: 'Missing Evidence', count: 2, color: '#f97316' },
  { name: 'Replay Attack', count: 1, color: '#a78bfa' },
];

const RELIABILITY_TREND = [
  { day: 'Mon', score: 88 }, { day: 'Tue', score: 91 }, { day: 'Wed', score: 85 },
  { day: 'Thu', score: 93 }, { day: 'Fri', score: 89 }, { day: 'Sat', score: 92 }, { day: 'Sun', score: 92 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11, boxShadow: '0 4px 12px rgba(11,26,48,0.08)' }}>
        <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>{p.dataKey}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reliability() {
  const { metrics } = useSaarthiStore();
  const total = metrics.allowed + metrics.blocked + metrics.human_review + metrics.retried;
  const reliability = total > 0 ? Math.round(metrics.allowed / total * 100) : 92;

  const PIE_DATA = [
    { name: 'Allowed', value: metrics.allowed, color: '#10b981' },
    { name: 'Blocked', value: metrics.blocked, color: '#ef4444' },
    { name: 'Human Review', value: metrics.human_review, color: '#f59e0b' },
    { name: 'Retry', value: metrics.retried, color: '#06b6d4' },
  ].filter(d => d.value > 0);

  const mostCommonFailure = FAILURE_DATA.reduce((a, b) => (a.count > b.count ? a : b));

  return (
    <div style={{ maxWidth: 1400, color: '#0b1a30' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a30' }}>Reliability Analytics</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
          Agent behavior analysis and governance performance metrics
        </p>
      </div>

      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Overall Reliability', value: `${reliability}%`, color: '#a78bfa' },
          { label: 'Successful Runs', value: metrics.allowed, color: '#10b981' },
          { label: 'Retries', value: metrics.retried, color: '#06b6d4' },
          { label: 'Human Reviews', value: metrics.human_review, color: '#f59e0b' },
          { label: 'Blocked Actions', value: metrics.blocked, color: '#ef4444' },
          { label: 'Evidence Mismatches', value: metrics.evidence_mismatches, color: '#f97316' },
          { label: 'Policy Violations', value: metrics.policy_violations, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{m.label.toUpperCase()}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Decisions Over Time */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 16 }}>Decisions Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TIMELINE_DATA}>
              <defs>
                {[['green', '#10b981'], ['red', '#ef4444'], ['yellow', '#f59e0b'], ['cyan', '#06b6d4']].map(([id, c]) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="allow" stroke="#10b981" fill="url(#grad-green)" strokeWidth={2} name="Allow" />
              <Area type="monotone" dataKey="block" stroke="#ef4444" fill="url(#grad-red)" strokeWidth={2} name="Block" />
              <Area type="monotone" dataKey="review" stroke="#f59e0b" fill="url(#grad-yellow)" strokeWidth={2} name="Review" />
              <Area type="monotone" dataKey="retry" stroke="#06b6d4" fill="url(#grad-cyan)" strokeWidth={2} name="Retry" />
              <Legend wrapperStyle={{ fontSize: 11, marginTop: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Distribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 16 }}>Decision Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0b1a30' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', textAlign: 'center', marginTop: 8 }}>
            {reliability}%
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginLeft: 4 }}>reliability</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Failure Breakdown */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 16 }}>
            <AlertTriangle size={13} style={{ color: '#f59e0b', marginRight: 6, verticalAlign: 'middle' }} />
            Failure Breakdown
          </h3>
          {FAILURE_DATA.map(f => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: '#475569' }}>{f.name}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: f.color }}>{f.count}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${(f.count / 11) * 100}%`, background: f.color, borderRadius: 3, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, color: '#d97706', fontWeight: 700, marginBottom: 4 }}>MOST COMMON FAILURE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30' }}>{mostCommonFailure.name}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
              Recommended: Strengthen pre-action policy validation for high-value financial actions.
            </div>
          </div>
        </div>

        {/* Reliability Trend */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 16 }}>
            <TrendingUp size={13} style={{ color: '#10b981', marginRight: 6, verticalAlign: 'middle' }} />
            Reliability Trend (7-Day)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={RELIABILITY_TREND}>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0b1a30' }} />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Risk Distribution */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>RISK DISTRIBUTION</div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={[
                { level: 'LOW', count: 18, fill: '#10b981' },
                { level: 'MEDIUM', count: 14, fill: '#f59e0b' },
                { level: 'HIGH', count: 9, fill: '#ef4444' },
                { level: 'CRITICAL', count: 3, fill: '#dc2626' },
              ]}>
                <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {[{ level: 'LOW', count: 18, fill: '#10b981' }, { level: 'MEDIUM', count: 14, fill: '#f59e0b' }, { level: 'HIGH', count: 9, fill: '#ef4444' }, { level: 'CRITICAL', count: 3, fill: '#dc2626' }].map((entry) => (
                    <Cell key={entry.level} fill={entry.fill} />
                  ))}
                </Bar>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0b1a30' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 14 }}>
          <CheckCircle2 size={13} style={{ color: '#10b981', marginRight: 6, verticalAlign: 'middle' }} />
          Agent Behavior Improvement Recommendations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { finding: 'Policy violations are the most common failure category', recommendation: 'Implement pre-flight policy check in the agent before proposing high-value actions.', priority: 'HIGH', color: '#ef4444' },
            { finding: 'Evidence mismatches occur in ~14% of actions', recommendation: 'Strengthen agent context grounding. Always fetch from primary data source immediately before action.', priority: 'HIGH', color: '#f59e0b' },
            { finding: 'Replay detection triggered on repeated submissions', recommendation: 'Add idempotency keys to agent action proposals. Dedup before submitting to governance.', priority: 'MEDIUM', color: '#0284c7' },
          ].map(r => (
            <div key={r.finding} style={{ padding: 14, background: '#f8fbff', borderRadius: 9, border: '1px solid #e2e8f0', borderLeft: `3px solid ${r.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>PRIORITY: {r.priority}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6, lineHeight: 1.4 }}>Finding: {r.finding}</div>
              <div style={{ fontSize: 12, color: '#0b1a30', fontWeight: 600, lineHeight: 1.4 }}>{r.recommendation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
