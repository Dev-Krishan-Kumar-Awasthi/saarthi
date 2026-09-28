import React, { useEffect, useRef } from 'react';
import { useSaarthiStore } from './store/saarthiStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Governance from './pages/Governance';
import CircuitBreaker from './pages/CircuitBreaker';
import TrustBridgeHITL from './pages/TrustBridgeHITL';
import AuditTrail from './pages/AuditTrail';

const PAGES = {
  dashboard: Dashboard,
  overview: Dashboard,
  governance: Governance,
  safety: CircuitBreaker,
  circuit_breaker: CircuitBreaker,
  review: TrustBridgeHITL,
  hitl: TrustBridgeHITL,
  audit: AuditTrail,
};

export default function App() {
  const { activePage, checkBackend, toasts } = useSaarthiStore();

  useEffect(() => {
    checkBackend();
  }, []);

  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-primary)',
        }}>
          <PageComponent />
        </main>
      </div>
      <Toast toasts={toasts} />
    </div>
  );
}
