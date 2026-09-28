import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Zap, Activity, Sliders, AlertTriangle, RefreshCw, Download, Play, Square, CheckCircle2
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'runaway_agent',
    name: 'RUNAWAY AGENT (Tool Failure Cascade)',
    badge: 'Circuit Trip',
    badgeType: 'badge-red',
    desc: 'Simulates demo agent repeatedly executing failing tool calls without recovery.',
    trigger: 'Breaks at 4 consecutive tool failures',
    expected: 'Failure 1 → Failure 2 → Failure 3 → Failure 4 → CIRCUIT OPEN → AGENT HALTED',
    icon: '🚨'
  },
  {
    id: 'safe',
    name: 'Safe Multi-Step Execution',
    badge: 'Normal Flow',
    badgeType: 'badge-green',
    desc: 'Autonomous research workflow completing sub-tasks safely within token and failure boundaries.',
    trigger: 'None - Circuit stays CLOSED and healthy',
    expected: 'Success in 3 iterations, 1,200 tokens, 0 failures',
    icon: '✅'
  },
  {
    id: 'token_exhaustion',
    name: 'Token Budget Exhaustion',
    badge: 'Breaker Trip',
    badgeType: 'badge-red',
    desc: 'Simulates prompt explosion or massive uncontrolled retrieval responses.',
    trigger: 'Breaks when token usage exceeds configured budget (4,000 tokens)',
    expected: 'Circuit trips OPEN before budget overrun -> Agent halts safely',
    icon: '📈'
  },
  {
    id: 'infinite_loop',
    name: 'Autonomous Infinite Loop',
    badge: 'Breaker Trip',
    badgeType: 'badge-red',
    desc: 'Planner gets stuck re-evaluating the same inconclusive tool observation repeatedly.',
    trigger: 'Breaks when iteration count reaches max allowed (10 iterations)',
    expected: 'Halt on MAX_LOOP_ITERATIONS -> Prevents runaway cost',
    icon: '🔄'
  }
];

