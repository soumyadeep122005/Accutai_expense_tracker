import React, { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, PlusCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { uploadReceiptDirect } from '../services/supabase';
import { useToast } from '../context/ToastContext';

export default function TransactionModal({
  isOpen,
  onClose,
  onSaved,
  editTx = null,
  categories = [],
  onCategoryCreated
}) {
  const { success, error } = useToast();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline custom category
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (editTx) {
      setType(editTx.type || 'expense');
      setAmount(editTx.amount || '');
      setCategoryId(editTx.category_id || (categories.length ? categories[0].id : ''));
      setDescription(editTx.description || '');
      setDate(editTx.date ? new Date(editTx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setReceiptUrl(editTx.receipt_url || '');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId(categories.length ? categories[0].id : '');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setReceiptUrl('');
      setFileToUpload(null);
    }
  }, [editTx, categories, isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const created = await api.createCategory(newCategoryName.trim());
      if (onCategoryCreated) onCategoryCreated(created);
      setCategoryId(created.id);
      setIsAddingCategory(false);
      setNewCategoryName('');
      success(`Category "${created.name}" created!`);
    } catch (err) {
      error(err.message || 'Failed to create category');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        error('File size cannot exceed 10MB');
        return;
      }
      setFileToUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      error('Please enter a valid amount greater than 0');
      return;
    }

    setSaving(true);
    let finalReceiptUrl = receiptUrl;

    // Upload receipt to Supabase Storage if new file selected
    if (fileToUpload) {
      setUploading(true);
      try {
        // Try direct Supabase JS upload first
        const directUrl = await uploadReceiptDirect(fileToUpload);
        if (directUrl) {
          finalReceiptUrl = directUrl;
        } else {
          // Fallback to backend API upload
          const uploadRes = await api.uploadReceipt(fileToUpload);
          finalReceiptUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn('Receipt upload warning, falling back:', err);
        try {
          const uploadRes = await api.uploadReceipt(fileToUpload);
          finalReceiptUrl = uploadRes.url;
        } catch (backendErr) {
          error('Could not upload receipt, saving transaction without file.');
        }
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      amount: parseFloat(amount),
      type,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
      description: description.trim() || null,
      date: new Date(date).toISOString(),
      receipt_url: finalReceiptUrl || null
    };

    try {
      if (editTx) {
        await api.updateTransaction(editTx.id, payload);
        success('Transaction updated successfully');
      } else {
        await api.createTransaction(payload);
        success('Transaction recorded in shared ledger');
      }
      onSaved();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>{editTx ? 'Edit Transaction' : 'Record New Transaction'}</h3>
          <button onClick={onClose} className="btn-icon btn-outline" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type selector (Budget / Expense) */}
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => setType('income')}
              >
                Budget
              </button>
            </div>

            {/* Amount & Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)*</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date*</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Category*</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}
                >
                  {isAddingCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {!isAddingCategory ? (
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="New category name..."
                    className="form-input"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="btn btn-secondary btn-sm"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description / Purpose</label>
              <input
                type="text"
                placeholder="e.g. AWS Cloud Hosting, Team Catering, Client Retainer"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Receipt Upload to Supabase */}
            <div className="form-group">
              <label className="form-label">Receipt or Invoice (Supabase Cloud)</label>
              <div style={{
                border: '1px dashed #cbd5e1',
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: '#f8fafc'
              }}>
                <input
                  type="file"
                  id="receipt-upload-input"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="receipt-upload-input" style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <Upload size={24} color="#3b82f6" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1d4ed8' }}>
                    {fileToUpload ? fileToUpload.name : (receiptUrl ? 'Change Receipt File' : 'Upload Bill / Invoice')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PNG, JPG, WEBP, or PDF up to 10MB</span>
                </label>
                {receiptUrl && !fileToUpload && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#059669' }}>
                    ✓ Current receipt attached
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (editTx ? 'Update Entry' : 'Record Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
