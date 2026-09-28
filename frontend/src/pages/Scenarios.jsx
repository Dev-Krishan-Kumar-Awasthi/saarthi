import React, { useState } from 'react';
import { Play, AlertTriangle, CheckCircle2, Ban, RefreshCw, ChevronRight } from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const SCENARIOS = [
  {
    id: 'safe_refund',
    title: 'Verified Refund',
    category: 'SAFE ACTION',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
    icon: CheckCircle2,
    description: 'Customer Priya Verma requests ₹2,000 refund. All evidence verified, within autonomous limit.',
    customer: 'Priya Verma',
    order: 'ORD-28391',
    amount: '₹2,000',
    riskLabel: 'LOW',
    riskColor: '#10b981',
    expectedDecision: 'ALLOW',
    decisionColor: '#10b981',
    policyResult: 'PASS',
    highlights: ['Customer verified ✓', 'Order confirmed ✓', 'Amount within limit ✓', 'Risk: 28/100'],
  },
  {
    id: 'policy_violation',
    title: 'Over-Limit Refund',
    category: 'POLICY VIOLATION',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
    icon: AlertTriangle,
    description: 'Rahul Sharma requests ₹8,500 refund. Exceeds autonomous limit of ₹5,000. SAARTHI routes to human review.',
    customer: 'Rahul Sharma',
    order: 'ORD-48291',
    amount: '₹8,500',
    riskLabel: 'HIGH',
    riskColor: '#ef4444',
    expectedDecision: 'HUMAN_REVIEW',
    decisionColor: '#f59e0b',
    policyResult: 'VIOLATION',
    highlights: ['Policy limit ₹5,000', 'Requested ₹8,500', 'Risk: 84/100', 'Human approval required'],
  },
  {
    id: 'hallucination',
    title: 'Hallucinated Claim',
    category: 'HALLUCINATION',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
    icon: Ban,
    description: 'Agent claims customer balance is ₹15,000. Trusted data shows ₹10,000. Evidence contradiction → BLOCK.',
    customer: 'Amit Joshi',
    order: 'ORD-39201',
    amount: '₹6,000',
    riskLabel: 'CRITICAL',
    riskColor: '#ef4444',
    expectedDecision: 'BLOCK',
    decisionColor: '#ef4444',
    policyResult: 'BLOCK',
    highlights: ['Agent claims: ₹15,000', 'Trusted state: ₹10,000', 'Mismatch: ₹5,000', 'Action BLOCKED'],
    wowMoment: true,
    wowLabel: '★ WOW: Hallucination Demo',
  },
  {
    id: 'missing_evidence',
    title: 'Missing Evidence',
    category: 'MISSING EVIDENCE',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.25)',
    icon: AlertTriangle,
    description: 'Agent proposes refund but order verification is absent from evidence. SAARTHI pauses for human review.',
    customer: 'Sneha Patil',
    order: 'ORD-55102',
    amount: '₹3,500',
    riskLabel: 'MEDIUM',
    riskColor: '#f97316',
    expectedDecision: 'HUMAN_REVIEW',
    decisionColor: '#f59e0b',
    policyResult: 'INCOMPLETE',
    highlights: ['Order evidence missing', 'Customer verified ✓', 'Risk: 55/100', 'Evidence required'],
  },
  {
    id: 'replay_attack',
    title: 'Replay Attack',
    category: 'REPLAY ATTACK',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
    icon: RefreshCw,
    description: 'Same sensitive refund action submitted twice. SAARTHI detects duplicate request and blocks it.',
    customer: 'Vikram Singh',
    order: 'ORD-60041',
    amount: '₹4,000',
    riskLabel: 'HIGH',
    riskColor: '#ef4444',
    expectedDecision: 'BLOCK',
    decisionColor: '#ef4444',
    policyResult: 'BLOCK',
    highlights: ['Action submitted twice', 'Duplicate detected ⛔', 'Replay prevention active', 'Second request BLOCKED'],
    wowMoment: true,
    wowLabel: '★ WOW: Replay Detection',
  },
];

const decisionBadge = { ALLOW: 'badge-allow', BLOCK: 'badge-block', HUMAN_REVIEW: 'badge-review', RETRY: 'badge-retry' };

