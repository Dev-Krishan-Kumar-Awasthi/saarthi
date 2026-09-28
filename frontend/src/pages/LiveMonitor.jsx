import React, { useRef, useEffect } from 'react';
import {
  Activity, Play, Pause, StopCircle, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, Cpu, Shield, Target
} from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const actorColor = { AGENT: '#3b82f6', SAARTHI: '#06b6d4', HUMAN: '#f59e0b' };
const stepStatusColor = {
  COMPLETED: '#10b981', WARNING: '#f59e0b', FAILED: '#ef4444',
  HUMAN_REVIEW: '#f59e0b', ALLOW: '#10b981', BLOCK: '#ef4444', RETRY: '#06b6d4',
};

const PIPELINE_STAGES = [
  { id: 'agent', name: 'AGENT', icon: Cpu },
  { id: 'observe', name: 'OBSERVE', icon: Activity },
  { id: 'verify', name: 'VERIFY', icon: CheckCircle2 },
  { id: 'policy', name: 'POLICY', icon: Shield },
  { id: 'risk', name: 'RISK', icon: AlertTriangle },
  { id: 'gate', name: 'GATE', icon: Target },
  { id: 'audit', name: 'AUDIT', icon: CheckCircle2 },
  { id: 'action', name: 'ACTION', icon: ChevronRight },
];

function getPipelineStageStatus(stageIdx, currentStep, decision) {
  if (currentStep < 0) return 'pending';
  // Map live steps to pipeline stages
  const stepToPipeline = [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6];
  const activePipeline = stepToPipeline[Math.min(currentStep, stepToPipeline.length - 1)];
  if (stageIdx < activePipeline) return decision === 'BLOCK' && stageIdx >= 3 ? 'failed' : 'passed';
  if (stageIdx === activePipeline) return 'active';
  return 'pending';
}

