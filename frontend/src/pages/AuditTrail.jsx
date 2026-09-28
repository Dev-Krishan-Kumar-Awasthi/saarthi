import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Eye, X } from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const actorColor = { AGENT: '#3b82f6', SAARTHI: '#06b6d4', HUMAN: '#f59e0b', SYSTEM: '#a78bfa' };
const eventTypeIcon = {
  WORKFLOW_STARTED: '▶',
  ACTION_PROPOSED: '→',
  EVIDENCE_VERIFIED: '✓',
  POLICY_EVALUATED: '📋',
  RISK_CALCULATED: '⚡',
  GOVERNANCE_DECISION: '⚖',
  HUMAN_REVIEW_REQUESTED: '👤',
  HUMAN_APPROVED: '✅',
  HUMAN_REJECTED: '❌',
  HUMAN_MODIFIED: '✏️',
  GOVERNANCE_EVALUATED: '🔍',
};

export default function AuditTrail() {
  const { auditEvents, auditIntegrity, verifyAudit } = useSaarthiStore();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [isVerifying, setIsVerifying] = useState(false);

  const actors = ['ALL', 'AGENT', 'SAARTHI', 'HUMAN'];
  const filtered = filter === 'ALL' ? auditEvents : auditEvents.filter(e => e.actor === filter);

  const handleVerify = async () => {
    setIsVerifying(true);
    await verifyAudit();
    setIsVerifying(false);
  };

  return (
    <div style={{ maxWidth: 1200, color: '#0b1a30' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a30' }}>Audit Trail</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            Tamper-evident audit chain — every governance decision and agent action recorded in SQLite with SHA-256 links
          </p>
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="btn-primary"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isVerifying ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}
        </button>
      </div>

      {/* Chain Integrity Banner */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 16, background: auditIntegrity.valid ? '#ecfdf5' : '#fef2f2', border: `1px solid ${auditIntegrity.valid ? '#a7f3d0' : '#fecaca'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} style={{ color: auditIntegrity.valid ? '#059669' : '#dc2626' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: auditIntegrity.valid ? '#059669' : '#dc2626' }}>
                TAMPER-EVIDENT AUDIT CHAIN — {auditIntegrity.valid ? 'INTEGRITY VERIFIED' : 'INTEGRITY VIOLATION'}
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                {auditEvents.length} events · SHA-256 hash chain · Each event cryptographically verifies predecessor
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ChainStat label="Total Events" value={auditEvents.length} />
            <ChainStat label="Chain Status" value={auditIntegrity.valid ? 'VALID' : 'BROKEN'} color={auditIntegrity.valid ? '#059669' : '#dc2626'} />
            {auditIntegrity.broken_at && <ChainStat label="Broken At" value={auditIntegrity.broken_at} color="#dc2626" />}
          </div>
        </div>
      </div>

      {/* Hash Chain Explanation */}
      <div className="glass-card" style={{ padding: 14, marginBottom: 16, border: '1px solid #bfdbfe', background: '#f8fbff' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>HOW THE AUDIT CHAIN WORKS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['GENESIS', 'EVT-0001', 'EVT-0002', 'EVT-0003', '...', `EVT-${String(auditEvents.length).padStart(4,'0')}`].map((node, i, arr) => (
            <React.Fragment key={node}>
              <div style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
                background: node === 'GENESIS' ? '#eff6ff' : '#ffffff',
                border: `1px solid ${node === 'GENESIS' ? '#bfdbfe' : '#e2e8f0'}`,
                color: node === 'GENESIS' ? '#1d4ed8' : '#334155',
                fontWeight: 600,
              }}>{node}</div>
              {i < arr.length - 1 && <span style={{ color: '#94a3b8', fontSize: 16 }}>→</span>}
            </React.Fragment>
          ))}
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>· Modifying any event breaks all subsequent hashes</span>
        </div>
      </div>

      {/* Filter + Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {actors.map(a => (
              <button key={a} onClick={() => setFilter(a)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: filter === a ? '#0b1a30' : '#ffffff',
                border: `1px solid ${filter === a ? '#0b1a30' : '#e2e8f0'}`,
                color: filter === a ? '#ffffff' : '#64748b',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: filter === a ? '0 2px 6px rgba(11,26,48,0.15)' : 'none',
              }}>{a}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#64748b', alignSelf: 'center' }}>
              {filtered.length} events
            </span>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((ev, idx) => (
              <div key={ev.id} className="timeline-item" style={{ marginBottom: 14, animationDelay: `${idx * 0.02}s` }}>
                <div className="timeline-dot" style={{ borderColor: actorColor[ev.actor] || '#2563eb', background: 'var(--bg-primary)' }} />
                <div
                  onClick={() => setSelected(ev)}
                  style={{
                    padding: '12px 16px', background: selected?.id === ev.id ? '#eff6ff' : '#ffffff',
                    border: `1px solid ${selected?.id === ev.id ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: 8, cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(11,26,48,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (selected?.id !== ev.id) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={e => { if (selected?.id !== ev.id) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>{ev.id}</code>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: actorColor[ev.actor], background: `${actorColor[ev.actor]}18`, padding: '1px 7px', borderRadius: 10 }}>{ev.actor}</span>
                      <span style={{ fontSize: 12, color: '#0b1a30', fontWeight: 600 }}>
                        {eventTypeIcon[ev.event_type] || '·'} {ev.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>✓ {ev.integrity}</span>
                      <Eye size={12} style={{ color: '#94a3b8' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.current_hash}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Detail */}
        <div>
          {selected ? (
            <div className="glass-card" style={{ padding: 18, position: 'sticky', top: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30' }}>Event Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={14} /></button>
              </div>

              <DetailRow label="Event ID" value={selected.id} mono />
              <DetailRow label="Timestamp" value={new Date(selected.timestamp).toLocaleString()} />
              <DetailRow label="Actor" value={selected.actor} color={actorColor[selected.actor]} />
              <DetailRow label="Event Type" value={selected.event_type} />
              <DetailRow label="Integrity" value={`✓ ${selected.integrity}`} color="#059669" />

              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5 }}>PAYLOAD</div>
                <pre style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 7, padding: 10, fontSize: 10.5, color: '#0b1a30',
                  overflow: 'auto', maxHeight: 150, fontFamily: 'monospace', lineHeight: 1.5,
                }}>{JSON.stringify(selected.payload, null, 2)}</pre>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>PREV HASH</div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>{selected.previous_hash}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>CURRENT HASH</div>
                <div style={{ fontSize: 10, color: '#059669', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>{selected.current_hash}</div>
              </div>

              <div style={{ marginTop: 12, padding: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 7, fontSize: 11.5, color: '#065f46', lineHeight: 1.5 }}>
                This event's hash was computed from its content and the previous event's hash. Altering any field would invalidate all subsequent events in the chain.
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ color: '#64748b', fontSize: 12.5, textAlign: 'center', padding: '24px 0' }}>
                <FileText size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                Click any event to inspect its full detail, hash chain linkage, and payload.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChainStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: color || '#0b1a30' }}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, color }) {
  return (
    <div style={{ marginBottom: 9, paddingBottom: 9, borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 12.5, color: color || '#0b1a30', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>{value}</div>
    </div>
  );
}