export default function Scenarios() {
  const { runScenario, setActivePage, workflows } = useSaarthiStore();
  const [running, setRunning] = useState(null);
  const [result, setResult] = useState(null);

  const handleRun = async (sc) => {
    setRunning(sc.id);
    setResult(null);
    await new Promise(r => setTimeout(r, 800));
    await runScenario(sc.id);
    setRunning(null);
    setResult(sc.id);
    setTimeout(() => setResult(null), 5000);
  };

  const recentByScenario = {};
  workflows.forEach(w => {
    if (w.scenario_id && !recentByScenario[w.scenario_id]) {
      recentByScenario[w.scenario_id] = w;
    }
  });

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a30' }}>Scenarios</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
          Predefined governance scenarios demonstrating SAARTHI's decision-making capabilities
        </p>
      </div>

      {/* Hallucination WOW DEMO BANNER */}
      <div style={{
        padding: '14px 18px', marginBottom: 20,
        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Why Trust Can't Be Assumed: </span>
          <span style={{ fontSize: 13, color: '#475569' }}>
            Run "Hallucinated Claim" to see SAARTHI block an agent action based on a false factual claim.
            Run "Replay Attack" to see duplicate action detection in action.
          </span>
        </div>
      </div>

      {/* Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {SCENARIOS.map(sc => {
          const Icon = sc.icon;
          const lastRun = recentByScenario[sc.id];
          const isRunning = running === sc.id;
          const justCompleted = result === sc.id;

          return (
            <div key={sc.id} style={{
              background: '#ffffff',
              border: `1px solid ${sc.borderColor}`,
              borderRadius: 12, padding: 20,
              boxShadow: '0 2px 8px rgba(11,26,48,0.03)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {sc.wowMoment && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 10, fontWeight: 700, color: '#d97706',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 20, padding: '2px 8px',
                }}>{sc.wowLabel}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${sc.color}15`, border: `1px solid ${sc.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: sc.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: sc.color, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 3 }}>{sc.category}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0b1a30' }}>{sc.title}</div>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>{sc.description}</p>

              {/* Customer + Action Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <InfoBlock label="Customer" value={sc.customer} />
                <InfoBlock label="Order" value={sc.order} />
                <InfoBlock label="Amount" value={sc.amount} />
                <InfoBlock label="Risk" value={sc.riskLabel} color={sc.riskColor} />
              </div>

              {/* Highlights */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {sc.highlights.map(h => (
                  <span key={h} style={{ fontSize: 10.5, color: '#475569', background: '#f8fbff', padding: '2px 8px', borderRadius: 10, border: '1px solid #e2e8f0' }}>{h}</span>
                ))}
              </div>

              {/* Expected Decision */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 10.5, color: '#4a5568', marginRight: 6 }}>Expected:</span>
                  <span className={`tag ${decisionBadge[sc.expectedDecision] || 'badge-info'}`} style={{ fontSize: 10 }}>
                    {sc.expectedDecision}
                  </span>
                </div>
                {lastRun && (
                  <div style={{ fontSize: 10.5, color: '#4a5568' }}>
                    Last: <span style={{ color: sc.decisionColor }}>{lastRun.decision}</span>
                  </div>
                )}
              </div>

              {/* Run Button */}
              <button
                onClick={() => handleRun(sc)}
                disabled={isRunning}
                style={{
                  width: '100%', padding: '9px', borderRadius: 8,
                  background: isRunning ? 'rgba(13,22,48,0.5)' : `${sc.color}18`,
                  border: `1px solid ${sc.color}44`, color: isRunning ? '#4a5568' : sc.color,
                  fontWeight: 600, fontSize: 13, cursor: isRunning ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
              >
                {isRunning ? (
                  <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating...</>
                ) : justCompleted ? (
                  <><CheckCircle2 size={13} /> Scenario Complete</>
                ) : (
                  <><Play size={13} /> Run Scenario</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hallucination Wow Detail */}
      <div className="glass-card" style={{ padding: 20, marginTop: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} style={{ color: '#ef4444' }} />
          Why Hallucination Detection Matters
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>

          <div style={{ padding: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, color: '#3b82f6', fontWeight: 700, marginBottom: 8 }}>AGENT CLAIM</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>₹15,000</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Customer balance</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, color: '#ef4444' }}>≠</div>
            <div style={{ fontSize: 10, color: '#4a5568', marginTop: 2 }}>MISMATCH</div>
          </div>
          <div style={{ padding: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 700, marginBottom: 8 }}>TRUSTED STATE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>₹10,000</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Verified balance</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>ACTION BLOCKED</span>
          <span style={{ fontSize: 12.5, color: '#94a3b8', marginLeft: 8 }}>Difference: ₹5,000 — Autonomous agents cannot be trusted without evidence verification.</span>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, color }) {
  return (
    <div style={{ padding: '8px 10px', background: '#f8fbff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, color: color || '#0b1a30', fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}
