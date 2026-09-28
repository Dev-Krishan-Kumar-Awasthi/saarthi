// SAARTHI — Central State Store (Zustand)
// Sole Source of Truth: Backend FastAPI + SQLite
import { create } from 'zustand';

export const useSaarthiStore = create((set, get) => ({
  // ── Connection ──
  backendConnected: false,
  backendChecked: false,

  // ── Locked Navigation (5 Judge-Facing Sections) ──
  activePage: 'dashboard',
  setActivePage: (page) => {
    set({ activePage: page });
    get().fetchAll();
  },

  // ── Authoritative State from SQLite ──
  metrics: {
    total_decisions: 0,
    actions_evaluated: 0,
    allowed: 0,
    blocked: 0,
    human_reviews_pending: 0,
    human_review: 0,
    reliability_score: 100,
    governance_config: {
      max_autonomous_refund: 5000,
      max_retry_attempts: 3,
      high_risk_threshold: 70,
      critical_risk_threshold: 85,
    }
  },
  workflows: [],
  humanReviews: [],
  auditEvents: [],
  auditIntegrity: { valid: true, total_events: 0, message: 'Ready' },
  latestDecision: null,

  // ── Demo Agent State ──
  selectedScenario: 'safe_action',
  setSelectedScenario: (id) => set({ selectedScenario: id }),
  isRunningAgent: false,

  // ── Notifications & Toasts ──
  notifications: [],
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = Date.now();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  // ── Backend Fetch Actions ──
  checkBackend: async () => {
    try {
      const resp = await fetch('/health', { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        set({ backendConnected: true, backendChecked: true });
        await get().fetchAll();
      } else {
        set({ backendConnected: false, backendChecked: true });
      }
    } catch {
      set({ backendConnected: false, backendChecked: true });
    }
  },

  fetchAll: async () => {
    try {
      const [mRes, wRes, rRes, aRes, dRes, vRes] = await Promise.all([
        fetch('/api/metrics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/workflows').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/human-review').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/audit').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/governance/latest').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/audit/verify').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      set(state => ({
        backendConnected: true,
        metrics: mRes || state.metrics,
        workflows: Array.isArray(wRes) ? wRes : state.workflows,
        humanReviews: Array.isArray(rRes) ? rRes : state.humanReviews,
        auditEvents: Array.isArray(aRes) ? aRes : state.auditEvents,
        latestDecision: dRes?.decision ? dRes : state.latestDecision,
        auditIntegrity: vRes || state.auditIntegrity,
      }));
    } catch (e) {
      console.error('FetchAll error:', e);
    }
  },

  // ── Run Demo Agent Action (Sends via REST to Backend) ──
  runDemoAgent: async (scenarioId) => {
    const scId = scenarioId || get().selectedScenario;
    set({ isRunningAgent: true, selectedScenario: scId });
    const { addToast, fetchAll } = get();

    try {
      const resp = await fetch(`/api/agent/run-scenario/${scId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: 'Execution error' }));
        throw new Error(err.detail || 'Failed to execute agent scenario');
      }

      const res = await resp.json();
      set({ latestDecision: res });
      await fetchAll();

      const notifType = res.decision === 'ALLOW' ? 'success' : res.decision === 'BLOCK' ? 'error' : 'warning';
      addToast(`${res.decision}: ${res.reason}`, notifType);

      return res;
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Execution failed', 'error');
    } finally {
      set({ isRunningAgent: false });
    }
  },

  // ── TrustBridge HITL Actions ──
  humanDecide: async (reviewId, action, modifiedAmount = null) => {
    const { addToast, fetchAll } = get();
    try {
      const resp = await fetch(`/api/human-review/${reviewId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: action.toUpperCase(),
          modified_amount: modifiedAmount ? parseFloat(modifiedAmount) : null,
          reason: `Operator decision: ${action.toUpperCase()}`
        }),
      });

      if (resp.ok) {
        const labels = { approve: 'Approved', reject: 'Rejected', modify: 'Modified' };
        addToast(`Review ${labels[action] || action} successfully`, action === 'reject' ? 'error' : 'success');
        await fetchAll();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to submit review action', 'error');
    }
  },

  // ── Cryptographic Audit Verification ──
  verifyAudit: async () => {
    const { addToast } = get();
    try {
      const resp = await fetch('/api/audit/verify');
      if (resp.ok) {
        const res = await resp.json();
        set({ auditIntegrity: res });
        if (res.valid) {
          addToast(`Audit chain verified: All ${res.total_events} events cryptographically valid`, 'success');
        } else {
          addToast(`Audit chain alert: Broken at ${res.broken_at}`, 'error');
        }
        return res;
      }
    } catch (err) {
      console.error(err);
      addToast('Verification error', 'error');
    }
  },

  // ── Reset Demo State in SQLite ──
  resetDemo: async () => {
    const { addToast, fetchAll } = get();
    try {
      const resp = await fetch('/api/reset-demo', { method: 'POST' });
      if (resp.ok) {
        await fetchAll();
        addToast('SQLite database reset to clean baseline state', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  }
}));
