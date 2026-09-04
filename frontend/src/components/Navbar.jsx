import React from 'react';
import { Menu, Plus, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Navbar({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onOpenTransactionModal,
  onOpenBudgetModal,
  setIsSidebarOpen,
  pageTitle = 'Financial Dashboard'
}) {
  const { user } = useAuth();
  const years = [2024, 2025, 2026, 2027];

  return (
    <header className="topbar">
      {/* Left side: hamburger + title + status */}
      <div className="topbar-left">
        <button
          className="btn btn-outline btn-icon"
          style={{ display: 'none' }}
          onClick={() => setIsSidebarOpen(true)}
          id="mobile-menu-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="page-title-group">
          <h1>{pageTitle}</h1>
        </div>
      </div>

      {/* Right side: Period Filter + Quick Add Transaction Button */}
      <div className="topbar-right">
        {/* Month / Year selector */}
        <div className="date-selector-group">
          <Calendar size={16} color="#1d4ed8" style={{ marginLeft: '4px' }} />
          <select
            className="date-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            aria-label="Filter Month"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <span style={{ color: '#cbd5e1' }}>/</span>

          <select
            className="date-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Filter Year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Add Action */}
        <button
          onClick={onOpenTransactionModal}
          className="btn btn-primary"
          id="quick-add-transaction-btn"
        >
          <Plus size={18} />
          <span>Add Entry</span>
        </button>

        {/* User Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.35rem 0.65rem 0.35rem 0.5rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #dbeafe',
          borderRadius: '999px',
          marginLeft: '0.25rem'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a8a' }}>
              {user?.username || 'Member'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user?.email}>
              {user?.email || 'user@accutai.com'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