export default function LiveMonitor() {
  const { liveWorkflow, liveStep, liveRunning, livePaused, startLiveWorkflow, pauseLive, resumeLive, stopLive } = useSaarthiStore();
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [liveWorkflow?.activeSteps?.length]);

  const isRunning = liveRunning || livePaused;

  return (
    <div style={{ maxWidth: 1400, color: '#0b1a30' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a30' }}>Live Monitor</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            Real-time autonomous workflow observability
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isRunning && (
            <button className="btn-primary" onClick={() => startLiveWorkflow('policy_violation')}>
              <Play size={13} /> Start Live Demo
            </button>
          )}
          {liveRunning && (
            <button className="btn-warning" onClick={pauseLive}>
              <Pause size={13} /> Pause
            </button>
          )}
          {livePaused && (
            <button className="btn-primary" onClick={resumeLive}>
              <Play size={13} /> Resume
            </button>
          )}
          {isRunning && (
            <button className="btn-danger" onClick={stopLive}>
              <StopCircle size={13} /> Stop
            </button>
          )}
        </div>
      </div>

      {!liveWorkflow ? (
        <EmptyMonitor onStart={() => startLiveWorkflow('policy_violation')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Objective Banner */}
          <div className="glass-card-bright" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>LIVE AUTONOMOUS WORKFLOW</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0b1a30' }}>{liveWorkflow.objective}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>STATUS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {liveRunning && <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />}
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: liveWorkflow.status === 'PAUSED' ? '#d97706' : '#059669' }}>
                      {liveWorkflow.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>PROGRESS</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#06b6d4' }}>
                    {liveStep + 1} / {liveWorkflow.steps.length} steps
                  </div>
                </div>
                {liveWorkflow.risk && (
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>RISK</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: liveWorkflow.risk.overall >= 70 ? '#ef4444' : '#f59e0b' }}>
                      {liveWorkflow.risk.overall}/100 {liveWorkflow.risk.level}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Governance Pipeline */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 12 }}>GOVERNANCE PIPELINE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {PIPELINE_STAGES.map((stage, i) => {
                const status = getPipelineStageStatus(i, liveStep, liveWorkflow.decision);
                const Icon = stage.icon;
                return (
                  <React.Fragment key={stage.id}>
                    <div className={`pipeline-stage ${status}`} style={{
                      flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 7,
                      border: '1px solid', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <Icon size={12} />
                      {stage.name}
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div style={{ color: '#1e3a5f', fontSize: 18, fontWeight: 300 }}>›</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Decision result */}
            {liveWorkflow.decision && (
              <div style={{ marginTop: 14, padding: '10px 16px', borderRadius: 8, textAlign: 'center',
                background: liveWorkflow.decision === 'ALLOW' ? 'rgba(16,185,129,0.1)' : liveWorkflow.decision === 'BLOCK' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${liveWorkflow.decision === 'ALLOW' ? 'rgba(16,185,129,0.3)' : liveWorkflow.decision === 'BLOCK' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: liveWorkflow.decision === 'ALLOW' ? '#10b981' : liveWorkflow.decision === 'BLOCK' ? '#ef4444' : '#f59e0b' }}>
                  Decision Gate → {liveWorkflow.decision}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  {liveWorkflow.decision === 'HUMAN_REVIEW' && 'Action paused. Human authorization required. See Human Review queue.'}
                  {liveWorkflow.decision === 'BLOCK' && 'Action blocked by governance engine.'}
                  {liveWorkflow.decision === 'ALLOW' && 'Action approved for autonomous execution.'}
                </div>
              </div>
            )}
          </div>

          {/* Two columns: Feed + Progress */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Agent Activity Feed */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 12 }}>
                AGENT ACTIVITY FEED
              </div>
              <div ref={feedRef} style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {liveWorkflow.activeSteps?.map((step, idx) => (
                  <div key={step.id} className="timeline-item" style={{ marginBottom: 16, animationDelay: `${idx * 0.1}s` }}>
                    <div className="timeline-dot" style={{ borderColor: actorColor[step.actor], background: 'var(--bg-primary)' }} />
                    <div style={{ padding: '10px 14px', background: '#f8fbff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: actorColor[step.actor] }}>{step.actor}</span>
                        <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#0b1a30', fontWeight: 600, marginBottom: 2 }}>{step.name}</div>
                      <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>{step.desc}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: stepStatusColor[step.status] || '#64748b',
                          background: `${stepStatusColor[step.status]}18`, padding: '1px 7px', borderRadius: 10,
                        }}>{step.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!liveWorkflow.activeSteps?.length) && (
                  <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>
                    Waiting for workflow to start...
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Objective Progress */}
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 12 }}>OBJECTIVE PROGRESS</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Process refund request</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
                      {liveStep < 0 ? 0 : Math.round(((liveStep + 1) / liveWorkflow.steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${liveStep < 0 ? 0 : Math.round(((liveStep + 1) / liveWorkflow.steps.length) * 100)}%`,
                      background: 'linear-gradient(90deg, #2563eb, #0284c7)',
                    }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <StatItem label="Completed Steps" value={Math.max(0, liveStep + 1)} />
                  <StatItem label="Total Steps" value={liveWorkflow.steps.length} />
                  <StatItem label="Current Actor" value={liveStep >= 0 ? liveWorkflow.steps[liveStep]?.actor : '—'} />
                  <StatItem label="Next" value={liveStep + 1 < liveWorkflow.steps.length ? liveWorkflow.steps[liveStep + 1]?.name : 'Complete'} />
                </div>
              </div>

              {/* Risk Panel (shows when calculated) */}
              {liveWorkflow.risk && (
                <div className="glass-card" style={{ padding: 16, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 10 }}>RISK ASSESSMENT</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', border: '3px solid #dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fef2f2',
                    }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{liveWorkflow.risk.overall}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>HIGH RISK</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Score: {liveWorkflow.risk.overall}/100</div>
                    </div>
                  </div>
                  <RiskFactor label="Financial Impact" value={85} />
                  <RiskFactor label="Policy Severity" value={90} />
                  <RiskFactor label="Evidence Confidence" value={85} color="#10b981" inverse />
                  <RiskFactor label="Reversibility" value={60} />
                  <RiskFactor label="Anomaly Level" value={82} />
                </div>
              )}

              {/* Anomalies Panel */}
              {liveWorkflow.activeSteps?.some(s => s.status === 'FAILED' || s.status === 'WARNING' || s.status === 'HUMAN_REVIEW') && (
                <div className="glass-card" style={{ padding: 16, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 10 }}>ANOMALIES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {liveWorkflow.activeSteps?.filter(s => s.status !== 'COMPLETED').map(s => (
                      <div key={s.id} style={{ padding: '8px 10px', borderRadius: 7, borderLeft: '3px solid', borderLeftColor: stepStatusColor[s.status] || '#64748b', background: '#fffbeb', fontSize: 12, color: '#0b1a30' }}>
                        <span style={{ fontWeight: 600, color: stepStatusColor[s.status] }}>⚠ {s.name}: </span>{s.desc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyMonitor({ onStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: '#64748b' }}>
      <Activity size={48} style={{ opacity: 0.3 }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0b1a30' }}>No active workflow</div>
      <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 400 }}>
        Start a live demo to watch SAARTHI govern every consequential decision in real time.
      </div>
      <button className="btn-primary" onClick={onStart} style={{ marginTop: 8 }}>
        <Play size={14} /> Start Live Demo
      </button>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ padding: '8px 10px', background: '#f8fbff', border: '1px solid #e2e8f0', borderRadius: 7 }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, color: '#0b1a30', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function RiskFactor({ label, value, color, inverse }) {
  const barColor = inverse ? '#10b981' : value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(30,58,95,0.5)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value}%`, background: barColor, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}
