import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { api } from './services/api';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import BudgetHero from './components/BudgetHero';
import TransactionTable from './components/TransactionTable';
import TransactionModal from './components/TransactionModal';
import BudgetModal from './components/BudgetModal';
import ReceiptModal from './components/ReceiptModal';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import LoginPage from './components/LoginPage';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { success, error, info } = useToast();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear() === 2026 ? 2026 : now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, url: '', description: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch all shared data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      const [txList, catList, bData, mData] = await Promise.all([
        api.getTransactions(),
        api.getCategories(),
        api.getBudget(selectedYear, selectedMonth),
        api.getMonthlyReport(selectedYear, selectedMonth)
      ]);
      setTransactions(txList);
      setCategories(catList);
      setBudgetData(bData);
      setMonthlyData(mData);
    } catch (err) {
      console.error('Error loading shared data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleOpenAddTx = () => {
    setEditTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTx = (tx) => {
    setEditTx(tx);
    setIsTxModalOpen(true);
  };

  const handleDeleteTx = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shared transaction? It will be removed for everyone.')) {
      return;
    }
    try {
      await api.deleteTransaction(id);
      success('Transaction removed from shared ledger');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete transaction');
    }
  };

  const handleViewReceipt = (url, desc) => {
    setReceiptModal({ isOpen: true, url, description: desc });
  };

  const handleCategoryCreated = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
  };

  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#1e40af',
        fontWeight: 600
      }}>
        Initializing Accutai Corporate Finance Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'ledger': return 'Shared Company Ledger';
      case 'budget': return 'Company Budget Management';
      case 'analytics': return 'Financial Analytics & Reports';
      case 'calendar': return 'Monthly Activity Calendar';
      default: return 'Finance Overview Dashboard';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onOpenTransactionModal={handleOpenAddTx}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          setIsSidebarOpen={setIsSidebarOpen}
          pageTitle={getPageTitle()}
        />

        <main className="content-wrapper">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <>
              <MetricCards monthlyData={monthlyData} budgetData={budgetData} />

              <BudgetHero
                budgetData={budgetData}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              />

              <div style={{ marginTop: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', color: '#1e3a8a' }}>Recent Shared Transactions</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Showing latest activity recorded by the organization team.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('ledger')}
                    className="btn btn-secondary btn-sm"
                  >
                    View All in Ledger →
                  </button>
                </div>

                <TransactionTable
                  transactions={transactions.slice(0, 8)}
                  categories={categories}
                  onEdit={handleEditTx}
                  onDelete={handleDeleteTx}
                  onViewReceipt={handleViewReceipt}
                  onOpenAddModal={handleOpenAddTx}
                  loading={dataLoading}
                />
              </div>
            </>
          )}

          {/* TAB 2: SHARED LEDGER */}
          {currentTab === 'ledger' && (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                  This ledger contains every transaction entered by authenticated @accutai.com employees.
                  All entries and receipt vouchers are shared in real-time.
                </p>
              </div>

              <TransactionTable
                transactions={transactions}
                categories={categories}
                onEdit={handleEditTx}
                onDelete={handleDeleteTx}
                onViewReceipt={handleViewReceipt}
                onOpenAddModal={handleOpenAddTx}
                loading={dataLoading}
              />
            </>
          )}

          {/* TAB 3: COMPANY BUDGET */}
          {currentTab === 'budget' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <BudgetHero
                budgetData={budgetData}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              />

              <div className="card">
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  Category Breakdown vs Shared Spending
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Expenses categorized for current month against overall budget.
                </p>

                {monthlyData?.category_breakdown?.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No expenses recorded this month.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {monthlyData?.category_breakdown?.map((item) => (
                      <div key={item.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>
                            ₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS & REPORTS */}
          {currentTab === 'analytics' && (
            <AnalyticsView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          )}

          {/* TAB 5: CALENDAR VIEW */}
          {currentTab === 'calendar' && (
            <CalendarView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          )}
        </main>
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSaved={fetchData}
        editTx={editTx}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Budget Adjust Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onUpdated={fetchData}
        currentBudget={budgetData?.total_budget || 50000}
      />

      {/* Receipt View Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, url: '', description: '' })}
        receiptUrl={receiptModal.url}
        description={receiptModal.description}
      />
    </div>
  );
}
