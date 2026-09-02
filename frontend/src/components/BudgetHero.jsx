import React from 'react';
import { Target, Edit3, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';

export default function BudgetHero({ budgetData, onOpenBudgetModal }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const target = budgetData?.total_budget || 0;
  const spent = budgetData?.total_spent || 0;
  const remaining = budgetData?.remaining_budget ?? (target - spent);
  const utilization = budgetData?.utilization_percentage || 0;
  const status = budgetData?.status || 'healthy';

  const cappedUtilization = Math.min(Math.max(utilization, 0), 100);

  return (
    <div className="budget-hero-card">
      <div className="budget-hero-top">
        <div className="budget-title-area">
          <h2>
            <Target size={22} color="#1d4ed8" />
            <span>Shared Company Budget</span>
            <span className={`budget-status-tag status-${status}`}>
              {status === 'healthy' && 'Within Limit'}
              {status === 'warning' && 'Approaching Cap'}
              {status === 'exceeded' && 'Budget Exceeded'}
            </span>
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '3px' }}>
            Company-wide expenditure target shared across all team members.
          </p>
        </div>

        <button
          onClick={onOpenBudgetModal}
          className="btn btn-secondary btn-sm"
          id="edit-company-budget-btn"
        >
          <Edit3 size={15} />
          <span>Adjust Budget Target</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-track" title={`${utilization}% utilized`}>
        <div
          className={`progress-bar-fill ${status === 'warning' ? 'warning' : ''} ${status === 'exceeded' ? 'exceeded' : ''}`}
          style={{ width: `${cappedUtilization}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="budget-stats-row">
        <span>
          Spent: <strong>{formatCurrency(spent)}</strong>
        </span>
        <span style={{ color: utilization > 90 ? '#e11d48' : '#2563eb', fontWeight: 700 }}>
          {utilization.toFixed(1)}% Used
        </span>
        <span>
          Remaining: <strong style={{ color: remaining < 0 ? '#e11d48' : '#059669' }}>{formatCurrency(remaining)}</strong>
        </span>
        <span>
          Target Cap: <strong>{formatCurrency(target)}</strong>
        </span>
      </div>
    </div>
  );
}
