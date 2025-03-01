
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { format } from 'date-fns';
import { MdAdd, MdWifiOff, MdCloudUpload } from 'react-icons/md';
import supabase from '../lib/supabase';
import TransactionModal from '../components/TransactionModal';
import { 
  storeOfflineTransaction,
  getOfflineTransactions,
  removeOfflineTransaction,
  isOnline,
  clearOfflineTransactions
} from '../lib/offlineStorage';

const Transactions: NextPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasOfflineTransactions, setHasOfflineTransactions] = useState(false);

  // Check online status
  useEffect(() => {
    // Initial check
    setIsOfflineMode(!isOnline());
    
    // Check for existing offline transactions
    const offlineTransactions = getOfflineTransactions();
    setHasOfflineTransactions(offlineTransactions.length > 0);
    
    // Add to the displayed transactions
    if (offlineTransactions.length > 0) {
      setTransactions(prev => [...offlineTransactions, ...prev]);
    }
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOfflineMode(false);
      showMessage('You are back online');
      syncOfflineTransactions();
    };
    
    const handleOffline = () => {
      setIsOfflineMode(true);
      showMessage('You are offline. Transactions will be saved locally.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Function to sync offline transactions when back online
  const syncOfflineTransactions = async () => {
    const offlineTransactions = getOfflineTransactions();
    
    if (offlineTransactions.length === 0) return;
    
    showMessage(`Syncing ${offlineTransactions.length} offline transactions...`);
    
    for (const transaction of offlineTransactions) {
      try {
        // Remove offline specific properties
        const { offlineId, isOffline, ...syncTransaction } = transaction;
        
        const { error } = await supabase
          .from('transactions')
          .insert([syncTransaction]);
        
        if (error) {
          console.error('Error syncing transaction:', error);
          continue;
        }
        
        // Remove from offline storage once synced
        removeOfflineTransaction(offlineId);
      } catch (error) {
        console.error('Error syncing transaction:', error);
      }
    }
    
    // Refresh transactions
    fetchTransactions();
    
    // Check if all transactions are synced
    const remainingOffline = getOfflineTransactions();
    setHasOfflineTransactions(remainingOffline.length > 0);
    
    showMessage(
      remainingOffline.length > 0
        ? `Synced some transactions. ${remainingOffline.length} remaining.`
        : 'All transactions synced successfully!'
    );
  };

  const handleAddTransaction = async (newTransaction) => {
    // Check if online
    if (!isOnline()) {
      // Store offline
      const offlineTransaction = storeOfflineTransaction(newTransaction);
      
      if (offlineTransaction) {
        // Add to displayed transactions
        setTransactions([offlineTransaction, ...transactions]);
        setHasOfflineTransactions(true);
        
        // Show offline message
        showMessage('Transaction saved offline');
      } else {
        alert('Failed to save transaction offline');
      }
      return;
    }
    
    // Online flow
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();
      
      if (error) throw error;
      
      setTransactions([data[0], ...transactions]);
      
      // Show snackbar
      showMessage('Transaction added successfully');
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      // If there's an error with the online submission, save offline as fallback
      const offlineTransaction = storeOfflineTransaction(newTransaction);
      
      if (offlineTransaction) {
        setTransactions([offlineTransaction, ...transactions]);
        setHasOfflineTransactions(true);
        showMessage('Server error. Transaction saved offline.');
      } else {
        alert('Failed to add transaction');
      }
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
        
      if (error) throw error;
      
      // Update transactions list
      setTransactions(transactions.filter(t => t.id !== transaction.id));
      
      // Show success message
      showMessage('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  // Apply filters
  let filteredTransactions = transactions;
  
  // Type filter (expense, income, etc)
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === filter);
  }
  
  // Search filter
  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Month filter
  if (monthFilter) {
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const [year, month] = monthFilter.split('-');
      return (
        transactionDate.getFullYear() === parseInt(year) && 
        transactionDate.getMonth() === parseInt(month) - 1
      );
    });
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div>
      <h1>Transactions</h1>
      
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="month-input"
        />
      </div>
      
      <div className="filters">
        <div 
          className={`filter-item ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </div>
        <div 
          className={`filter-item ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Expenses
        </div>
        <div 
          className={`filter-item ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Income
        </div>
        <div 
          className={`filter-item ${filter === 'credit' ? 'active' : ''}`}
          onClick={() => setFilter('credit')}
        >
          Credit
        </div>
      </div>
      
      <div className="transactions-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id || transaction.offlineId} className={`card transaction-card ${transaction.isOffline ? 'offline-transaction' : ''}`}>
              <div className="transaction-header">
                <div>
                  <h3 className="transaction-description">{transaction.description}</h3>
                  <span className="transaction-date">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                </div>
                <div className="transaction-right">
                  <div className={`transaction-amount ${transaction.type === 'expense' ? 'expense' : (transaction.type === 'income' ? 'income' : 'credit')}`}>
                    {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTransaction(transaction);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="transaction-details">
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wallet:</span>
                  <span className="detail-value">{transaction.walletType.charAt(0).toUpperCase() + transaction.walletType.slice(1)}</span>
                </div>
                {transaction.categoryId && (
                  <div className="detail-item">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{getCategoryName(transaction.categoryId)}</span>
                  </div>
                )}
                {transaction.isRecurring && (
                  <div className="detail-item">
                    <span className="detail-label">Recurring:</span>
                    <span className="detail-value">{transaction.recurringInterval.charAt(0).toUpperCase() + transaction.recurringInterval.slice(1)}</span>
                  </div>
                )}
                {transaction.type === 'credit' && (
                  <div className="detail-item">
                    <span className="detail-label">Credit Type:</span>
                    <span className="detail-value">{transaction.creditType ? 'Given' : 'Taken'}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No transactions found</p>
        )}
      </div>
      
      {isOfflineMode && (
        <div className="offline-banner">
          <MdWifiOff size={18} />
          <span>You are offline. Transactions will be saved locally.</span>
        </div>
      )}
      
      {!isOfflineMode && hasOfflineTransactions && (
        <div className="sync-banner" onClick={syncOfflineTransactions}>
          <MdCloudUpload size={18} />
          <span>Sync offline transactions</span>
        </div>
      )}

      <div className="fab" onClick={() => setIsModalOpen(true)}>
        <MdAdd size={24} />
      </div>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        categories={categories}
      />
      
      {showSnackbar && (
        <div className="snackbar">
          {snackbarMessage || 'Transaction created successfully'}
        </div>
      )}

      <style jsx>{`
        .search-filter {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .search-input, .month-input {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--paper-bg);
          color: white;
        }
        .filters {
          display: flex;
          margin-bottom: 16px;
          background-color: var(--paper-bg);
          border-radius: 8px;
          overflow: hidden;
        }
        .filter-item {
          flex: 1;
          text-align: center;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .filter-item.active {
          background-color: var(--primary);
          color: white;
        }
        .transactions-list {
          margin-bottom: 80px;
        }
        .transaction-card {
          margin-bottom: 16px;
          position: relative;
        }
        .offline-transaction {
          border: 1px dashed #ff9800;
        }
        .offline-transaction::after {
          content: 'Offline';
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: #ff9800;
          color: black;
          font-size: 0.6rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .transaction-description {
          margin: 0;
          margin-bottom: 4px;
          font-size: 1.1rem;
        }
        .transaction-date {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .transaction-amount {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .transaction-amount.expense {
          color: #ef4444;
        }
        .transaction-amount.income {
          color: var(--success);
        }
        .transaction-amount.credit {
          color: var(--accent);
        }
        .transaction-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .delete-btn {
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .transaction-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--divider);
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4px;
        }
        .detail-value {
          font-weight: 500;
        }
        .empty-state {
          text-align: center;
          padding: 48px 0;
          color: rgba(255, 255, 255, 0.7);
        }
        .offline-banner {
          position: fixed;
          bottom: 80px;
          left: 16px;
          right: 16px;
          background-color: #ff9800;
          color: black;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }
        .sync-banner {
          position: fixed;
          bottom: 80px;
          left: 16px;
          right: 16px;
          background-color: var(--primary);
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 10;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Transactions;
