import React from 'react';
import { ArrowDownRight, Wallet, Scale } from 'lucide-react';

export default function MetricCards({ monthlyData, budgetData }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const expense = monthlyData?.total_expense || 0;
  const targetBudget = budgetData?.total_budget || 0;
  const net = targetBudget - expense;

  return (
    <div className="metrics-grid">
      {/* Monthly Budget */}
      <div className="metric-card budget">
        <div className="metric-header">
          <span className="metric-label">Monthly Budget</span>
          <div className="metric-icon-box icon-amber">
            <Wallet size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: '#0f172a' }}>
          {formatCurrency(targetBudget)}
        </div>
        <div className="metric-footer">
          <span>Shared company spending target</span>
        </div>
      </div>

      {/* Total Expense */}
      <div className="metric-card expense">
        <div className="metric-header">
          <span className="metric-label">Monthly Spending</span>
          <div className="metric-icon-box icon-blue">
            <ArrowDownRight size={22} />
          </div>
        </div>
        <div className="metric-value" style={{ color: '#1e40af' }}>
          {formatCurrency(expense)}
        </div>
        <div className="metric-footer">
          <span>Across all verified categories</span>
        </div>
      </div>

      {/* Net Balance / Cash Flow */}
      <div className="metric-card net">
        <div className="metric-header">
          <span className="metric-label">Net Operating Cash</span>
          <div className="metric-icon-box icon-purple">
            <Scale size={20} />
          </div>
        </div>
        <div className="metric-value" style={{ color: net >= 0 ? '#0284c7' : '#e11d48' }}>
          {formatCurrency(net)}
        </div>
        <div className="metric-footer">
          <span>{net >= 0 ? 'Surplus balance' : 'Deficit balance'}</span>
        </div>
      </div>

    </div>
  );
}
