import React, { useState } from 'react';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw,
  ArrowRight, Activity, Zap, Users, Sparkles, ChevronRight, FileText, CornerDownRight, Database
} from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const SCENARIOS = [
  {
    id: 'safe_action',
    title: '1. Safe Action',
    badge: 'Expected: ALLOW',
    badgeClass: 'badge-green',
    description: 'Low-risk refund (₹1,800) with verified customer & balance. Normal ML behavioral profile.',
    expected: 'ALLOW',
  },
  {
    id: 'evidence_mismatch',
    title: '2. Evidence Mismatch',
    badge: 'Expected: BLOCK',
    badgeClass: 'badge-red',
    description: 'Agent claims balance ₹15,000, but authoritative SQLite state shows ₹10,000.',
    expected: 'BLOCK',
  },
  {
    id: 'high_impact',
    title: '3. High-Impact Action',
    badge: 'Expected: HUMAN REVIEW',
    badgeClass: 'badge-amber',
    description: 'High refund (₹8,500) exceeds autonomous threshold (₹5,000). Pauses & persists checkpoint.',
    expected: 'HUMAN_REVIEW',
  },
  {
    id: 'suspicious_replay',
    title: '4. Suspicious / Replay',
    badge: 'Expected: BLOCK',
    badgeClass: 'badge-red',
    description: 'Duplicate / anomalous action pattern flagged by scikit-learn IsolationForest ML detector.',
    expected: 'BLOCK',
  },
];

