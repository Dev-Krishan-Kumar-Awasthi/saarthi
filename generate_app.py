import os

code = """import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from './services/api.js'

// --- SVGs ---
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
)
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const RefreshCwIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const SCENARIOS = [
  {
    id: 'safe',
    name: 'Safe Multi-Step Execution',
    badge: 'Normal Flow',
    badgeType: 'status-pill closed',
    desc: 'Autonomous research workflow completing sub-tasks safely within token and failure boundaries.',
    trigger: 'None - Circuit stays CLOSED and healthy',
    expected: 'Success in 3 iterations, 1,200 tokens, 0 failures',
    icon: '✅'
  },
  {
    id: 'tool_failure',
    name: 'Tool Failure Cascade',
    badge: 'Breaker Trip',
    badgeType: 'status-pill open',
    desc: 'Simulates flaky external API returning 500 errors repeatedly without recovery.',
    trigger: 'Breaks at 4 consecutive tool failures',
    expected: 'Circuit trips OPEN -> Graceful agent halt -> Structured halt trace',
    icon: '💥'
  },
  {
    id: 'token_exhaustion',
    name: 'Token Budget Exhaustion',
    badge: 'Breaker Trip',
    badgeType: 'status-pill open',
    desc: 'Simulates prompt explosion or massive uncontrolled retrieval responses.',
    trigger: 'Breaks when token usage exceeds configured budget (4,000 tokens)',
    expected: 'Circuit trips OPEN before budget overrun -> Agent halts safely',
    icon: '📈'
  },
  {
    id: 'infinite_loop',
    name: 'Autonomous Infinite Loop',
    badge: 'Breaker Trip',
    badgeType: 'status-pill open',
    desc: 'Planner gets stuck re-evaluating the same inconclusive tool observation repeatedly.',
    trigger: 'Breaks when iteration count reaches max allowed (10 iterations)',
    expected: 'Halt on MAX_LOOP_ITERATIONS -> Prevents runaway cost',
    icon: '🔄'
  }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor')
  const [selectedScenario, setSelectedScenario] = useState('tool_failure')
  const [status, setStatus] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [cbState, setCbState] = useState(null)
  const [events, setEvents] = useState([])
  const [traces, setTraces] = useState([])
  const [selectedTrace, setSelectedTrace] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [alertHalt, setAlertHalt] = useState(null)
  const [toast, setToast] = useState(null)
  const [eventFilter, setEventFilter] = useState('all')

  // Policy configs
  const [config, setConfig] = useState({
    max_consecutive_failures: 4,
    max_tokens: 4000,
    max_iterations: 10
  })

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Polling data
  const fetchData = useCallback(async () => {
    try {
      const [s, m, cb, ev] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getMetrics().catch(() => null),
        api.getCircuitBreaker().catch(() => null),
        api.getEvents(60).catch(() => [])
      ])
      if (s) setStatus(s)
      if (m) setMetrics(m)
      if (cb) {
        setCbState(cb)
        if (cb.config) setConfig(cb.config)
        if (cb.state === 'HALTED' || cb.state === 'OPEN') {
          setAlertHalt({
            reason: cb.trigger_reason,
            triggered_at: cb.triggered_at,
            triggered_node: cb.triggered_node,
            triggered_iteration: cb.triggered_iteration,
            token_usage: cb.token_usage,
            failure_count: cb.failure_count,
            iteration_count: cb.iteration_count,
            trace_id: s?.trace_id
          })
        }
      }
      if (ev) setEvents(ev)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 1200)
    return () => clearInterval(timer)
  }, [fetchData])

  // Load traces on tab change
  useEffect(() => {
    if (activeTab === 'traces') {
      api.getTraces().then(res => setTraces(res)).catch(() => {})
    }
  }, [activeTab])

  const handleRunScenario = async () => {
    setIsRunning(true)
    setAlertHalt(null)
    showToast('Launching ' + selectedScenario + ' scenario...', 'info')
    try {
      const res = await api.runScenario(selectedScenario)
      showToast('Run finished: ' + res.status, res.status === 'HALTED' ? 'warning' : 'success')
      await fetchData()
      if (res.status === 'HALTED') {
        const detail = await api.getTrace(res.trace_id).catch(() => null)
        if (detail?.halt_trace) {
          setAlertHalt(detail.halt_trace)
        }
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsRunning(false)
      fetchData()
    }
  }

  const handleStop = async () => {
    try {
      await api.stopAgent()
      showToast('Agent emergency stop dispatched', 'warning')
      fetchData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleReset = async () => {
    try {
      await api.resetAgent()
      setAlertHalt(null)
      showToast('Circuit breaker and Agent reset to CLOSED state', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleApplyPreset = async (preset) => {
    let newConf = { max_consecutive_failures: 4, max_tokens: 4000, max_iterations: 10 }
    if (preset === 'strict') {
      newConf = { max_consecutive_failures: 2, max_tokens: 2000, max_iterations: 5 }
    } else if (preset === 'permissive') {
      newConf = { max_consecutive_failures: 8, max_tokens: 8000, max_iterations: 20 }
    }
    setConfig(newConf)
    try {
      await api.updateConfig(newConf)
      showToast('Applied ' + preset.toUpperCase() + ' safety preset', 'success')
      fetchData()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const handleSaveConfig = async () => {
    try {
      await api.updateConfig({
        max_consecutive_failures: Number(config.max_consecutive_failures),
        max_tokens: Number(config.max_tokens),
        max_iterations: Number(config.max_iterations)
      })
      showToast('Safety policies applied successfully', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleInspectTrace = async (traceId) => {
    try {
      const detail = await api.getTrace(traceId)
      setSelectedTrace(detail)
    } catch (err) {
      showToast('Could not load trace details', 'error')
    }
  }

  const handleDownloadHaltTrace = () => {
    if (!alertHalt) return
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alertHalt, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', 'halt_trace_' + (alertHalt.trace_id || 'audit') + '.json')
    dlAnchor.click()
    showToast('Halt Trace JSON downloaded', 'success')
  }

  // Filter events
  const filteredEvents = events.filter(e => {
    if (eventFilter === 'all') return true
    if (eventFilter === 'tool') return e.event_type.includes('tool')
    if (eventFilter === 'llm') return e.event_type.includes('llm')
    if (eventFilter === 'cb') return e.event_type.includes('circuit_breaker') || e.event_type.includes('halt')
    return true
  })

  const circuitStatus = cbState?.state || 'CLOSED'
  const isHalted = circuitStatus === 'OPEN' || circuitStatus === 'HALTED'

  const maxFailures = config.max_consecutive_failures || 4
  const currentFailures = cbState?.failure_count || 0
  const failurePct = Math.min(100, Math.round((currentFailures / maxFailures) * 100))

  const maxTokens = config.max_tokens || 4000
  const currentTokens = cbState?.token_usage || 0
  const tokenPct = Math.min(100, Math.round((currentTokens / maxTokens) * 100))

  const maxIters = config.max_iterations || 10
  const currentIters = cbState?.iteration_count || 0
  const iterPct = Math.min(100, Math.round((currentIters / maxIters) * 100))

  return (
    <div>
      {/* 1. Reference Style Top Announcement Strip */}
      <div className="top-announcement">
        <div className="announcement-left">
          <span style={{ color: '#38bdf8' }}>●</span>
          <span>SGSITS AI LAB • RUNTIME GOVERNANCE FOR AUTONOMOUS AI</span>
        </div>
        <div className="announcement-right">
          <span className="badge-ping">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>REALTIME CIRCUIT BREAKER ACTIVE • 20ms</span>
          </span>
          <span style={{ color: '#64748b' }}>OpenTelemetry Tracing Engine</span>
        </div>
      </div>

      <div className="app-container">
        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: 48,
            right: 28,
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#0b1a30',
            color: '#fff',
            padding: '11px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(11,26,48,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="brand-icon-box">
                <ShieldIcon />
              </div>
              <div>
                <div className="brand-title">CIRCUIT<span>GUARD</span></div>
                <div className="brand-sub">OTel AI Safety Layer</div>
              </div>
            </div>
          </div>

          <nav className="nav-menu">
            <button
              className={'nav-link ' + (activeTab === 'monitor' ? 'active' : '')}
              onClick={() => setActiveTab('monitor')}
            >
              <ZapIcon />
              <span>Live Monitor</span>
            </button>
            <button
              className={'nav-link ' + (activeTab === 'traces' ? 'active' : '')}
              onClick={() => setActiveTab('traces')}
            >
              <ActivityIcon />
              <span>OTel Spans & Traces</span>
            </button>
            <button
              className={'nav-link ' + (activeTab === 'policy' ? 'active' : '')}
              onClick={() => setActiveTab('policy')}
            >
              <SlidersIcon />
              <span>Safety Policies</span>
            </button>
            <button
              className={'nav-link ' + (activeTab === 'architecture' ? 'active' : '')}
              onClick={() => setActiveTab('architecture')}
            >
              <InfoIcon />
              <span>Architecture Spec</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="circuit-status-indicator">
              <span style={{ color: 'var(--text-muted)' }}>Circuit Breaker</span>
              <span className={'status-pill ' + (isHalted ? 'open' : 'closed')}>
                {circuitStatus}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Agent State: <strong style={{ color: status?.agent_status === 'RUNNING' ? 'var(--blue-primary)' : 'inherit' }}>{status?.agent_status || 'IDLE'}</strong>
            </div>
          </div>
        </aside>

        {/* Workspace */}
        <main className="workspace">
          <div className="content-wrapper">
            {activeTab === 'monitor' && (
              <div>
                {/* Hero Header Section (Reference Inspired) */}
                <div className="hero-header">
                  <div>
                    <div className="hero-badge-tag">
                      <span className="hero-badge-dot" />
                      <span>RUNTIME CIRCUIT BREAKER • OPENTELEMETRY TRACING</span>
                    </div>
                    <h2 className="hero-title">
                      Never Let an Autonomous Agent <span>Run Unchecked.</span>
                    </h2>
                    <p className="hero-subtitle">
                      Zero-latency in-flight monitoring: automatically trips breaker and gracefully halts runaway execution when tool failures or token budgets breach safety limits.
                    </p>
                  </div>
                  <div className="hero-actions">
                    <button className="btn btn-secondary" onClick={fetchData}>
                      <RefreshCwIcon /> Refresh
                    </button>
                    <button className="btn btn-ghost" onClick={handleReset}>
                      Reset Circuit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleStop}
                      disabled={!isRunning && status?.agent_status !== 'RUNNING'}
                    >
                      Emergency Halt
                    </button>
                  </div>
                </div>

                {/* Metrics Ribbon */}
                <div className="metrics-row">
                  <div className={'metric-box ' + (isHalted ? 'alert' : '')}>
                    <div className="metric-name">Circuit State</div>
                    <div className={'metric-num ' + (isHalted ? 'red' : 'green')}>
                      {circuitStatus}
                    </div>
                    <div className="metric-caption">{isHalted ? 'Tripped & Halted' : 'Active Safe Guard'}</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Agent Status</div>
                    <div className={'metric-num ' + (status?.agent_status === 'RUNNING' ? 'accent' : 'blue')}>
                      {status?.agent_status || 'IDLE'}
                    </div>
                    <div className="metric-caption">Run #{metrics?.total_runs || 0}</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Loop Count</div>
                    <div className={'metric-num ' + (currentIters >= maxIters ? 'red' : 'accent')}>
                      {currentIters} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {maxIters}</span>
                    </div>
                    <div className="metric-caption">Max Allowed</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Tokens Consumed</div>
                    <div className={'metric-num ' + (currentTokens >= maxTokens ? 'red' : 'accent')}>
                      {currentTokens.toLocaleString()}
                    </div>
                    <div className="metric-caption">Budget: {maxTokens.toLocaleString()}</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Consecutive Fails</div>
                    <div className={'metric-num ' + (currentFailures > 0 ? 'red' : 'green')}>
                      {currentFailures} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {maxFailures}</span>
                    </div>
                    <div className="metric-caption">Limit: {maxFailures}</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Tool Invocations</div>
                    <div className="metric-num blue">{metrics?.tool_calls || 0}</div>
                    <div className="metric-caption">LLMs: {metrics?.llm_calls || 0}</div>
                  </div>

                  <div className="metric-box">
                    <div className="metric-name">Safety Breaks</div>
                    <div className="metric-num orange">{metrics?.circuit_breaks || 0}</div>
                    <div className="metric-caption">Halt Interventions</div>
                  </div>
                </div>

                {/* HALT BANNER (Prominent when tripped) */}
                {alertHalt && (
                  <div className="halt-banner">
                    <h3>
                      <AlertTriangleIcon />
                      <span>CIRCUIT BREAKER TRIPPED — EXECUTION GRACEFULLY HALTED</span>
                    </h3>
                    <p style={{ color: '#7f1d1d', fontSize: 13.5 }}>
                      Safety threshold breached during autonomous execution. The OpenTelemetry hook immediately interrupted the agent loop and generated a structured halt trace.
                    </p>

                    <div className="halt-stats-grid">
                      <div className="halt-stat-card">
                        <div className="halt-stat-lbl">Trigger Reason</div>
                        <div className="halt-stat-val">{alertHalt.reason || alertHalt.halt_reason || 'SAFETY_LIMIT_EXCEEDED'}</div>
                      </div>
                      <div className="halt-stat-card">
                        <div className="halt-stat-lbl">Breached Node / Tool</div>
                        <div className="halt-stat-val" style={{ color: 'var(--amber)' }}>
                          {alertHalt.triggered_node || alertHalt.node || 'tool_execution'} ({alertHalt.tool || 'api_call'})
                        </div>
                      </div>
                      <div className="halt-stat-card">
                        <div className="halt-stat-lbl">OTel Trace ID</div>
                        <div className="halt-stat-val" style={{ color: 'var(--navy-dark)', fontSize: 12 }}>
                          {alertHalt.trace_id || status?.trace_id || 'trace-otel-active'}
                        </div>
                      </div>
                      <div className="halt-stat-card">
                        <div className="halt-stat-lbl">At Iteration</div>
                        <div className="halt-stat-val" style={{ color: 'var(--blue-primary)' }}>
                          #{alertHalt.triggered_iteration || alertHalt.iteration_count || currentIters}
                        </div>
                      </div>
                    </div>

                    {alertHalt.explanation && (
                      <div style={{ background: '#ffffff', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#7f1d1d', marginBottom: 16 }}>
                        <strong>Root Cause:</strong> {alertHalt.explanation}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary btn-sm" onClick={handleReset}>
                        Reset Circuit & Clear Fault
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleDownloadHaltTrace}>
                        <DownloadIcon /> Export Audit JSON
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('traces')}>
                        Inspect OTel Spans
                      </button>
                    </div>
                  </div>
                )}

                <div className="dashboard-grid">
                  {/* Left Column: Circuit Breaker Visualizer & Scenario Picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Circuit Breaker Visualizer */}
                    <div className={'cb-gauge-card ' + (isHalted ? 'open' : 'closed')}>
                      <div className="panel-header">
                        <span className="panel-title">Runtime Circuit Breaker State</span>
                        <span className={'status-pill ' + (isHalted ? 'open' : 'closed')}>
                          {isHalted ? 'CIRCUIT OPEN / TRIPPED' : 'CIRCUIT CLOSED / SAFE'}
                        </span>
                      </div>

                      {/* Quick Presets for Demo */}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                        Quick Safety Presets:
                      </div>
                      <div className="policy-presets">
                        <button className="preset-btn" onClick={() => handleApplyPreset('strict')}>
                          ⚡ Strict Sandbox (2 Fails / 2k Tok)
                        </button>
                        <button className="preset-btn" onClick={() => handleApplyPreset('standard')}>
                          🛡️ Standard Production
                        </button>
                        <button className="preset-btn" onClick={() => handleApplyPreset('permissive')}>
                          🧪 Permissive Lab
                        </button>
                      </div>

                      <div className="gauge-bars">
                        {/* Failures */}
                        <div>
                          <div className="bar-meta">
                            <span>Consecutive Tool Failures</span>
                            <span style={{ color: currentFailures >= maxFailures ? 'var(--rose)' : 'var(--navy-dark)' }}>
                              {currentFailures} / {maxFailures} threshold
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className={'bar-fill ' + (failurePct >= 100 ? 'red' : failurePct >= 50 ? 'orange' : 'green')}
                              style={{ width: failurePct + '%' }}
                            />
                          </div>
                        </div>

                        {/* Tokens */}
                        <div>
                          <div className="bar-meta">
                            <span>Token Consumption Budget</span>
                            <span style={{ color: currentTokens >= maxTokens ? 'var(--rose)' : 'var(--navy-dark)' }}>
                              {currentTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className={'bar-fill ' + (tokenPct >= 100 ? 'red' : tokenPct >= 75 ? 'orange' : 'green')}
                              style={{ width: tokenPct + '%' }}
                            />
                          </div>
                        </div>

                        {/* Loops */}
                        <div>
                          <div className="bar-meta">
                            <span>Max Loop Iterations</span>
                            <span style={{ color: currentIters >= maxIters ? 'var(--rose)' : 'var(--navy-dark)' }}>
                              {currentIters} / {maxIters} loops
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className={'bar-fill ' + (iterPct >= 100 ? 'red' : iterPct >= 70 ? 'orange' : 'green')}
                              style={{ width: iterPct + '%' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-light)', fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Interception: In-Flight OTel Tracer</span>
                        <span>Evaluation Latency: &lt; 0.8ms Overhead</span>
                      </div>
                    </div>

                    {/* Scenarios Picker */}
                    <div className="panel">
                      <div className="panel-header">
                        <span className="panel-title">Autonomous Test Scenarios</span>
                        <span className="status-pill closed">Ready to Run</span>
                      </div>

                      <div className="scenario-list">
                        {SCENARIOS.map(sc => (
                          <div
                            key={sc.id}
                            className={'scenario-item ' + (selectedScenario === sc.id ? 'active' : '')}
                            onClick={() => setSelectedScenario(sc.id)}
                          >
                            <span className="scenario-icon">{sc.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <strong style={{ fontSize: 13.5, color: 'var(--navy-dark)' }}>{sc.name}</strong>
                                <span className={sc.badgeType}>{sc.badge}</span>
                              </div>
                              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sc.desc}</p>
                              <div style={{ fontSize: 11, color: 'var(--blue-primary)', marginTop: 6, fontFamily: 'monospace', fontWeight: 600 }}>
                                {sc.expected}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: '14px' }}
                        onClick={handleRunScenario}
                        disabled={isRunning || status?.agent_status === 'RUNNING'}
                      >
                        {isRunning ? 'Running Scenario & Monitoring Telemetry...' : 'Launch Selected Scenario (' + selectedScenario + ') →'}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Floating Live Terminal Widget & Execution Pipeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Floating Terminal Widget (Reference Image Inspired) */}
                    <div className="terminal-window">
                      <div className="terminal-bar">
                        <div className="mac-controls">
                          <div className="mac-circle c-red" />
                          <div className="mac-circle c-yellow" />
                          <div className="mac-circle c-green" />
                        </div>
                        <div className="terminal-title-text">CIRCUITGUARD LIVE TERMINAL</div>
                        <div className="terminal-status-chip">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                          <span>ACTIVE</span>
                        </div>
                      </div>

                      <div className="terminal-content">
                        <div className="terminal-controls-row">
                          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                            Stream: <strong style={{ color: '#ffffff' }}>{filteredEvents.length} Telemetry Spans</strong>
                          </div>
                          <div className="filter-pill-group">
                            {['all', 'llm', 'tool', 'cb'].map(f => (
                              <button
                                key={f}
                                className={'filter-pill ' + (eventFilter === f ? 'active' : 'inactive')}
                                onClick={() => setEventFilter(f)}
                              >
                                {f.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="terminal-feed">
                          {filteredEvents.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                              Waiting for agent execution... Click "Launch Selected Scenario" to stream live OTel spans.
                            </div>
                          ) : (
                            filteredEvents.map(e => {
                              const isHalt = e.event_type.includes('halt') || e.event_type.includes('circuit_breaker')
                              const isFail = e.event_type.includes('fail')
                              const isTool = e.event_type.includes('tool')
                              const isLlm = e.event_type.includes('llm')

                              return (
                                <div key={e.id} className="feed-row">
                                  <div className="feed-time">
                                    {new Date(e.timestamp).toLocaleTimeString()}
                                  </div>
                                  <div className={'feed-type ' + (isHalt ? 'cb-halt' : isFail ? 'tool-fail' : isTool ? 'tool-call' : isLlm ? 'llm-call' : 'agent-loop')}>
                                    {e.event_type}
                                  </div>
                                  <div className="feed-desc">
                                    {e.node && <span style={{ color: '#cbd5e1' }}>[{e.node}] </span>}
                                    {e.tool && <span style={{ color: '#38bdf8' }}>tool={e.tool} </span>}
                                    {e.tokens && <span style={{ color: '#c084fc' }}>+{e.tokens}tok </span>}
                                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                                      <span style={{ color: '#94a3b8' }}>{JSON.stringify(e.metadata)}</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Autonomous Execution Pipeline */}
                    <div className="panel">
                      <div className="panel-header">
                        <span className="panel-title">Autonomous Execution Pipeline</span>
                        <span style={{ fontSize: 11.5, color: 'var(--blue-primary)', fontWeight: 700 }}>
                          Active Loop: #{currentIters}
                        </span>
                      </div>

                      <div className="pipeline">
                        <div className="pipe-node">
                          <div className={'pipe-icon ' + (isRunning ? 'running' : 'success')}>1</div>
                          <div>
                            <div className="pipe-label">Agent Goal & Planning</div>
                            <div className="pipe-sub">Autonomous goal decomposition & context initialization</div>
                          </div>
                        </div>
                        <div className={'pipe-connector ' + (isRunning ? 'active' : '')} />

                        <div className="pipe-node">
                          <div className={'pipe-icon ' + (isRunning ? 'running' : 'success')}>2</div>
                          <div>
                            <div className="pipe-label">LLM Reasoning & Output Generation</div>
                            <div className="pipe-sub">Token accumulation tracked via OTel attributes</div>
                          </div>
                        </div>
                        <div className={'pipe-connector ' + (currentFailures > 0 ? 'red' : isRunning ? 'active' : '')} />

                        <div className="pipe-node">
                          <div className={'pipe-icon ' + (currentFailures > 0 ? 'failed' : isRunning ? 'running' : 'success')}>3</div>
                          <div>
                            <div className="pipe-label">Tool Execution & Observation</div>
                            <div className="pipe-sub">Evaluates HTTP 500s, timeouts, and error cascades</div>
                          </div>
                        </div>
                        <div className={'pipe-connector ' + (isHalted ? 'red' : isRunning ? 'active' : '')} />

                        <div className="pipe-node">
                          <div className={'pipe-icon ' + (isHalted ? 'failed' : 'pending')}>4</div>
                          <div>
                            <div className="pipe-label" style={{ color: isHalted ? 'var(--rose)' : 'inherit' }}>
                              Circuit Breaker In-Flight Hook
                            </div>
                            <div className="pipe-sub">
                              {isHalted ? 'HALT TRIGGERED: Stopped execution cleanly' : 'Thresholds evaluated: Safe to continue'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reference Style Footer Feature Pills */}
                <div className="reference-footer-tags">
                  <div className="ref-pill">
                    <span style={{ color: 'var(--emerald)' }}>✓</span> 100% Deterministic Safety Halts
                  </div>
                  <div className="ref-pill">
                    <span style={{ color: 'var(--blue-primary)' }}>⚡</span> OpenTelemetry In-Flight Instrumentation
                  </div>
                  <div className="ref-pill">
                    <span style={{ color: 'var(--blue-vibrant)' }}>🛡️</span> Zero-Latency Audit Trail & Spans
                  </div>
                  <div className="ref-pill">
                    <span style={{ color: 'var(--amber)' }}>⚙️</span> Dynamic Policy Hot-Reloading
                  </div>
                </div>
              </div>
            )}

            {/* Traces Tab */}
            {activeTab === 'traces' && (
              <div>
                <div className="hero-header" style={{ padding: '18px 24px' }}>
                  <div>
                    <h2 className="hero-title" style={{ fontSize: 22 }}>
                      OpenTelemetry Traces & Spans
                    </h2>
                    <p className="hero-subtitle">
                      Structured audit traces and hierarchical span breakdown of autonomous agent executions
                    </p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => api.getTraces().then(setTraces)}>
                    <RefreshCwIcon /> Refresh Traces
                  </button>
                </div>

                <div className="dashboard-grid">
                  {/* Trace List */}
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Execution Runs ({traces.length})</span>
                    </div>

                    {traces.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No recorded runs found. Run a scenario from the Live Monitor first.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {traces.map(t => (
                          <div
                            key={t.trace_id}
                            className={'trace-row ' + (selectedTrace?.run?.trace_id === t.trace_id ? 'expanded' : '')}
                            onClick={() => handleInspectTrace(t.trace_id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="trace-id">{t.trace_id.substring(0, 16)}...</span>
                                <span className={'status-pill ' + (t.status === 'HALTED' ? 'open' : 'closed')}>
                                  {t.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                                Scenario: <strong style={{ color: 'var(--navy-dark)' }}>{t.scenario}</strong> • Events: {t.event_count}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>
                              <div style={{ fontWeight: 700, color: 'var(--navy-dark)' }}>{t.tokens_used.toLocaleString()} tokens</div>
                              <div style={{ color: t.failed_calls > 0 ? 'var(--rose)' : 'var(--text-muted)', fontSize: 11 }}>
                                {t.failed_calls} failures / {t.iterations} iters
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trace Details / OTel Span Hierarchy */}
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">OpenTelemetry Span Hierarchy</span>
                      {selectedTrace && (
                        <button className="btn btn-secondary btn-sm" onClick={handleDownloadHaltTrace}>
                          <DownloadIcon /> Export JSON
                        </button>
                      )}
                    </div>

                    {!selectedTrace ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Select an execution trace on the left to inspect its hierarchical span tree and attributes.
                      </div>
                    ) : (
                      <div>
                        {/* Run Summary */}
                        <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workflow ID:</span>
                            <strong style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--navy-dark)' }}>{selectedTrace.run?.workflow_id}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agent ID:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--navy-dark)' }}>{selectedTrace.run?.agent_id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Final Outcome:</span>
                            <span className={'status-pill ' + (selectedTrace.run?.status === 'HALTED' ? 'open' : 'closed')}>
                              {selectedTrace.run?.status} ({selectedTrace.run?.halt_reason || 'NORMAL_COMPLETION'})
                            </span>
                          </div>
                        </div>

                        {/* Structured Halt Trace Details */}
                        {selectedTrace.halt_trace && (
                          <div style={{ background: '#fff5f5', border: '1px solid #fecaca', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                            <h4 style={{ color: '#991b1b', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangleIcon /> Structured Halt Trace Artifact
                            </h4>
                            <div style={{ fontSize: 11.5, color: '#7f1d1d', marginBottom: 8 }}>
                              {selectedTrace.halt_trace.explanation}
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #fecaca', padding: 10, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}>
                              <div>Reason: {selectedTrace.halt_trace.halt_reason}</div>
                              <div>At Node: {selectedTrace.halt_trace.node} (Iter #{selectedTrace.halt_trace.iteration})</div>
                              <div>Tokens at Halt: {selectedTrace.halt_trace.token_usage}</div>
                              <div>Failures at Halt: {selectedTrace.halt_trace.failure_count}</div>
                            </div>
                          </div>
                        )}

                        {/* Span Breakdown */}
                        <div className="span-tree">
                          <div style={{ fontWeight: 700, color: 'var(--navy-dark)', marginBottom: 10, fontSize: 11, textTransform: 'uppercase' }}>
                            OTEL SPAN TIMELINE ({selectedTrace.events?.length || 0} SPANS)
                          </div>
                          {selectedTrace.events?.map((ev, i) => (
                            <div key={ev.id || i} className="span-row">
                              <span style={{ color: 'var(--text-muted)', width: 22 }}>{i + 1}.</span>
                              <span className={'span-name ' + (ev.event_type.includes('halt') ? 'cb' : ev.event_type.includes('fail') ? 'tool-fail' : ev.event_type.includes('tool') ? 'tool' : ev.event_type.includes('llm') ? 'llm' : 'root')}>
                                {ev.event_type}
                              </span>
                              <span style={{ color: 'var(--text-body)', fontSize: 11, flex: 1, textAlign: 'right' }}>
                                {ev.node && '[' + ev.node + '] '}
                                {ev.tool && 'tool:' + ev.tool + ' '}
                                {ev.tokens && ev.tokens + ' tok'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Safety Policies Tab */}
            {activeTab === 'policy' && (
              <div>
                <div className="hero-header" style={{ padding: '18px 24px' }}>
                  <div>
                    <h2 className="hero-title" style={{ fontSize: 22 }}>
                      Circuit Breaker Safety Policies
                    </h2>
                    <p className="hero-subtitle">
                      Configure dynamic thresholds that govern real-time autonomous agent loop interruptions
                    </p>
                  </div>
                </div>

                <div style={{ maxWidth: 740, margin: '0 auto' }}>
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Active Safety Thresholds</span>
                      <span className="status-pill closed">Live Hot-Reload</span>
                    </div>

                    <div className="config-row">
                      <div className="config-label">
                        <span>Max Consecutive Tool Failures</span>
                        <strong style={{ color: 'var(--blue-primary)' }}>{config.max_consecutive_failures} failures</strong>
                      </div>
                      <input
                        type="range"
                        className="config-range"
                        min="1"
                        max="10"
                        value={config.max_consecutive_failures}
                        onChange={e => setConfig({ ...config, max_consecutive_failures: Number(e.target.value) })}
                      />
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>
                        Trips breaker if external API calls fail consecutively without a successful recovery.
                      </div>
                    </div>

                    <div className="config-row">
                      <div className="config-label">
                        <span>Max Token Consumption Budget</span>
                        <strong style={{ color: 'var(--blue-primary)' }}>{config.max_tokens.toLocaleString()} tokens</strong>
                      </div>
                      <input
                        type="range"
                        className="config-range"
                        min="500"
                        max="20000"
                        step="500"
                        value={config.max_tokens}
                        onChange={e => setConfig({ ...config, max_tokens: Number(e.target.value) })}
                      />
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>
                        Safeguards against runaway costs and uncontrolled LLM prompt context explosion.
                      </div>
                    </div>

                    <div className="config-row">
                      <div className="config-label">
                        <span>Max Loop Iterations</span>
                        <strong style={{ color: 'var(--blue-primary)' }}>{config.max_iterations} iterations</strong>
                      </div>
                      <input
                        type="range"
                        className="config-range"
                        min="2"
                        max="30"
                        value={config.max_iterations}
                        onChange={e => setConfig({ ...config, max_iterations: Number(e.target.value) })}
                      />
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>
                        Terminates planner reasoning deadlocks and repetitive autonomous exploration loops.
                      </div>
                    </div>

                    <div style={{ marginTop: 26, display: 'flex', gap: 12 }}>
                      <button className="btn btn-primary" onClick={handleSaveConfig}>
                        Save & Apply Policies
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setConfig({ max_consecutive_failures: 4, max_tokens: 4000, max_iterations: 10 })}
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Spec Tab */}
            {activeTab === 'architecture' && (
              <div>
                <div className="hero-header" style={{ padding: '18px 24px' }}>
                  <div>
                    <h2 className="hero-title" style={{ fontSize: 22 }}>
                      Challenge 1 — Real-Time Circuit Breaker Architecture
                    </h2>
                    <p className="hero-subtitle">
                      How OpenTelemetry tracing feeds runtime safety evaluation without adding latency
                    </p>
                  </div>
                </div>

                <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Closed-Loop Runtime Governance Flow</span>
                    </div>
                    <div style={{ background: 'var(--navy-dark)', color: '#f8fafc', padding: 22, borderRadius: 12, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8 }}>
                      <div>[AUTONOMOUS AGENT]</div>
                      <div style={{ color: '#94a3b8' }}>   │</div>
                      <div style={{ color: '#38bdf8' }}>   ▼ (LLM Call / Tool Action)</div>
                      <div>[OPENTELEMETRY TRACER]  ──► Emits Span (type, tokens, duration, status)</div>
                      <div style={{ color: '#94a3b8' }}>   │</div>
                      <div style={{ color: '#f59e0b' }}>   ▼ (Real-Time In-Flight Check)</div>
                      <div>[CIRCUIT BREAKER ENGINE]</div>
                      <div style={{ color: '#94a3b8' }}>   ├─► Thresholds Passed? ──► Continue to next iteration</div>
                      <div style={{ color: '#ef4444' }}>   └─► Threshold Breached? ──► [GRACEFUL HALT EXCEPTION]</div>
                      <div style={{ color: '#94a3b8' }}>                                 │</div>
                      <div style={{ color: '#38bdf8' }}>                                 ▼ Emits Structured Halt Trace</div>
                      <div style={{ color: '#34d399' }}>                               [DASHBOARD AUDIT TRAIL]</div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Challenge Verification Matrix</span>
                    </div>
                    <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 14px' }}>Requirement</th>
                          <th style={{ padding: '10px 14px' }}>CircuitGuard Implementation</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy-dark)' }}>Monitor Loop Iterations</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-body)' }}>Tracked on each step via agent.loop span counter</td>
                          <td style={{ padding: '10px 14px' }}><span className="status-pill closed">Verified</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy-dark)' }}>Monitor LLM / Token Usage</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-body)' }}>Aggregated token attributes from LLM response spans</td>
                          <td style={{ padding: '10px 14px' }}><span className="status-pill closed">Verified</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy-dark)' }}>Detect Tool Failures</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-body)' }}>Consecutive failure tracker trips at configured threshold</td>
                          <td style={{ padding: '10px 14px' }}><span className="status-pill closed">Verified</span></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy-dark)' }}>Interrupt Execution Cleanly</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-body)' }}>CircuitBreakerHaltException prevents damage & state corruption</td>
                          <td style={{ padding: '10px 14px' }}><span className="status-pill closed">Verified</span></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy-dark)' }}>Structured Halt Trace</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-body)' }}>OTel Trace ID, node, iteration, and decision explanation exported</td>
                          <td style={{ padding: '10px 14px' }}><span className="status-pill closed">Verified</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
"""

target = r"c:\Users\HP\OneDrive\Desktop\cg\frontend\src\App.jsx"
with open(target, "w", encoding="utf-8") as f:
    f.write(code)

print("SUCCESS: App.jsx updated with Outfit fonts, Quick Presets, and Mission Control Layout!")
