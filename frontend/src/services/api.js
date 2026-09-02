// Accutai API Client Service

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('accutai_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.isFormData ? options.headers : { ...getAuthHeaders(), ...options.headers };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('accutai_token');
    localStorage.removeItem('accutai_user');
    window.dispatchEvent(new CustomEvent('accutai_unauthorized'));
  }

  if (!res.ok) {
    let errorMsg = `Error ${res.status}`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.detail || errJson.message || errorMsg;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.map(e => e.msg || e).join(', ');
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (username, password) => {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username, email, password) => {
    return request('/users/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  getCurrentUser: async () => {
    return request('/users/me');
  },

  getGoogleAuthUrl: async () => {
    return request('/auth/google');
  },

  // Categories (Shared)
  getCategories: async () => {
    return request('/categories/');
  },

  createCategory: async (name) => {
    return request('/categories/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Transactions (Shared Ledger)
  getTransactions: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.year) q.append('year', params.year);
    if (params.month) q.append('month', params.month);
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.type) q.append('type', params.type);
    if (params.search) q.append('search', params.search);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);

    const qs = q.toString();
    return request(`/transactions/${qs ? `?${qs}` : ''}`);
  },

  createTransaction: async (txData) => {
    return request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(txData),
    });
  },

  updateTransaction: async (id, txData) => {
    return request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(txData),
    });
  },

  deleteTransaction: async (id) => {
    return request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  uploadReceipt: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accutai_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/transactions/upload-receipt`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Receipt upload failed');
    }
    return res.json();
  },

  // Budget (Shared Company Budget)
  getBudget: async (year, month) => {
    const q = new URLSearchParams();
    if (year) q.append('year', year);
    if (month) q.append('month', month);
    return request(`/budget?${q.toString()}`);
  },

  updateBudget: async (total_budget) => {
    return request('/budget', {
      method: 'PUT',
      body: JSON.stringify({ total_budget: parseFloat(total_budget) }),
    });
  },

  // Reports (Shared Calculations)
  getMonthlyReport: async (year, month) => {
    const q = new URLSearchParams();
    if (year) q.append('year', year);
    if (month) q.append('month', month);
    return request(`/reports/monthly/?${q.toString()}`);
  },

  getCalendarReport: async (year, month) => {
    const q = new URLSearchParams();
    if (year) q.append('year', year);
    if (month) q.append('month', month);
    return request(`/reports/calendar?${q.toString()}`);
  },

  getHistoricalReport: async (limit = 12) => {
    return request(`/reports/historical?limit=${limit}`);
  },

  getPeriodSummary: async (period = 'monthly', year, month) => {
    const q = new URLSearchParams();
    q.append('period', period);
    if (year) q.append('year', year);
    if (month) q.append('month', month);
    return request(`/reports/summary?${q.toString()}`);
  },
};
