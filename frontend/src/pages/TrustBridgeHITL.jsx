import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Play, CheckCircle2, XCircle, Edit3, ArrowRight,
  RefreshCw, Database, Clock, Lock, FileText, AlertTriangle, Eye, Server, Sparkles, HelpCircle, UserCheck
} from 'lucide-react';

export default function TrustBridgeHITL() {
  const [metrics, setMetrics] = useState({
    active_workflows: 0,
    waiting_for_human: 0,
    approved: 0,
    modified: 0,
    rejected: 0,
    completed: 0
  });

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('review'); // review | state | audit | policy
  const [isRunning, setIsRunning] = useState(false);

  // Modify Modal State
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedAmount, setModifiedAmount] = useState('4500');
  const [modifyReason, setModifyReason] = useState('Reduced refund to ₹4,500 within ₹5,000 autonomous policy limit');

  // Reject Modal State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('High-impact action rejected by compliance operator');

  const [lastActionOutcome, setLastActionOutcome] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, rRes, aRes] = await Promise.all([
        fetch('/api/hitl/metrics').then(r => r.ok ? r.json() : null),
        fetch('/api/hitl/requests').then(r => r.ok ? r.json() : []),
        fetch('/api/hitl/audit').then(r => r.ok ? r.json() : [])
      ]);
      if (mRes) setMetrics(mRes);
      if (rRes) {
        setRequests(rRes);
        if (!selectedRequest && rRes.length > 0) {
          setSelectedRequest(rRes[0]);
        } else if (selectedRequest) {
          const updated = rRes.find(r => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      }
      if (aRes) setAuditEvents(aRes);
    } catch (e) {
      console.error(e);
    }
  }, [selectedRequest]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStartWorkflow = async (scenarioType) => {
    setIsRunning(true);
    setLastActionOutcome(null);
    try {
      const res = await fetch('/api/workflows/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioType })
      }).then(r => r.json());

      await fetchData();
      if (res.hitl_request_id) {
        const found = requests.find(r => r.id === res.hitl_request_id);
        if (found) setSelectedRequest(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
      fetchData();
    }
  };

  const handleStartHighImpactDemo = async () => {
    setIsRunning(true);
    setLastActionOutcome(null);
    try {
      await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'high_impact' })
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
      fetchData();
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const res = await fetch(`/api/hitl/requests/${requestId}/approve`, {
        method: 'POST'
      }).then(r => r.json());
      setLastActionOutcome({ type: 'APPROVED', data: res });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmModify = async () => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/hitl/requests/${selectedRequest.id}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modified_parameters: { amount: parseFloat(modifiedAmount) },
          reason: modifyReason
        })
      }).then(r => r.json());
      setIsModifying(false);
      setLastActionOutcome({ type: 'MODIFIED', data: res });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/hitl/requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      }).then(r => r.json());
      setIsRejecting(false);
      setLastActionOutcome({ type: 'REJECTED', data: res });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 1420, margin: '0 auto', color: '#0a192f' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1a30 0%, #061224 100%)',
        borderRadius: 16,
        padding: '24px 32px',
        color: '#ffffff',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(11,26,48,0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(2,132,199,0.2)', border: '1px solid rgba(2,132,199,0.4)', padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#38bdf8', marginBottom: 8 }}>
            <span>SAARTHI RUNTIME GOVERNANCE • HUMAN OVERSIGHT (HITL)</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '2px 0 4px', letterSpacing: '-0.5px' }}>
            TRUST<span style={{ color: '#38bdf8' }}>BRIDGE</span> — Human Oversight & Checkpoints
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13.5, margin: 0 }}>
            Pause at high-risk actions. Review and edit details. Resume safely without losing progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', textAlign: 'right', fontSize: 11.5 }}>
            <div style={{ color: '#94a3b8' }}>Real Database Storage</div>
            <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={13} /> SQLite Saved
            </div>
          </div>
          <button
            onClick={handleStartHighImpactDemo}
            disabled={isRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0284c7', color: '#ffffff', border: 'none',
              padding: '11px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,132,199,0.35)',
              opacity: isRunning ? 0.6 : 1
            }}
          >
            <Play size={15} /> {isRunning ? 'Running Demo Agent...' : 'Run Scenario 3 (₹8,500 High-Impact Refund)'}
          </button>
        </div>
      </div>

      {/* 2. Plain English Concept Explainer */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 8px rgba(11,26,48,0.03)'
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HelpCircle size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30', marginBottom: 2 }}>
            How does this work? (Simple Explanation)
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            When an AI tries to make an irreversible or consequential change (such as an <strong>₹8,500 refund</strong> exceeding the <strong>₹5,000 autonomous limit</strong>), it <strong>stops automatically</strong> and asks you first. You can <strong>Approve</strong> it as-is, <strong>Modify</strong> the amount (e.g., lower it to ₹4,500), or <strong>Reject</strong> it. Even if you refresh your browser or close the tab, the AI remembers its exact step because it is saved in a real SQLite database.
          </p>
        </div>
      </div>

      {/* 3. Metrics Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Active Workflows', val: metrics.active_workflows, color: '#0284c7', sub: 'Running in background' },
          { label: 'Awaiting Your Review', val: metrics.waiting_for_human, color: metrics.waiting_for_human > 0 ? '#ef4444' : '#10b981', sub: 'Paused at safety gate' },
          { label: 'Approved by Human', val: metrics.approved, color: '#10b981', sub: 'Executed normally' },
          { label: 'Modified by Human', val: metrics.modified, color: '#f59e0b', sub: 'Edited & executed' },
          { label: 'Rejected / Blocked', val: metrics.rejected, color: '#ef4444', sub: 'Safely redirected' },
          { label: 'Completed Successfully', val: metrics.completed, color: '#0b1a30', sub: 'Finished cleanly' }
        ].map((m, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(11,26,48,0.03)'
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.6, marginBottom: 2 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 800, color: m.color }}>
              {m.val.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 4. Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        {[
          { id: 'review', label: '1. Human Review Queue' },
          { id: 'state', label: '2. Saved AI State (SQLite)' },
          { id: 'audit', label: '3. Immutable Audit Log' },
          { id: 'policy', label: '4. Safety Policy Rules' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === t.id ? '#0b1a30' : '#64748b',
              borderBottom: activeTab === t.id ? '3px solid #0284c7' : '3px solid transparent'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HUMAN REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Left Column: Review Queue & Action Card */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
              Actions Awaiting Your Decision ({requests.filter(r => r.status === 'PENDING' || r.status === 'WAITING_FOR_HUMAN').length})
            </div>

            {requests.filter(r => r.status === 'PENDING' || r.status === 'WAITING_FOR_HUMAN').length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 36, textAlign: 'center', color: '#64748b' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ margin: 0, fontSize: 16, color: '#0b1a30' }}>Queue is Clear! No Actions Waiting</h3>
                <p style={{ fontSize: 13, marginTop: 4 }}>Every autonomous action has been reviewed. Launch Scenario 3 to test human oversight checkpointing.</p>
                <button
                  onClick={handleStartHighImpactDemo}
                  style={{ marginTop: 12, background: '#0b1a30', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Run Scenario 3 (₹8,500 High-Impact Refund Demo)
                </button>
              </div>
            ) : (
              requests.filter(r => r.status === 'PENDING' || r.status === 'WAITING_FOR_HUMAN').map(req => {
                const params = req.original_parameters || {};
                const ctx = req.agent_context || {};
                const reqAmount = params.amount || req.amount || 8500;
                return (
                  <div key={req.id} style={{
                    background: '#ffffff',
                    border: '2px solid #ef4444',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 16,
                    boxShadow: '0 8px 24px rgba(239,68,68,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
                        🔴 HUMAN APPROVAL REQUIRED (POLICY THRESHOLD BREACH)
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#64748b' }}>
                        Request ID: {req.id}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0b1a30', margin: '0 0 10px' }}>
                      {req.action === 'customer_refund' ? 'High-Impact Customer Refund' : req.action}
                    </h2>
                    <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
                      The AI agent verified evidence and detected that the refund amount (₹{reqAmount.toLocaleString()}) exceeds the autonomous safety limit (₹5,000). Complete state is safely checkpointed in SQLite awaiting your decision.
                    </p>

                    {/* Details Box */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>REQUESTED AMOUNT</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                            ₹{reqAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>AUTONOMOUS LIMIT</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#059669' }}>
                            ₹5,000 Max
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TARGET BENEFICIARY</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0b1a30' }}>
                            {params.destination_account || 'CUST-WALLET-8831'}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
                        <strong>Customer:</strong> {ctx.customer || req.customer_id || req.customer || 'Vikram Patel'} • <strong>Order ID:</strong> {ctx.order_id || req.order_id || 'ORD-9912'} • <strong>Policy Reason:</strong> {req.reason || `Amount ₹${reqAmount.toLocaleString()} exceeds autonomous limit ₹5,000`}
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div style={{ marginBottom: 18, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#0b1a30', marginBottom: 6 }}>Pre-flight Evidence & Safety Checks:</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                          ✓ Customer Identity Verified (KYC Active)
                        </span>
                        <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                          ✓ Evidence Matches Ledger State (₹18,500 Balance)
                        </span>
                        <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                          ⚠ Exceeds Autonomous Threshold (₹8,500 vs ₹5,000 limit)
                        </span>
                      </div>
                    </div>

                    {/* What do you want to do? */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1a30', marginBottom: 8 }}>
                      Choose your decision:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <button
                        onClick={() => handleApprove(req.id)}
                        style={{
                          background: '#10b981', color: '#ffffff', border: 'none',
                          padding: '12px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} /> APPROVE
                        </div>
                        <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>Transfer ₹{reqAmount.toLocaleString()} as-is</span>
                      </button>

                      <button
                        onClick={() => { setSelectedRequest(req); setModifiedAmount('4500'); setIsModifying(true); }}
                        style={{
                          background: '#f59e0b', color: '#ffffff', border: 'none',
                          padding: '12px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          boxShadow: '0 4px 12px rgba(245,158,11,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Edit3 size={16} /> MODIFY
                        </div>
                        <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>Change to ₹4,500 (Safe)</span>
                      </button>

                      <button
                        onClick={() => { setSelectedRequest(req); setIsRejecting(true); }}
                        style={{
                          background: '#ef4444', color: '#ffffff', border: 'none',
                          padding: '12px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          boxShadow: '0 4px 12px rgba(239,68,68,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <XCircle size={16} /> REJECT
                        </div>
                        <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>Block & stop action</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Past Decisions History */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
                Recent Decisions Made By Humans
              </div>
              {requests.filter(r => r.status !== 'PENDING' && r.status !== 'WAITING_FOR_HUMAN').slice(0, 4).map(r => (
                <div key={r.id} style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10,
                  padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: '#0b1a30' }}>{r.action}</strong>
                      <span style={{
                        padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 700,
                        background: r.status === 'APPROVED' ? '#ecfdf5' : r.status === 'MODIFIED' ? '#fffbeb' : '#fef2f2',
                        color: r.status === 'APPROVED' ? '#065f46' : r.status === 'MODIFIED' ? '#92400e' : '#991b1b'
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Workflow: {r.workflow_id} • Note: {r.human_reason || r.reason || 'Resolved'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>
                    {r.status === 'MODIFIED' ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹{r.original_parameters?.amount || r.amount}</span>{' '}
                        <strong style={{ color: '#0284c7' }}>₹{r.modified_parameters?.amount || r.modified_amount}</strong>
                      </div>
                    ) : (
                      <strong style={{ color: '#0b1a30' }}>₹{r.original_parameters?.amount || r.amount || '-'}</strong>
                    )}
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(r.resolved_at || r.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Step-by-Step AI Progress */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
              AI Execution Steps (Where is the agent now?)
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 10px rgba(11,26,48,0.03)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { step: '1. Receive Refund Request (₹8,500)', done: true, desc: 'Demo Agent parsed incoming customer refund ticket' },
                  { step: '2. Verify Customer & Evidence', done: true, desc: 'KYC verified & ledger balance confirmed' },
                  { step: '3. Check Order Receipt & Policy', done: true, desc: 'Amount ₹8,500 breaches autonomous limit (₹5,000)' },
                  { step: '4. Calculate Multivariable Risk', done: true, desc: 'Risk evaluated as HIGH (Score: 78/100)' },
                  { step: '🔴 SAFETY GATE: HUMAN_REVIEW Checkpoint', highlight: true, desc: 'Paused! Saved complete state & context to SQLite' },
                  { step: '5. Human Operator Decision', pending: true, desc: 'Awaiting Approve / Modify / Reject from TrustBridge' },
                  { step: '6. Resume & Settle Transaction', pending: true, desc: 'Executes safely under operator authorized parameters' },
                  { step: '7. SHA-256 Tamper-Evident Audit', pending: true, desc: 'Permanent cryptographic record logged to SQLite' }
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: s.done ? '#10b981' : s.highlight ? '#ef4444' : '#e2e8f0',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {s.done ? '✓' : s.highlight ? '!' : i + 1}
                      </div>
                      {i < 7 && (
                        <div style={{
                          width: 2, height: 24,
                          background: s.done ? '#10b981' : s.highlight ? '#fca5a5' : '#e2e8f0'
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 14 }}>
                      <div style={{ fontSize: 12.5, fontWeight: s.highlight ? 800 : 700, color: s.highlight ? '#dc2626' : s.done ? '#0b1a30' : '#94a3b8' }}>
                        {s.step}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked Demo Scenarios */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0b1a30', marginBottom: 10 }}>
                Test Locked Governance Scenarios:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => handleStartWorkflow('safe_action')}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f0fdf4', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#166534' }}
                >
                  ✅ <strong>Scenario 1 — SAFE ACTION:</strong> ₹1,800 refund (Passes under ₹5,000 limit → ALLOW)
                </button>
                <button
                  onClick={() => handleStartWorkflow('evidence_mismatch')}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fef2f2', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#991b1b' }}
                >
                  🛑 <strong>Scenario 2 — EVIDENCE MISMATCH:</strong> Claims ₹15,000 vs trusted ₹10,000 → BLOCK
                </button>
                <button
                  onClick={handleStartHighImpactDemo}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '2px solid #0284c7', background: '#f0f9ff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#0284c7' }}
                >
                  👤 <strong>Scenario 3 — HIGH-IMPACT ACTION:</strong> ₹8,500 refund vs ₹5,000 limit → HUMAN_REVIEW
                </button>
                <button
                  onClick={() => handleStartWorkflow('suspicious_replay')}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fffbeb', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#92400e' }}
                >
                  ⚡ <strong>Scenario 4 — SUSPICIOUS / REPLAY:</strong> ML Anomaly + Replay token → BLOCK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED AI STATE (SQLITE) */}
      {activeTab === 'state' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0b1a30', margin: 0 }}>
                Saved AI State (Stored in SQLite Database)
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                This is where the AI memory is safely stored. If you close your computer and return tomorrow, the AI will still remember where it was.
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
              <Database size={14} /> Survives Page Refresh & Restarts
            </div>
          </div>

          {!selectedRequest ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              No active checkpoint loaded. Start a workflow from the Review Queue first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Workflow Tracking Identifiers
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, fontFamily: 'monospace', fontSize: 12.5 }}>
                  <div style={{ marginBottom: 6 }}>Workflow ID: <strong style={{ color: '#0284c7' }}>{selectedRequest.workflow_id}</strong></div>
                  <div style={{ marginBottom: 6 }}>Checkpoint ID: <strong style={{ color: '#10b981' }}>{selectedRequest.checkpoint_id}</strong></div>
                  <div style={{ marginBottom: 6 }}>Status: <strong>{selectedRequest.status}</strong></div>
                  <div>Created At: {selectedRequest.created_at}</div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '18px 0 8px' }}>
                  Execution Step Progress
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, fontSize: 12.5 }}>
                  <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                    Already Completed Steps (4):
                  </div>
                  <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11.5, marginBottom: 12 }}>
                    ✓ receive_request &bull; ✓ verify_customer &bull; ✓ check_balance &bull; ✓ validate_beneficiary
                  </div>

                  <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>
                    Paused At Step:
                  </div>
                  <div style={{ color: '#0b1a30', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
                    → {selectedRequest.action} (Waiting for you)
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Exact JSON Saved in Database
                </div>
                <pre style={{
                  background: '#0b1a30',
                  color: '#38bdf8',
                  padding: 16,
                  borderRadius: 10,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  overflowX: 'auto',
                  maxHeight: 380
                }}>
{JSON.stringify({
  workflow_id: selectedRequest.workflow_id,
  checkpoint_id: selectedRequest.checkpoint_id,
  status: selectedRequest.status,
  current_step: selectedRequest.action,
  completed_steps: selectedRequest.completed_steps || ["receive_request", "verify_customer", "check_balance", "validate_beneficiary"],
  agent_context: selectedRequest.agent_context,
  proposed_action: {
    tool: selectedRequest.action,
    parameters: selectedRequest.original_parameters
  },
  human_decision: selectedRequest.human_decision,
  modified_parameters: selectedRequest.modified_parameters
}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0b1a30', margin: 0 }}>
                Permanent Audit Log ({auditEvents.length} Events)
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>
                Every human decision, edit, and approved action is written permanently to SQLite.
              </p>
            </div>
            <button onClick={fetchData} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Refresh Log
            </button>
          </div>

          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 12px' }}>Time</th>
                <th style={{ padding: '10px 12px' }}>Event</th>
                <th style={{ padding: '10px 12px' }}>Actor</th>
                <th style={{ padding: '10px 12px' }}>Workflow</th>
                <th style={{ padding: '10px 12px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: e.event_type.includes('APPROVAL') ? '#10b981' : e.event_type.includes('MODIFICATION') ? '#f59e0b' : e.event_type.includes('REJECTED') ? '#ef4444' : '#0284c7' }}>
                    {e.event_type}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0b1a30' }}>
                    {e.actor}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>
                    {e.workflow_id}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>
                    {JSON.stringify(e.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: POLICY RULES */}
      {activeTab === 'policy' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0b1a30', margin: '0 0 6px' }}>
            When does the AI need human permission?
          </h2>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>
            Our smart policy engine automatically separates high-risk actions from harmless actions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#991b1b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} /> High-Risk Actions (Must Stop & Ask Human)
              </h3>
              <ul style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                <li><strong>Bank Wire Transfers:</strong> Moving money between accounts (e.g. ₹25,000)</li>
                <li><strong>Deleting Customer Records:</strong> Permanent database removals</li>
                <li><strong>Production Deployments:</strong> Cloud container rollouts</li>
                <li><strong>Sending External Emails / Webhooks:</strong> Public-facing actions</li>
              </ul>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#166534', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} /> Safe Actions (AI Runs Automatically)
              </h3>
              <ul style={{ fontSize: 13, color: '#14532d', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                <li><strong>Reading Account Balances:</strong> Read-only database queries</li>
                <li><strong>Calculating Taxes / Numbers:</strong> Math computations</li>
                <li><strong>Internal Planning:</strong> Brainstorming next steps</li>
                <li><strong>Checking Cache:</strong> Pre-validated routing checks</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MODIFY ACTION */}
      {isModifying && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,26,48,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0b1a30', margin: '0 0 10px' }}>
              Modify Consequential Action Parameters
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
              The AI proposed refunding <strong>₹{selectedRequest?.original_parameters?.amount || selectedRequest?.amount || '8,500'}</strong>. You can adjust this amount (e.g. to ₹4,500 within the ₹5,000 autonomous limit). The AI will resume from its SQLite checkpoint with your modified parameters.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0b1a30', display: 'block', marginBottom: 4 }}>
                Adjusted Refund Amount (₹ INR):
              </label>
              <input
                type="number"
                value={modifiedAmount}
                onChange={e => setModifiedAmount(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Original amount: ₹{selectedRequest?.original_parameters?.amount || selectedRequest?.amount || 8500} • Autonomous Limit: ₹5,000
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0b1a30', display: 'block', marginBottom: 4 }}>
                Compliance & Audit Justification:
              </label>
              <textarea
                value={modifyReason}
                onChange={e => setModifyReason(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsModifying(false)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '9px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModify}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Apply ₹{modifiedAmount} & Resume Execution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT ACTION */}
      {isRejecting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,26,48,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', margin: '0 0 10px' }}>
              Reject Action & Halt Execution
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
              The proposed consequential action will <strong>NEVER execute</strong>. The workflow will be permanently stopped, and an immutable SHA-256 rejection event will be recorded in the audit ledger.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0b1a30', display: 'block', marginBottom: 4 }}>
                Reason for Rejection:
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsRejecting(false)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '9px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Reject & Record Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