export default function Dashboard() {
  const {
    metrics,
    workflows,
    latestDecision,
    runDemoAgent,
    isRunningAgent,
    selectedScenario,
    setActivePage,
    humanReviews,
    auditIntegrity,
  } = useSaarthiStore();

  const [activeTab, setActiveTab] = useState('recent');

  const pendingReview = humanReviews.find(r => r.status === 'PENDING');

  const handleRun = async (scenarioId) => {
    await runDemoAgent(scenarioId);
  };

  const decisionBadgeStyle = (dec) => {
    switch (dec) {
      case 'ALLOW':
      case 'APPROVED':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'BLOCK':
      case 'BLOCKED':
      case 'REJECTED':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'HUMAN_REVIEW':
      case 'PENDING':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'MODIFIED':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const dStyle = decisionBadgeStyle(latestDecision?.decision || 'ALLOW');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', color: '#0b1a30' }}>
      {/* ── Top Header Banner ── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            padding: '4px 12px', borderRadius: 9999,
            fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6
          }}>
            <Sparkles size={13} />
            <span>AI RUNTIME GOVERNANCE PLATFORM</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0b1a30', margin: 0, letterSpacing: '-0.02em' }}>
            SAARTHI — Runtime Governance
          </h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
            Protect autonomous AI actions before execution with evidence verification, deterministic policies, and explainable ML anomaly scoring.
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActivePage('governance')}
            className="btn-secondary"
            style={{ fontSize: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shield size={14} color="#2563eb" />
            Inspect Pipeline
          </button>
          <button
            onClick={() => setActivePage('safety')}
            className="btn-secondary"
            style={{ fontSize: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Zap size={14} color="#d97706" />
            CircuitGuard (OTel)
          </button>
        </div>
      </div>

      {/* ── 4 KPI Status Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Evaluated
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0b1a30', marginTop: 4 }}>
            {metrics.actions_evaluated || 0}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={12} color="#2563eb" /> Total governance decisions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Allowed
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {metrics.allowed || 0}
          </div>
          <div style={{ fontSize: 11, color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Verified & safe for execution
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Blocked
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            {metrics.blocked || 0}
          </div>
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={12} /> Policy violation or evidence mismatch
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Human Review
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            {metrics.human_reviews_pending || 0}
          </div>
          <div style={{ fontSize: 11, color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} /> Checkpointed for human sign-off
          </div>
        </div>
      </div>

      {/* ── Run Demo Agent (Page 4 & 10 Mandatory Requirement) ── */}
      <div className="glass-card" style={{ padding: '20px 22px', marginBottom: 20, border: '1px solid #bfdbfe', background: '#f8fbff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: '#2563eb', color: '#ffffff', borderRadius: 6,
                padding: '3px 8px', fontSize: 11, fontWeight: 800
              }}>DEMO AGENT</div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0b1a30', margin: 0 }}>
                Run Demo AI Agent Scenarios
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
              The demo agent operates as an external client, dispatching real action requests to the SAARTHI REST API.
            </p>
          </div>
          {isRunningAgent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontSize: 12.5, fontWeight: 600 }}>
              <RefreshCw size={14} className="spin" />
              Evaluating across governance pipeline...
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {SCENARIOS.map(sc => {
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: 10,
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30' }}>{sc.title}</div>
                    <span className={sc.badgeClass} style={{ fontSize: 10, padding: '2px 6px' }}>{sc.expected}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {sc.description}
                  </p>
                </div>

                <button
                  disabled={isRunningAgent}
                  onClick={() => handleRun(sc.id)}
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  <Play size={12} />
                  Execute Scenario
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active HITL Alert Banner (If pending review exists) ── */}
      {pendingReview && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400e' }}>
                TrustBridge HITL Checkpoint Active: Consequential Action Paused
              </div>
              <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                Agent proposed <strong>{pendingReview.action}</strong> of <strong>₹{pendingReview.amount?.toLocaleString()}</strong> for customer {pendingReview.customer_id}. Reason: {pendingReview.reason}.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActivePage('review')}
            className="btn-primary"
            style={{ fontSize: 12, background: '#d97706', borderColor: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Review & Resume <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* ── Latest Decision Pipeline & Explainability (Section 15 Mandatory) ── */}
      {latestDecision && (
        <div className="glass-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LATEST GOVERNANCE PIPELINE RESULT
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0b1a30', margin: '2px 0 0' }}>
                Pipeline Execution: Agent → Evidence → Policy → ML Anomaly → Risk → Decision
              </h2>
            </div>
            <div style={{
              background: dStyle.bg,
              color: dStyle.color,
              border: `1.5px solid ${dStyle.border}`,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              {latestDecision.decision === 'ALLOW' && <CheckCircle2 size={16} />}
              {latestDecision.decision === 'BLOCK' && <XCircle size={16} />}
              {latestDecision.decision === 'HUMAN_REVIEW' && <AlertTriangle size={16} />}
              {latestDecision.decision}
            </div>
          </div>

          {/* Explicit 'Why?' Summary Banner (Section 15 Rule) */}
          <div style={{
            background: dStyle.bg,
            border: `1px solid ${dStyle.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: dStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Explicit Why? Explanation
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0b1a30', lineHeight: 1.5 }}>
              {latestDecision.reason}
            </div>
          </div>

          {/* 6-Step Pipeline Diagram */}
          {(() => {
            const isEvidenceValid = latestDecision?.verification?.verified ?? latestDecision?.evidence_verified ?? latestDecision?.evidence?.valid ?? true;
            const evidenceMismatches = latestDecision?.verification?.contradictions || latestDecision?.evidence?.details?.mismatches || [];
            const isPolicyPassed = latestDecision?.policy?.policy_pass ?? latestDecision?.policy_passed ?? latestDecision?.policy?.passed ?? true;
            const policyRuleDesc = latestDecision?.policy?.violations?.[0] || latestDecision?.policy?.violations?.[0]?.rule || (isPolicyPassed ? 'Within ₹5k boundary' : 'Policy limit exceeded');
            const mlScore = latestDecision?.ml_anomaly?.anomaly_score ?? latestDecision?.ml_anomaly?.score ?? latestDecision?.ml_anomaly_score ?? 15;
            const isAnomaly = latestDecision?.ml_anomaly?.is_anomaly ?? latestDecision?.ml_is_anomaly ?? false;
            const mlExplanation = latestDecision?.ml_anomaly?.explanation ?? latestDecision?.ml_explanation ?? 'IsolationForest baseline';
            const riskScore = latestDecision?.risk?.overall ?? latestDecision?.risk?.score ?? latestDecision?.risk_overall ?? 20;
            const riskLevel = latestDecision?.risk?.level ?? latestDecision?.risk_level ?? 'LOW';
            const displayAmount = latestDecision?.amount ?? latestDecision?.parameters?.amount;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, alignItems: 'stretch' }}>
                {/* Step 1: Agent & Action */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 10px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>1. Agent & Action</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1a30', marginTop: 4 }}>{latestDecision.customer || latestDecision.agent_id || 'demo-agent-01'}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{latestDecision.action || 'customer_refund'}</div>
                  {displayAmount != null && (
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                      ₹{Number(displayAmount).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Step 2: Evidence Verification */}
                <div style={{
                  background: isEvidenceValid ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${isEvidenceValid ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 8, padding: '12px 10px'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>2. Evidence</div>
                  <div style={{
                    fontSize: 12, fontWeight: 800,
                    color: isEvidenceValid ? '#059669' : '#dc2626',
                    marginTop: 4
                  }}>
                    {isEvidenceValid ? '✓ VERIFIED' : '✗ MISMATCH'}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    {evidenceMismatches.length > 0 ? evidenceMismatches[0] : 'Claims match state'}
                  </div>
                </div>

                {/* Step 3: Policy Engine */}
                <div style={{
                  background: isPolicyPassed ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${isPolicyPassed ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: 8, padding: '12px 10px'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>3. Policy</div>
                  <div style={{
                    fontSize: 12, fontWeight: 800,
                    color: isPolicyPassed ? '#059669' : '#d97706',
                    marginTop: 4
                  }}>
                    {isPolicyPassed ? '✓ PASSED' : '⚠ VIOLATION'}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    {policyRuleDesc}
                  </div>
                </div>

                {/* Step 4: ML Anomaly Signal */}
                <div style={{
                  background: isAnomaly ? '#fef2f2' : '#f8fbff',
                  border: `1px solid ${isAnomaly ? '#fecaca' : '#bfdbfe'}`,
                  borderRadius: 8, padding: '12px 10px'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>4. ML Anomaly</div>
                  <div style={{
                    fontSize: 12, fontWeight: 800,
                    color: isAnomaly ? '#dc2626' : '#2563eb',
                    marginTop: 4
                  }}>
                    {mlScore}/100 {isAnomaly ? 'ANOMALY' : 'NORMAL'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                    {mlExplanation}
                  </div>
                </div>

                {/* Step 5: Risk Engine */}
                <div style={{
                  background: riskScore >= 70 ? '#fef2f2' : riskScore >= 40 ? '#fffbeb' : '#f0fdf4',
                  border: `1px solid ${riskScore >= 70 ? '#fecaca' : riskScore >= 40 ? '#fde68a' : '#bbf7d0'}`,
                  borderRadius: 8, padding: '12px 10px'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>5. Risk Engine</div>
                  <div style={{
                    fontSize: 12, fontWeight: 800,
                    color: riskScore >= 70 ? '#dc2626' : riskScore >= 40 ? '#d97706' : '#059669',
                    marginTop: 4
                  }}>
                    {riskScore}/100 {riskLevel}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                    Deterministic + ML
                  </div>
                </div>

                {/* Step 6: Decision Gate */}
                <div style={{
                  background: dStyle.bg,
                  border: `1.5px solid ${dStyle.border}`,
                  borderRadius: 8, padding: '12px 10px'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>6. Decision Gate</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: dStyle.color, marginTop: 4 }}>
                    {latestDecision.decision}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                    {latestDecision.decision === 'ALLOW' ? 'Safe to execute' : latestDecision.decision === 'HUMAN_REVIEW' ? 'Checkpoint created' : 'Action blocked'}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Compact Live Activity Table (SQLite Authoritative Workflows) ── */}
      <div className="glass-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0b1a30', margin: 0 }}>
              Recent Authoritative Governance Records
            </h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Authoritative runtime records stored in SQLite database.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              SHA-256 Audit: <strong style={{ color: auditIntegrity.valid ? '#059669' : '#dc2626' }}>{auditIntegrity.valid ? 'Verified' : 'Invalid'}</strong>
            </span>
            <button
              onClick={() => setActivePage('governance')}
              className="btn-ghost"
              style={{ fontSize: 11.5, padding: '4px 8px' }}
            >
              Deep View <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {workflows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', fontSize: 13 }}>
            No workflows evaluated yet. Click a scenario above to test the governance engine.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>WORKFLOW ID</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>CUSTOMER / OBJECTIVE</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>AMOUNT</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>RISK SCORE</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>DECISION</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>REASON (EXPLAINABILITY)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {workflows.slice(0, 8).map(wf => {
                  const bStyle = decisionBadgeStyle(wf.decision || wf.status);
                  const wRisk = wf.risk_overall ?? wf.risk?.overall ?? 0;
                  return (
                    <tr key={wf.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                        {wf.id}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#0b1a30' }}>{wf.customer || wf.agent_id || 'demo-agent-01'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{wf.objective || wf.action || 'Customer Refund'}</div>
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0b1a30' }}>
                        ₹{Number(wf.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: wRisk >= 70 ? '#dc2626' : wRisk >= 40 ? '#d97706' : '#059669'
                        }}>
                          {wRisk}/100
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: bStyle.bg,
                          color: bStyle.color,
                          border: `1px solid ${bStyle.border}`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 10.5,
                          fontWeight: 800
                        }}>
                          {wf.decision || wf.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#475569', fontSize: 12, maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {wf.decision_reason || wf.current_step || 'Evaluated against policy'}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
                        {wf.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
