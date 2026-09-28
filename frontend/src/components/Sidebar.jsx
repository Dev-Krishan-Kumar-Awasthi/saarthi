import React, { useState } from 'react';
import {
  LayoutDashboard, Activity, FlaskConical, Shield,
  FileText, BarChart3, Users, ChevronRight, Zap, RotateCcw, X
} from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'governance', icon: Shield,          label: 'Governance' },
  { id: 'safety',     icon: Zap,             label: 'Agent Safety' },
  { id: 'review',     icon: Users,           label: 'Human Review' },
  { id: 'audit',      icon: FileText,        label: 'Audit Trail' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { activePage, setActivePage, backendConnected, backendChecked, resetDemo, humanReviews } = useSaarthiStore();
  const pendingReviews = humanReviews.filter(r => r.status === 'PENDING').length;

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #0b1a30 0%, #0284c7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 900, color: '#ffffff',
              boxShadow: '0 2px 6px rgba(11,26,48,0.2)'
            }}>S</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0b1a30', letterSpacing: '-0.02em' }}>SAARTHI</div>
              <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600, letterSpacing: '0.06em' }}>RUNTIME GOVERNANCE</div>
            </div>
          </div>

          {/* Close button on mobile/tablet */}
          <button
            onClick={onClose}
            className="mobile-menu-btn"
            style={{ display: isOpen ? 'inline-flex' : 'none', width: 30, height: 30 }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 6px 8px', marginBottom: 2 }}>
            NAVIGATION
          </div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const badge = item.id === 'review' ? pendingReviews : 0;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', marginBottom: 3 }}
              >
              <Icon size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: '#f59e0b', color: '#ffffff', borderRadius: 10,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                }}>{badge}</span>
              )}
              {isActive && <ChevronRight size={13} style={{ opacity: 0.8 }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status */}
      <div style={{ padding: '14px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fbff' }}>
        {/* Runtime Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8,
          background: '#ecfdf5', border: '1px solid #a7f3d0',
          marginBottom: 8,
        }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Runtime Active</span>
        </div>

        {/* Backend Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 6,
          background: backendConnected ? '#eff6ff' : '#fffbeb',
          border: `1px solid ${backendConnected ? '#bfdbfe' : '#fde68a'}`,
          marginBottom: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: backendConnected ? '#2563eb' : '#f59e0b',
          }} />
          <span style={{ fontSize: 10.5, color: backendConnected ? '#1d4ed8' : '#d97706', fontWeight: 600 }}>
            {!backendChecked ? 'Connecting...' : backendConnected ? 'Backend Connected' : 'Demo Mode'}
          </span>
        </div>

        {/* Reset */}
        <button
          onClick={resetDemo}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}
        >
          <RotateCcw size={12} />
          Reset Demo
        </button>
      </div>
    </aside>
    </>
  );
}
