import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Edit2,
  Trash2,
  Download,
  Tag,
  User,
  ExternalLink,
  Plus,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

export default function TransactionTable({
  transactions = [],
  categories = [],
  onEdit,
  onDelete,
  onViewReceipt,
  onOpenAddModal,
  loading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Category filter
      if (selectedCategory !== 'ALL' && String(tx.category_id) !== String(selectedCategory)) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(term);
        const catMatch = (tx.category_name || '').toLowerCase().includes(term);
        const userMatch = (tx.user_email || tx.user_name || '').toLowerCase().includes(term);
        if (!descMatch && !catMatch && !userMatch) return false;
      }
      return true;
    });
  }, [transactions, searchTerm, selectedCategory, selectedType]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Logged By', 'Receipt URL'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      t.type,
      `"${(t.category_name || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.user_email || t.user_name || '',
      t.receipt_url || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `accutai_shared_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-card">
      {/* Header & Controls */}
      <div className="table-header-tools">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search description, category, user..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="ALL">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-outline btn-sm"
            title="Download CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ledger-table-container">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Recorded By</th>
              <th>Receipt / Bill</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading shared transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                    <FileText size={36} color="#94a3b8" />
                    <p style={{ fontWeight: 600, color: '#1e293b' }}>No transactions found</p>
                    <p style={{ fontSize: '0.85rem' }}>No entries match your current period or filter criteria.</p>
                    <button onClick={onOpenAddModal} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                      <Plus size={15} />
                      <span>Record First Transaction</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  {/* Date */}
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#334155' }}>
                    {formatDate(tx.date)}
                  </td>

                  {/* Category */}
                  <td>
                    <span className="category-tag">
                      <Tag size={12} />
                      <span>{tx.category_name || 'General'}</span>
                    </span>
                  </td>

                  {/* Description */}
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {tx.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description</span>}
                    </div>
                  </td>

                  {/* Logged by */}
                  <td>
                    <div className="user-badge-cell">
                      <User size={13} color="#3b82f6" />
                      <span>{tx.user_name || (tx.user_email ? tx.user_email.split('@')[0] : 'Member')}</span>
                    </div>
                  </td>

                  {/* Receipt */}
                  <td>
                    {tx.receipt_url ? (
                      <button
                        onClick={() => onViewReceipt(tx.receipt_url, tx.description)}
                        className="bill-badge-btn"
                        title="View bill or invoice"
                      >
                        <FileText size={13} />
                        <span>View Bill</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td style={{ textAlign: 'right' }}>
                    <span className={`amount-text ${tx.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                      {tx.type === 'income' ? '+ ' : '- '}
                      {formatCurrency(tx.amount)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => onEdit(tx)}
                        className="btn-icon btn-outline"
                        title="Edit transaction"
                        aria-label="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="btn-icon btn-danger-ghost"
                        title="Delete transaction"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div style={{
        padding: '0.85rem 1.5rem',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        color: '#64748b',
        backgroundColor: '#f8fafc'
      }}>
        <span>Showing {filteredTransactions.length} of {transactions.length} shared entries</span>
        <span>Corporate Shared Ledger Mode</span>
      </div>
    </div>
  );
}
