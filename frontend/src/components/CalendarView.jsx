import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, DollarSign, Clock, Tag } from 'lucide-react';
import { api } from '../services/api';

export default function CalendarView({ selectedYear, selectedMonth }) {
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayData, setSelectedDayData] = useState(null);

  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const data = await api.getCalendarReport(selectedYear, selectedMonth);
        setCalendarData(data);
        if (data.length > 0) {
          // Select first day that has transactions, or day 1
          const activeDay = data.find((d) => d.transaction_count > 0) || data[0];
          setSelectedDayData(activeDay);
        }
      } catch (err) {
        console.error('Failed to load calendar report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading calendar view...
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
      {/* Calendar Grid */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={20} color="#2563eb" />
            <span>Daily Activity Calendar</span>
          </h3>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            {new Date(selectedYear, selectedMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Days Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#94a3b8', padding: '0.25rem' }}>
              {d}
            </div>
          ))}

          {/* Padding offset for first day of month */}
          {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: '78px', background: '#fafafa', borderRadius: '8px' }} />
          ))}

          {/* Calendar Days */}
          {calendarData.map((day) => {
            const dayNum = parseInt(day.date.split('-')[2], 10);
            const isSelected = selectedDayData?.date === day.date;
            const hasActivity = day.transaction_count > 0;

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayData(day)}
                style={{
                  height: '84px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.45rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#eff6ff' : (hasActivity ? '#ffffff' : '#fcfcfc'),
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? '#1d4ed8' : '#334155' }}>
                    {dayNum}
                  </span>
                  {hasActivity && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '999px'
                    }}>
                      {day.transaction_count}
                    </span>
                  )}
                </div>

                {hasActivity ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                    {day.expense > 0 && (
                      <span style={{ color: '#1e40af', fontWeight: 600 }}>
                        -{formatCurrency(day.expense)}
                      </span>
                    )}
                    {day.income > 0 && (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        +{formatCurrency(day.income)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="card" style={{ position: 'sticky', top: '90px' }}>
        <h4 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} color="#2563eb" />
          <span>{selectedDayData?.date || 'Select a day'}</span>
        </h4>

        {selectedDayData ? (
          <div>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Outflow</span>
                <p style={{ fontWeight: 700, color: '#1e40af' }}>{formatCurrency(selectedDayData.expense)}</p>
              </div>
              <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Inflow</span>
                <p style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(selectedDayData.income)}</p>
              </div>
            </div>

            <h5 style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.6rem' }}>
              Transactions ({selectedDayData.transactions.length})
            </h5>

            {selectedDayData.transactions.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No records logged on this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                {selectedDayData.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                        {tx.description || tx.category_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                        <Tag size={11} />
                        <span>{tx.category_name}</span>
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: tx.type === 'income' ? '#059669' : '#1e40af'
                    }}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Click on any date in the calendar to view its entries.</p>
        )}
      </div>
    </div>
  );
}
