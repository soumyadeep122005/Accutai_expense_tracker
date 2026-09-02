import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, receiptUrl, description }) {
  if (!isOpen || !receiptUrl) return null;

  const isPdf = receiptUrl.toLowerCase().includes('.pdf');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Receipt / Expense Bill</h3>
            {description && (
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                {description}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-icon btn-outline" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
          {isPdf ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <FileText size={64} color="#2563eb" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600, color: '#1e293b' }}>PDF Document Bill Attached</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                This invoice is stored as a PDF file in Supabase Storage.
              </p>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ marginTop: '1.25rem' }}
              >
                <ExternalLink size={16} />
                <span>Open PDF in Viewer</span>
              </a>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <img
                src={receiptUrl}
                alt="Receipt Proof"
                style={{
                  maxWidth: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML += `
                    <div style="padding: 2rem; color: #64748b;">
                      <p>Unable to preview image directly.</p>
                      <a href="${receiptUrl}" target="_blank" class="btn btn-secondary" style="margin-top: 1rem;">
                        Open File Link
                      </a>
                    </div>
                  `;
                }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={15} />
            <span>Open Original in Tab</span>
          </a>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
