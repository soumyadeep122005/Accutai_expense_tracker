import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, TrendingUp, DollarSign, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const BLUE_PALETTE = [
  '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#0ea5e9',
  '#0284c7', '#06b6d4', '#6366f1', '#4f46e5', '#818cf8',
  '#93c5fd', '#38bdf8', '#2dd4bf', '#14b8a6', '#059669'
];

export default function AnalyticsView({ selectedYear, selectedMonth }) {
  const [period, setPeriod] = useState('monthly');
  const [periodData, setPeriodData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [pSummary, hist] = await Promise.all([
          api.getPeriodSummary(period, selectedYear, selectedMonth),
          api.getHistoricalReport(6)
        ]);
        setPeriodData(pSummary);
        setHistoricalData(hist);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [period, selectedYear, selectedMonth]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Category Donut Chart Config
  const categoryLabels = periodData?.categories?.map((c) => c.name) || [];
  const categoryAmounts = periodData?.categories?.map((c) => c.amount) || [];

  const doughnutData = {
    labels: categoryLabels.length ? categoryLabels : ['No Expenses'],
    datasets: [
      {
        data: categoryAmounts.length ? categoryAmounts : [1],
        backgroundColor: categoryAmounts.length
          ? BLUE_PALETTE.slice(0, categoryAmounts.length)
          : ['#e2e8f0'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 14,
          font: { family: 'Inter', size: 12 },
          color: '#334155',
        },
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const val = ctx.raw || 0;
            return ` ₹${val.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    cutout: '68%',
  };

  // Historical Bar Chart Config
  const barLabels = historicalData.map((h) => h.label);
  const barIncomes = historicalData.map((h) => h.income);
  const barExpenses = historicalData.map((h) => h.expense);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Inflow (₹)',
        data: barIncomes,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Spending (₹)',
        data: barExpenses,
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { family: 'Inter', size: 12 },
          color: '#334155',
        },
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            return ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#64748b',
          callback: (val) => `₹${val.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading shared analytics data...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Period Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={22} color="#2563eb" />
            <span>Corporate Financial Analytics</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
            Period overview: {periodData?.start_date} to {periodData?.end_date}
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
          {['monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: period === p ? '#ffffff' : 'transparent',
                color: period === p ? '#1d4ed8' : '#64748b',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Donut + Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Category Breakdown Donut */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>Category Expense Distribution</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Proportion of spending across categories for selected period
            </p>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Historical 6-Month Inflow vs Spending */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>6-Month Financial Trend</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Historical cashflow trajectory (Inflow vs Spending)
            </p>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Top Expenses Ranking */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem' }}>
          Top Expense Items in Period
        </h3>
        {periodData?.top_expenses?.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#64748b', padding: '1rem 0' }}>
            No expenses recorded for this timeframe.
          </p>
        ) : (
          <div className="ledger-table-container">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Recorded By</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {periodData?.top_expenses?.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 600 }}>{tx.description || 'Expense Entry'}</td>
                    <td>
                      <span className="category-tag">{tx.category_name || 'General'}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {tx.user_email || tx.user_name || 'Team Member'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
