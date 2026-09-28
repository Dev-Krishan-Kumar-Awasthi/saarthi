import React, { useState } from 'react';
import { Bell, Search, Shield, Cpu, Database, CheckCircle2, X } from 'lucide-react';
import { useSaarthiStore } from '../store/saarthiStore';

export default function Header() {
  const { notifications, markNotificationsRead, backendConnected } = useSaarthiStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const unread = notifications.filter(n => !n.read).length;

  const colorMap = { warning: '#d97706', error: '#dc2626', info: '#2563eb', success: '#059669' };

  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events, workflows, customers..."
          style={{
            width: '100%', padding: '7px 12px 7px 32px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, color: '#0b1a30', fontSize: 13, outline: 'none',
            fontFamily: 'inherit', transition: 'all 0.15s ease'
          }}
          onFocus={e => e.target.style.borderColor = '#93c5fd'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* System Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
        <StatusPill icon={Cpu} label="Agent" status="CONNECTED" color="#059669" />
        <StatusPill icon={Shield} label="Governance" status="ACTIVE" color="#2563eb" />
        <StatusPill icon={Database} label="Audit" status="VERIFIED" color="#0284c7" />

        {/* Demo Mode */}
        {!backendConnected && (
          <span style={{
            padding: '3px 10px', background: '#fffbeb',
            border: '1px solid #fde68a', borderRadius: 20,
            fontSize: 10.5, color: '#d97706', fontWeight: 700, letterSpacing: '0.05em',
          }}>DEMO MODE</span>
        )}

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markNotificationsRead(); }}
            style={{
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '7px 9px', cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', color: '#475569',
              boxShadow: '0 1px 3px rgba(11,26,48,0.04)'
            }}
          >
            <Bell size={15} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: '#dc2626', color: '#ffffff', fontSize: 9, fontWeight: 700,
                borderRadius: 10, padding: '0 4px', minWidth: 14, textAlign: 'center', lineHeight: '14px',
              }}>{unread}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 12, width: 340, zIndex: 50,
              boxShadow: '0 16px 40px rgba(11,26,48,0.12)',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1a30' }}>Notifications</span>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 && (
                  <div style={{ padding: 20, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No notifications</div>
                )}
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
                    borderLeft: `3px solid ${colorMap[n.type] || '#2563eb'}`,
                    background: n.read ? '#ffffff' : '#f8fbff',
                  }}>
                    <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>
                      {new Date(n.ts).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label, status, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon size={12} style={{ color }} />
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>● {status}</span>
    </div>
  );
}
