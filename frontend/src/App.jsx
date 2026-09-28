import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Shield, Zap, Users, FileText } from 'lucide-react';
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

const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'governance', icon: Shield,          label: 'Governance' },
  { id: 'safety',     icon: Zap,             label: 'Safety' },
  { id: 'review',     icon: Users,           label: 'Review' },
  { id: 'audit',      icon: FileText,        label: 'Audit' },
];

export default function App() {
  const { activePage, setActivePage, checkBackend, toasts, humanReviews } = useSaarthiStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pendingReviews = humanReviews.filter(r => r.status === 'PENDING').length;

  useEffect(() => {
    checkBackend();
  }, []);

  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        
        <main className="responsive-main" style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-primary)',
        }}>
          <PageComponent />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phone thumb access) */}
      <nav className="mobile-bottom-nav">
        {BOTTOM_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badge = item.id === 'review' ? pendingReviews : 0;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {badge > 0 && <span className="mobile-nav-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      <Toast toasts={toasts} />
    </div>
  );
}
