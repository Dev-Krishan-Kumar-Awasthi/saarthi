import React, { useState } from 'react';
import { Users, AlertTriangle, CheckCircle2, X, Edit3, Clock } from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const riskColor = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };
const statusColor = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', MODIFIED: '#3b82f6', APPROVEDD: '#10b981', REJECTEDD: '#ef4444' };

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function HumanReview() {
  const { humanReviews, humanDecide } = useSaarthiStore();
  const [selected, setSelected] = useState(null);
  const [modifyAmount, setModifyAmount] = useState('');
  const [loading, setLoading] = useState(null);

  const pending = humanReviews.filter(r => r.status === 'PENDING');
  const decided = humanReviews.filter(r => r.status !== 'PENDING');

  const handleDecide = async (reviewId, action, amount = null) => {
    setLoading(action);
    await humanDecide(reviewId, action, amount ? parseFloat(amount) : null);
    setLoading(null);
    setSelected(null);
    setModifyAmount('');
  };

  return (
    <div style={{ maxWidth: 1200, color: '#0b1a30' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a30' }}>Human Review Queue</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
          Actions paused by SAARTHI requiring human authorization
        </p>
      </div>

      {/* Queue Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Pending Review" value={pending.length} color="#d97706" />
        <StatCard label="Approved" value={humanReviews.filter(r => r.decision === 'APPROVE' || r.decision === 'APPROVED').length} color="#059669" />
        <StatCard label="Rejected" value={humanReviews.filter(r => r.decision === 'REJECT' || r.decision === 'REJECTED').length} color="#dc2626" />
        <StatCard label="Modified" value={humanReviews.filter(r => r.decision === 'MODIFY' || r.decision === 'MODIFIED').length} color="#2563eb" />
      </div>

      {/* Context Banner */}
      <div style={{ padding: '14px 20px', marginBottom: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>
        <strong style={{ color: '#1d4ed8' }}>SAARTHI Decision:</strong> The governance engine paused these actions because they exceed defined autonomous boundaries.
        Human reviewers can <span style={{ color: '#059669', fontWeight: 700 }}>Approve</span>, <span style={{ color: '#dc2626', fontWeight: 700 }}>Reject</span>, or <span style={{ color: '#2563eb', fontWeight: 700 }}>Modify</span> each proposed action.
        Every decision is recorded in the immutable audit trail.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 480px' : '1fr', gap: 16 }}>
        {/* Review Queue */}
        <div>
          {pending.length === 0 && (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#4a5568' }}>
              <CheckCircle2 size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px', color: '#10b981' }} />
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>No pending reviews</div>
              <div style={{ fontSize: 12 }}>Run a scenario that results in HUMAN_REVIEW to populate this queue.</div>
            </div>
          )}

          {pending.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 10 }}>
                ⚠ PENDING REVIEW ({pending.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(rev => (
                  <ReviewCard key={rev.id} review={rev} onReview={() => setSelected(rev)} isSelected={selected?.id === rev.id} />
                ))}
              </div>
            </div>
          )}

          {decided.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 10 }}>
                DECIDED ({decided.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {decided.map(rev => (
                  <ReviewCard key={rev.id} review={rev} decided />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Panel */}
        {selected && (
          <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 0, height: 'fit-content', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.08em' }}>REVIEW PANEL</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginTop: 2 }}>{selected.id}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={14} /></button>
            </div>

            {/* Context */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                ['Customer', selected.customer],
                ['Order', selected.order_id],
                ['Requested Amount', `₹${selected.amount}`],
                ['Risk Score', `${selected.risk?.overall ?? '—'}/100 ${selected.risk?.level ?? ''}`],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 10px', background: 'rgba(13,22,48,0.5)', borderRadius: 7 }}>
                  <div style={{ fontSize: 9.5, color: '#4a5568', fontWeight: 600, marginBottom: 2 }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize: 12.5, color: '#e2e8f0', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* SAARTHI Findings */}
            <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>SAARTHI FINDINGS</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>{selected.reason}</div>
            </div>

            {/* Risk Visual */}
            <div style={{ marginBottom: 16, padding: 12, background: 'rgba(13,22,48,0.5)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Risk Score</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: riskColor[selected.risk?.level] || '#f59e0b' }}>
                  {selected.risk?.overall}/100 {selected.risk?.level}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${selected.risk?.overall || 0}%`,
                  background: riskColor[selected.risk?.level] || '#f59e0b',
                }} />
              </div>
            </div>

            {/* Audit ID */}
            <div style={{ marginBottom: 16, fontSize: 11, color: '#4a5568' }}>
              Audit Trail ID will be generated on decision · Linked to workflow {selected.workflow_id}
            </div>

            {/* Decision Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  className="btn-success"
                  onClick={() => handleDecide(selected.id, 'approve')}
                  disabled={loading !== null}
                  style={{ justifyContent: 'center' }}
                >
                  <CheckCircle2 size={13} />
                  {loading === 'approve' ? 'Approving...' : 'APPROVE'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDecide(selected.id, 'reject')}
                  disabled={loading !== null}
                  style={{ justifyContent: 'center' }}
                >
                  <X size={13} />
                  {loading === 'reject' ? 'Rejecting...' : 'REJECT'}
                </button>
              </div>

              {/* Modify */}
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: '#3b82f6', fontWeight: 700, marginBottom: 8 }}>
                  <Edit3 size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  MODIFY AMOUNT
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13 }}>₹</span>
                    <input
                      type="number"
                      value={modifyAmount}
                      onChange={e => setModifyAmount(e.target.value)}
                      placeholder="5000"
                      style={{
                        width: '100%', padding: '8px 10px 8px 22px',
                        background: '#ffffff', border: '1px solid #cbd5e1',
                        borderRadius: 6, color: '#0b1a30', fontSize: 13, outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleDecide(selected.id, 'modify', modifyAmount || 5000)}
                    disabled={loading !== null}
                    style={{ flexShrink: 0 }}
                  >
                    {loading === 'modify' ? 'Modifying...' : 'MODIFY'}
                  </button>
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 6 }}>
                  Suggested: ₹5,000 (within autonomous limit) — governance will re-evaluate modified amount
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, onReview, isSelected, decided }) {
  const risk = review.risk?.level || 'MEDIUM';
  const rc = riskColor[risk] || '#f59e0b';
  const sc = statusColor[review.decision || review.status] || '#64748b';

  return (
    <div style={{
      padding: 16, background: isSelected ? '#eff6ff' : '#ffffff',
      border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
      boxShadow: '0 2px 8px rgba(11,26,48,0.03)',
      borderRadius: 10, opacity: decided ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <code style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>{review.id}</code>
            <span style={{ fontSize: 10, fontWeight: 700, color: rc, background: `${rc}18`, padding: '1px 7px', borderRadius: 10 }}>
              {risk} RISK
            </span>
            {!decided && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d97706', fontWeight: 600 }}>
                <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                PENDING
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30' }}>
            Refund ₹{review.amount} — {review.customer}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{review.order_id}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {decided ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: sc, background: `${sc}18`, padding: '3px 10px', borderRadius: 10 }}>
              {review.decision || review.status}
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#4a5568' }}>
              <Clock size={10} /> {timeAgo(review.created_at)}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, marginBottom: decided ? 0 : 12 }}>
        {review.reason}
      </div>

      {!decided && (
        <button onClick={onReview} className="btn-warning" style={{ fontSize: 12, padding: '6px 14px' }}>
          <Users size={12} /> Review Action
        </button>
      )}

      {decided && review.modified_amount && (
        <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 6 }}>
          Modified to: ₹{review.modified_amount}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="metric-card">
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  );
}
