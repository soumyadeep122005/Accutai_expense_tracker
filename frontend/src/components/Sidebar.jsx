import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Calendar,
  Wallet,
  LogOut,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', label: 'Shared Ledger', icon: ReceiptText, badge: 'All Team' },
    { id: 'budget', label: 'Company Budget', icon: Wallet },
    { id: 'analytics', label: 'Analytics & Reports', icon: PieChart },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <img
            src="/accutaiLOGO Small.png"
            alt="Accutai Logo"
            className="brand-logo-img"
            onError={(e) => {
              e.target.src = '/alogo1.png';
            }}
          />
        </div>

        {/* Section Title */}
        <div className="nav-section-title">Shared Ledger Portal</div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && <span className="shared-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-badge" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <div className="user-avatar">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                <span className="user-name" title={user?.username}>{user?.username || 'Team Member'}</span>
                <span className="user-email" title={user?.email}>{user?.email || 'user@accutai.com'}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{
                width: '100%',
                justifyContent: 'center',
                color: '#e11d48',
                backgroundColor: '#ffffff',
                borderColor: '#fecdd3',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '6px'
              }}
              title="Sign Out from Accutai Finance Portal"
              id="profile-signout-btn"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 35
          }}
        />
      )}
    </>
  );
}