export default function CircuitBreaker() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [selectedScenario, setSelectedScenario] = useState('runaway_agent');
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [cbState, setCbState] = useState(null);
  const [events, setEvents] = useState([]);
  const [traces, setTraces] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [alertHalt, setAlertHalt] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [terminalTheme, setTerminalTheme] = useState('light');

  const [config, setConfig] = useState({
    max_consecutive_failures: 4,
    max_tokens: 4000,
    max_iterations: 10
  });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, mRes, cbRes, evRes] = await Promise.all([
        fetch('/api/agent/status').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/agent/metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/circuit-breaker').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/agent/events?limit=60').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      if (sRes) setStatus(sRes);
      if (mRes) setMetrics(mRes);
      if (cbRes) {
        setCbState(cbRes);
        if (cbRes.config) setConfig(cbRes.config);
        if (cbRes.state === 'HALTED' || cbRes.state === 'OPEN') {
          setAlertHalt({
            reason: cbRes.trigger_reason,
            triggered_at: cbRes.triggered_at,
            triggered_node: cbRes.triggered_node,
            triggered_iteration: cbRes.triggered_iteration,
            token_usage: cbRes.token_usage,
            failure_count: cbRes.failure_count,
            iteration_count: cbRes.iteration_count,
            trace_id: sRes?.trace_id
          });
        }
      }
      if (evRes) setEvents(evRes);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 1200);
    return () => clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'traces') {
      fetch('/api/traces')
        .then(r => r.ok ? r.json() : [])
        .then(setTraces)
        .catch(() => {});
    }
  }, [activeTab]);

  const handleRunScenario = async (scenarioToRun) => {
    const scId = scenarioToRun || selectedScenario;
    if (scenarioToRun) {
      setSelectedScenario(scenarioToRun);
    }
    setIsRunning(true);
    setAlertHalt(null);
    try {
      const res = await fetch(`/api/scenarios/${scId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).then(r => r.json());

      await fetchData();
      if (res?.status === 'HALTED' || res?.halt_reason) {
        if (res?.trace_id) {
          const detail = await fetch(`/api/traces/${res.trace_id}`).then(r => r.ok ? r.json() : null).catch(() => null);
          if (detail?.halt_trace) {
            setAlertHalt(detail.halt_trace);
          } else {
            setAlertHalt({
              reason: res.halt_reason,
              trace_id: res.trace_id,
              triggered_iteration: res.iterations,
              token_usage: res.tokens_used,
              failure_count: res.failed_calls,
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
      fetchData();
    }
  };

  const handleStop = async () => {
    try {
      await fetch('/api/agent/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/agent/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setAlertHalt(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPreset = async (preset) => {
    let newConf = { max_consecutive_failures: 4, max_tokens: 4000, max_iterations: 10 };
    if (preset === 'strict') {
      newConf = { max_consecutive_failures: 2, max_tokens: 2000, max_iterations: 5 };
    } else if (preset === 'permissive') {
      newConf = { max_consecutive_failures: 8, max_tokens: 8000, max_iterations: 20 };
    }
    setConfig(newConf);
    try {
      await fetch('/api/circuit-breaker/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConf })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadHaltTrace = () => {
    if (!alertHalt) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alertHalt, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `halt_trace_${alertHalt.trace_id || 'audit'}.json`);
    dlAnchor.click();
  };

  const filteredEvents = events.filter(e => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'tool') return e.event_type.includes('tool');
    if (eventFilter === 'llm') return e.event_type.includes('llm');
    if (eventFilter === 'cb') return e.event_type.includes('circuit_breaker') || e.event_type.includes('halt');
    return true;
  });

  const circuitStatus = cbState?.state || 'CLOSED';
  const isHalted = circuitStatus === 'OPEN' || circuitStatus === 'HALTED';

  const maxFailures = config.max_consecutive_failures || 4;
  const currentFailures = cbState?.failure_count || 0;
  const failurePct = Math.min(100, Math.round((currentFailures / maxFailures) * 100));

  const maxTokens = config.max_tokens || 4000;
  const currentTokens = cbState?.token_usage || 0;
  const tokenPct = Math.min(100, Math.round((currentTokens / maxTokens) * 100));

  const maxIters = config.max_iterations || 10;
  const currentIters = cbState?.iteration_count || 0;
  const iterPct = Math.min(100, Math.round((currentIters / maxIters) * 100));

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', color: '#0a192f' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        boxShadow: '0 4px 20px -2px rgba(11,26,48,0.05)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0284c7',
            padding: '4px 12px',
            borderRadius: 9999,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: 10
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            <span>SAARTHI RUNTIME GOVERNANCE • AGENT SAFETY & OPENTELEMETRY</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0b1a30', margin: '4px 0 6px', letterSpacing: '-0.5px' }}>
            Agent Safety — <span style={{ color: '#0284c7' }}>CircuitGuard & Runtime Protection</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
            Zero-latency runtime governor: monitors agent loops, tool failures, and token limits with automatic graceful halts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#ffffff', color: '#0b1a30', border: '1px solid #cbd5e1',
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f1f5f9', color: '#0b1a30', border: '1px solid #e2e8f0',
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Reset Circuit
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning && status?.agent_status !== 'RUNNING'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: (!isRunning && status?.agent_status !== 'RUNNING') ? 0.5 : 1
            }}
          >
            <Square size={14} /> Emergency Halt
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Circuit State', val: circuitStatus, color: isHalted ? '#ef4444' : '#10b981', sub: isHalted ? 'Tripped' : 'Protected' },
          { label: 'Agent Status', val: status?.agent_status || 'IDLE', color: '#0284c7', sub: `Run #${metrics?.total_runs || 0}` },
          { label: 'Iterations', val: `${currentIters} / ${maxIters}`, color: currentIters >= maxIters ? '#ef4444' : '#0b1a30', sub: 'Loop Count' },
          { label: 'Token Usage', val: currentTokens.toLocaleString(), color: currentTokens >= maxTokens ? '#ef4444' : '#0b1a30', sub: `Budget ${maxTokens}` },
          { label: 'Consecutive Fails', val: `${currentFailures} / ${maxFailures}`, color: currentFailures > 0 ? '#ef4444' : '#10b981', sub: 'Failure Limit' },
          { label: 'Tool Calls', val: metrics?.tool_calls || 0, color: '#2563eb', sub: `LLMs: ${metrics?.llm_calls || 0}` },
          { label: 'Safety Breaks', val: metrics?.circuit_breaks || 0, color: '#f59e0b', sub: 'Interventions' }
        ].map((m, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px 12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(11,26,48,0.03)'
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.8, marginBottom: 4 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: m.color }}>
              {m.val}
            </div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Halt Banner */}
      {alertHalt && (() => {
        const rawReason = alertHalt.reason || alertHalt.halt_reason || '';
        let displayReason = rawReason;
        if (rawReason.includes('CONSECUTIVE_TOOL_FAILURE') || rawReason.toLowerCase().includes('consecutive') || rawReason.toLowerCase().includes('tool_failure') || selectedScenario === 'runaway_agent') {
          displayReason = 'Consecutive tool failure threshold exceeded';
        } else if (rawReason.includes('TOKEN') || rawReason.toLowerCase().includes('budget')) {
          displayReason = 'Token budget threshold exceeded';
        } else if (rawReason.includes('ITERATION') || rawReason.toLowerCase().includes('loop')) {
          displayReason = 'Maximum loop iterations exceeded';
        }

        return (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '6px solid #ef4444',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 4px 16px rgba(239,68,68,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800 }}>
                <AlertTriangle size={20} color="#dc2626" /> RUNTIME CIRCUIT TRIPPED — AGENT EXECUTION HALTED
              </h3>
              <span style={{ background: '#dc2626', color: '#ffffff', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>
                CIRCUIT OPEN
              </span>
            </div>

            <p style={{ color: '#7f1d1d', fontSize: 13.5, margin: '0 0 14px' }}>
              Safety threshold breached during autonomous execution. The OpenTelemetry hook immediately interrupted the agent loop and generated a structured halt trace.
            </p>

            {/* Key Lock-In Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>CIRCUIT STATE</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#dc2626', fontSize: 16 }}>OPEN</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>AGENT STATUS</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#991b1b', fontSize: 16 }}>HALTED</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: 8, padding: 12, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>REASON</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#b91c1c', fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayReason}
                </div>
              </div>
            </div>

            {/* Step Progression Stepper */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Failure Cascade Progression:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, fontWeight: 700 }}>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 9px', borderRadius: 4, border: '1px solid #fca5a5' }}>Failure 1</span>
                <span style={{ color: '#dc2626' }}>→</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 9px', borderRadius: 4, border: '1px solid #fca5a5' }}>Failure 2</span>
                <span style={{ color: '#dc2626' }}>→</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 9px', borderRadius: 4, border: '1px solid #fca5a5' }}>Failure 3</span>
                <span style={{ color: '#dc2626' }}>→</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 9px', borderRadius: 4, border: '1px solid #fca5a5' }}>Failure 4</span>
                <span style={{ color: '#dc2626' }}>→</span>
                <span style={{ background: '#dc2626', color: '#ffffff', padding: '3px 9px', borderRadius: 4, fontWeight: 800 }}>CIRCUIT OPEN</span>
                <span style={{ color: '#dc2626' }}>→</span>
                <span style={{ background: '#7f1d1d', color: '#ffffff', padding: '3px 9px', borderRadius: 4, fontWeight: 800 }}>AGENT HALTED</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleReset}
                style={{ background: '#0b1a30', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Circuit
              </button>
              <button
                onClick={handleDownloadHaltTrace}
                style={{ background: '#fff', color: '#0b1a30', border: '1px solid #cbd5e1', padding: '9px 18px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download Trace JSON
              </button>
            </div>
          </div>
        );
      })()}

      {/* Grid: Gauges + Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Gauges & Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Gauges */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 4px 15px rgba(11,26,48,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0b1a30', letterSpacing: 0.8 }}>
                Runtime Threshold Gauges
              </span>
              <span style={{
                background: isHalted ? '#fee2e2' : '#ecfdf5',
                color: isHalted ? '#991b1b' : '#065f46',
                border: `1px solid ${isHalted ? '#fecaca' : '#a7f3d0'}`,
                padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700
              }}>
                {circuitStatus}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <button onClick={() => handleApplyPreset('strict')} style={{ padding: '4px 10px', borderRadius: 9999, border: '1px solid #cbd5e1', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                ⚡ Strict
              </button>
              <button onClick={() => handleApplyPreset('standard')} style={{ padding: '4px 10px', borderRadius: 9999, border: '1px solid #cbd5e1', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                🛡️ Standard
              </button>
              <button onClick={() => handleApplyPreset('permissive')} style={{ padding: '4px 10px', borderRadius: 9999, border: '1px solid #cbd5e1', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                🧪 Permissive
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Tool Failures</span>
                  <span style={{ fontWeight: 700, color: currentFailures >= maxFailures ? '#ef4444' : '#0b1a30' }}>{currentFailures} / {maxFailures} threshold</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${failurePct}%`, background: failurePct >= 100 ? '#ef4444' : failurePct >= 50 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Token Budget</span>
                  <span style={{ fontWeight: 700, color: currentTokens >= maxTokens ? '#ef4444' : '#0b1a30' }}>{currentTokens} / {maxTokens} tokens</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tokenPct}%`, background: tokenPct >= 100 ? '#ef4444' : tokenPct >= 75 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Loop Iterations</span>
                  <span style={{ fontWeight: 700, color: currentIters >= maxIters ? '#ef4444' : '#0b1a30' }}>{currentIters} / {maxIters} max</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${iterPct}%`, background: iterPct >= 100 ? '#ef4444' : iterPct >= 70 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Selector */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 4px 15px rgba(11,26,48,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0b1a30', letterSpacing: 0.8 }}>
                Select Scenario to Simulate
              </span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Click any scenario or hit Run
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {SCENARIOS.map(sc => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{sc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <strong style={{ fontSize: 13, color: '#0b1a30' }}>{sc.name}</strong>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                          background: sc.id === 'safe' ? '#ecfdf5' : '#fef2f2',
                          color: sc.id === 'safe' ? '#059669' : '#dc2626',
                          border: `1px solid ${sc.id === 'safe' ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {sc.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>{sc.desc}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunScenario(sc.id);
                      }}
                      disabled={isRunning}
                      style={{
                        background: isSelected ? '#0284c7' : '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        opacity: isRunning ? 0.6 : 1,
                        flexShrink: 0
                      }}
                    >
                      <Play size={11} /> Run
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleRunScenario(selectedScenario)}
              disabled={isRunning || status?.agent_status === 'RUNNING'}
              style={{
                width: '100%',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                opacity: (isRunning || status?.agent_status === 'RUNNING') ? 0.6 : 1
              }}
            >
              <Play size={16} /> {isRunning ? 'Running Scenario Simulation...' : `Launch Selected (${selectedScenario})`}
            </button>
          </div>
        </div>

        {/* Right: Terminal Widget (Supports Light and Dark Theme) */}
        <div style={{
          background: terminalTheme === 'light' ? '#ffffff' : '#0b1a30',
          borderRadius: 16,
          border: terminalTheme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: terminalTheme === 'light' ? '0 4px 20px rgba(11,26,48,0.06)' : '0 20px 45px -10px rgba(6,18,36,0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 600
        }}>
          {/* Terminal Bar */}
          <div style={{
            background: terminalTheme === 'light' ? '#f8fafc' : '#061224',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: terminalTheme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 8, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: terminalTheme === 'light' ? '#0b1a30' : '#94a3b8', letterSpacing: 0.8 }}>
                CIRCUITGUARD LIVE OTel STREAM
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Theme toggle */}
              <button
                onClick={() => setTerminalTheme(terminalTheme === 'light' ? 'dark' : 'light')}
                style={{
                  background: terminalTheme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.08)',
                  color: terminalTheme === 'light' ? '#475569' : '#e2e8f0',
                  border: terminalTheme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {terminalTheme === 'light' ? '🌙 Dark Log' : '☀️ Light Log'}
              </button>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 8px', borderRadius: 9999,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#059669',
                fontSize: 10, fontWeight: 700
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} /> ACTIVE
              </div>
            </div>
          </div>

          {/* Terminal Controls */}
          <div style={{
            padding: '10px 18px',
            borderBottom: terminalTheme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)',
            background: terminalTheme === 'light' ? '#ffffff' : '#0b1a30',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              Telemetry Spans: <strong style={{ color: terminalTheme === 'light' ? '#0b1a30' : '#ffffff' }}>{filteredEvents.length}</strong>
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'llm', 'tool', 'cb'].map(f => (
                <button
                  key={f}
                  onClick={() => setEventFilter(f)}
                  style={{
                    background: eventFilter === f ? '#0284c7' : terminalTheme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                    color: eventFilter === f ? '#ffffff' : terminalTheme === 'light' ? '#475569' : '#94a3b8',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: terminalTheme === 'light' ? '#f8fafc' : '#081224'
          }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12.5, padding: '48px 20px' }}>
                <Activity size={24} style={{ margin: '0 auto 10px', color: '#94a3b8', opacity: 0.6 }} />
                <div>No telemetry spans emitted yet.</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Launch a scenario to stream live OpenTelemetry events.</div>
              </div>
            ) : (
              filteredEvents.map(e => {
                const isHalt = e.event_type.includes('halt') || e.event_type.includes('circuit_breaker');
                const isFail = e.event_type.includes('fail');
                const isTool = e.event_type.includes('tool');
                const isLlm = e.event_type.includes('llm');

                const bgLight = isHalt ? '#fef2f2' : isFail ? '#fff1f2' : '#ffffff';
                const bgDark = isHalt ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.035)';
                const borderLight = isHalt ? '1px solid #fecaca' : isFail ? '1px solid #fda4af' : '1px solid #e2e8f0';
                const borderDark = isHalt ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.04)';

                return (
                  <div key={e.id} style={{
                    display: 'grid', gridTemplateColumns: '70px 130px 1fr', gap: 10,
                    padding: '8px 12px', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
                    background: terminalTheme === 'light' ? bgLight : bgDark,
                    border: terminalTheme === 'light' ? borderLight : borderDark,
                    boxShadow: terminalTheme === 'light' ? '0 1px 2px rgba(0,0,0,0.02)' : 'none'
                  }}>
                    <div style={{ color: '#64748b', fontSize: 10.5, paddingTop: 1 }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{
                      fontWeight: 700,
                      color: isHalt ? '#dc2626' : isFail ? '#e11d48' : isTool ? (terminalTheme === 'light' ? '#0d9488' : '#2dd4bf') : isLlm ? (terminalTheme === 'light' ? '#7c3aed' : '#c084fc') : '#0284c7'
                    }}>
                      {e.event_type}
                    </div>
                    <div style={{ color: terminalTheme === 'light' ? '#1e293b' : '#e2e8f0' }}>
                      {e.node && <span style={{ color: '#64748b', fontWeight: 600 }}>[{e.node}] </span>}
                      {e.tool && <span style={{ color: '#0284c7', fontWeight: 600 }}>tool={e.tool} </span>}
                      {e.tokens && <span style={{ color: '#7c3aed', fontWeight: 600 }}>+{e.tokens}tok </span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
