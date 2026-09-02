import React, { useState, useEffect } from 'react';
import { X, Target, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function BudgetModal({ isOpen, onClose, onUpdated, currentBudget = 50000 }) {
  const { success, error } = useToast();
  const [budgetVal, setBudgetVal] = useState(currentBudget);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBudgetVal(currentBudget);
  }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(budgetVal);
    if (isNaN(parsed) || parsed < 0) {
      error('Please enter a valid positive budget amount');
      return;
    }

    setSaving(true);
    try {
      await api.updateBudget(parsed);
      success('Shared company budget target updated successfully!');
      onUpdated();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to update company budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={20} color="#1d4ed8" />
            <h3>Adjust Shared Company Budget</h3>
          </div>
          <button onClick={onClose} className="btn-icon btn-outline" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '8px',
              padding: '0.85rem',
              fontSize: '0.82rem',
              color: '#1e40af'
            }}>
              <strong>Company-Wide Setting:</strong> Updating this monthly budget target updates the visible spending cap for all authenticated users across the organization.
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Target Cap (₹)*</label>
              <input
                type="number"
                step="100"
                min="0"
                required
                className="form-input"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Save Shared Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
