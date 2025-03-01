
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

const Credit: NextPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [totalGiven, setTotalGiven] = useState(0);
  const [totalTaken, setTotalTaken] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [partialSettlementId, setPartialSettlementId] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    fetchCreditTransactions();
    fetchCategories();
  }, []);
  
  const showMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  const fetchCreditTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .not('creditType', 'is', null)  // Look for transactions where creditType is not null
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setTransactions(data || []);
      calculateTotals(data || []);
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
    }
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

  const calculateTotals = (transactionList) => {
    let given = 0;
    let taken = 0;

    transactionList.forEach(transaction => {
      if (!transaction.isSettled) {
        const amount = parseFloat(transaction.amount);
        const remainingAmount = amount - (transaction.settledAmount || 0);
        
        if (transaction.creditType === true) {
          given += remainingAmount;
        } else { // taken (false)
          taken += remainingAmount;
        }
      }
    });

    setTotalGiven(given);
    setTotalTaken(taken);
  };

  // Define Transaction interface
  interface Transaction {
    id?: number;
    amount: number;
    description: string;
    date: string;
    type: string;
    walletType: string;
    categoryId: number | null;
    isRecurring: boolean;
    recurringInterval: string | null;
    isSettled: boolean;
    settledAmount: number;
    creditType: boolean | null;
  }

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasOfflineTransactions, setHasOfflineTransactions] = useState(false);

  // Check online status
  useEffect(() => {
    // Initial check
    setIsOfflineMode(!isOnline());
    
    // Check for existing offline transactions
    const offlineTransactions = getOfflineTransactions().filter(t => t.creditType !== null);
    setHasOfflineTransactions(offlineTransactions.length > 0);
    
    // Add to the displayed transactions
    if (offlineTransactions.length > 0) {
      const combined = [...offlineTransactions, ...transactions];
      setTransactions(combined);
      calculateTotals(combined);
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
    const offlineTransactions = getOfflineTransactions().filter(t => t.creditType !== null);
    
    if (offlineTransactions.length === 0) return;
    
    showMessage(`Syncing ${offlineTransactions.length} offline credit transactions...`);
    
    for (const transaction of offlineTransactions) {
      try {
        // Remove offline specific properties
        const { offlineId, isOffline, ...syncTransaction } = transaction;
        
        const { error } = await supabase
          .from('transactions')
          .insert([syncTransaction]);
        
        if (error) {
          console.error('Error syncing credit transaction:', error);
          continue;
        }
        
        // Remove from offline storage once synced
        removeOfflineTransaction(offlineId);
      } catch (error) {
        console.error('Error syncing credit transaction:', error);
      }
    }
    
    // Refresh transactions
    fetchCreditTransactions();
    
    // Check if all transactions are synced
    const remainingOffline = getOfflineTransactions().filter(t => t.creditType !== null);
    setHasOfflineTransactions(remainingOffline.length > 0);
    
    showMessage(
      remainingOffline.length > 0
        ? `Synced some transactions. ${remainingOffline.length} remaining.`
        : 'All credit transactions synced successfully!'
    );
  };

  const handleAddTransaction = async (newTransaction: Partial<Transaction>) => {
    // Ensure it's properly marked as a credit transaction
    const creditTransaction: Transaction = {
      ...newTransaction as Transaction,
      isSettled: false,
      settledAmount: 0,
    };
    
    // Check if online
    if (!isOnline()) {
      // Store offline
      const offlineTransaction = storeOfflineTransaction(creditTransaction);
      
      if (offlineTransaction) {
        // Add to displayed transactions
        const updatedTransactions = [offlineTransaction, ...transactions];
        setTransactions(updatedTransactions);
        calculateTotals(updatedTransactions);
        setHasOfflineTransactions(true);
        
        // Show offline message
        showMessage('Credit transaction saved offline');
      } else {
        alert('Failed to save credit transaction offline');
      }
      return;
    }
    
    // Online flow
    try {
      console.log('Adding credit transaction:', creditTransaction);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([creditTransaction])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      const updatedTransactions = [data[0], ...transactions];
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
      
      // Show snackbar
      showMessage('Credit transaction added successfully');
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      // If there's an error with the online submission, save offline as fallback
      const offlineTransaction = storeOfflineTransaction(creditTransaction);
      
      if (offlineTransaction) {
        const updatedTransactions = [offlineTransaction, ...transactions];
        setTransactions(updatedTransactions);
        calculateTotals(updatedTransactions);
        setHasOfflineTransactions(true);
        showMessage('Server error. Credit transaction saved offline.');
      } else {
        alert('Failed to add credit transaction: ' + (error.message || 'Unknown error'));
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
      const updatedTransactions = transactions.filter(t => t.id !== transaction.id);
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
      
      // Show success message
      showMessage('Credit transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleSettlement = async (transaction, isFullSettlement, settleAmount) => {
    if (!settleAmount || settleAmount <= 0) {
      alert('Please enter a valid settlement amount');
      return;
    }

    // Check if the amount exceeds the remaining balance
    const remainingAmount = transaction.amount - (transaction.settledAmount || 0);
    if (settleAmount > remainingAmount) {
      alert(`The settlement amount cannot exceed the remaining balance: ₹${remainingAmount}`);
      return;
    }

    try {
      // Create a mirror transaction to adjust the balance
      const newTransaction = {
        date: new Date().toISOString(),
        walletType: transaction.walletType,
        type: "",
        categoryId: transaction.categoryId,
        amount: parseFloat(settleAmount),
        description: transaction.creditType 
          ? `Received from: ${transaction.description}` 
          : `Paid to: ${transaction.description}`
      };

      // Adjust balances based on credit type
      if (transaction.creditType) {  // Credit given (true)
        newTransaction.type = 'income'; // Money coming back
      } else {  // Credit taken (false)
        newTransaction.type = 'expense'; // Money going out
      }

      // Create the mirror transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([newTransaction]);
        
      if (insertError) throw insertError;

      // Update the original credit transaction with settlement details
      const updatedTransaction = {
        settledAmount: (transaction.settledAmount || 0) + parseFloat(settleAmount),
        isSettled: isFullSettlement || ((transaction.settledAmount || 0) + parseFloat(settleAmount) >= transaction.amount)
      };

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updatedTransaction)
        .eq('id', transaction.id);
        
      if (updateError) throw updateError;
      
      // Refresh transactions data
      fetchCreditTransactions();
      setPartialSettlementId(null);
      setPartialAmount('');
      
      // Show success message
      showMessage(isFullSettlement 
        ? 'Credit fully settled successfully' 
        : 'Credit partially settled successfully');
    } catch (error) {
      console.error('Error settling transaction:', error);
      alert('Failed to settle transaction');
    }
  };
  
  // Apply filters
  let filteredTransactions = transactions;
  
  // Credit type filter (given/taken)
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => 
      filter === 'given' ? t.creditType === true : t.creditType === false
    );
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
      try {
        const transactionDate = new Date(t.date);
        const [year, month] = monthFilter.split('-');
        
        // Add logging to debug date parsing
        console.log('Transaction date:', t.date, 'Parsed as:', transactionDate);
        console.log('Filter:', year, month);
        
        return (
          transactionDate.getFullYear() === parseInt(year) && 
          transactionDate.getMonth() === parseInt(month) - 1
        );
      } catch (error) {
        console.error('Error filtering by date:', error, t.date);
        return false;
      }
    });
  }

  return (
    <div>
      <h1>Credit Tracking</h1>
      
      <div className="summaries">
        <div className="card summary-card">
          <h3>You Gave</h3>
          <p className="amount">₹{totalGiven.toLocaleString()}</p>
        </div>
        <div className="card summary-card">
          <h3>You Received</h3>
          <p className="amount">₹{totalTaken.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search credits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <div className="month-filter-container">
          <label htmlFor="month-filter" className="month-label">Filter by month:</label>
          <input
            id="month-filter"
            type="month"
            value={monthFilter}
            onChange={(e) => {
              console.log('Selected month:', e.target.value);
              setMonthFilter(e.target.value);
            }}
            className="month-input"
          />
          {monthFilter && (
            <button 
              className="clear-filter" 
              onClick={() => setMonthFilter('')}
              title="Clear filter"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="filters">
        <div 
          className={`filter-item ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </div>
        <div 
          className={`filter-item ${filter === 'given' ? 'active' : ''}`}
          onClick={() => setFilter('given')}
        >
          Given
        </div>
        <div 
          className={`filter-item ${filter === 'taken' ? 'active' : ''}`}
          onClick={() => setFilter('taken')}
        >
          Received
        </div>
      </div>
      
      <div className="credit-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id || transaction.offlineId} className={`card credit-card ${transaction.isSettled ? 'settled' : ''} ${transaction.isOffline ? 'offline-transaction' : ''}`}>
              <div className="credit-header">
                <div>
                  <h3 className={`credit-description ${transaction.isSettled ? 'strikethrough' : ''}`}>
                    {transaction.description}
                  </h3>
                  <span className="credit-date">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                </div>
                <div className="credit-right">
                  <div className={`credit-amount ${transaction.creditType ? 'given' : 'taken'}`}>
                    ₹{(transaction.isSettled 
                      ? transaction.amount 
                      : (transaction.amount - (transaction.settledAmount || 0))).toLocaleString()}
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
              
              <div className="credit-details">
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{transaction.creditType ? 'Given' : 'Taken'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wallet:</span>
                  <span className="detail-value">{transaction.walletType.charAt(0).toUpperCase() + transaction.walletType.slice(1)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{transaction.isSettled ? 'Settled' : 'Pending'}</span>
                </div>
                {transaction.settledAmount > 0 && !transaction.isSettled && (
                  <div className="detail-item">
                    <span className="detail-label">Partially Settled:</span>
                    <span className="detail-value">₹{transaction.settledAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {!transaction.isSettled && (
                <div className="settlement-options">
                  {transaction.creditType ? (
                    <>
                      <button 
                        className="btn-settlement"
                        onClick={() => handleSettlement(transaction, true, transaction.amount)}
                      >
                        Received in Full
                      </button>
                      <button 
                        className="btn-settlement"
                        onClick={() => setPartialSettlementId(transaction.id)}
                      >
                        Received Partially
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn-settlement"
                        onClick={() => handleSettlement(transaction, true, transaction.amount)}
                      >
                        Paid in Full
                      </button>
                      <button 
                        className="btn-settlement"
                        onClick={() => setPartialSettlementId(transaction.id)}
                      >
                        Paid Partially
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {partialSettlementId === transaction.id && (
                <div className="partial-settlement">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="form-input"
                  />
                  <div className="settlement-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => handleSettlement(transaction, false, parseFloat(partialAmount))}
                    >
                      Submit
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setPartialSettlementId(null);
                        setPartialAmount('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">No credit transactions found</p>
        )}
      </div>
      
      {isOfflineMode && (
        <div className="offline-banner">
          <MdWifiOff size={18} />
          <span>You are offline. Credit transactions will be saved locally.</span>
        </div>
      )}
      
      {!isOfflineMode && hasOfflineTransactions && (
        <div className="sync-banner" onClick={syncOfflineTransactions}>
          <MdCloudUpload size={18} />
          <span>Sync offline credit transactions</span>
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
          {snackbarMessage || 'Credit transaction added successfully'}
        </div>
      )}

      <style jsx>{`
        .search-filter {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .search-input {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--paper-bg);
          color: white;
        }
        .month-filter-container {
          display: flex;
          flex-direction: column;
          position: relative;
          width: 40%;
        }
        .month-label {
          font-size: 0.8rem;
          margin-bottom: 4px;
          color: rgba(255, 255, 255, 0.7);
        }
        .month-input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--paper-bg);
          color: white;
        }
        .clear-filter {
          position: absolute;
          right: 10px;
          top: 32px;
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          height: 20px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .clear-filter:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .summaries {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .summary-card {
          text-align: center;
          padding: 16px;
        }
        .summary-card h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1rem;
        }
        .amount {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
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
        .credit-list {
          margin-bottom: 80px;
        }
        .credit-card {
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
        .credit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .credit-description {
          margin: 0;
          margin-bottom: 4px;
          font-size: 1.1rem;
        }
        .credit-date {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .credit-amount {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .credit-amount.given {
          color: #ef4444;
        }
        .credit-amount.taken {
          color: var(--success);
        }
        .credit-right {
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
        .credit-details {
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

export default Credit;
