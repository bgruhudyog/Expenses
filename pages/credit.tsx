
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { format } from 'date-fns';
import { MdAdd } from 'react-icons/md';
import supabase from '../lib/supabase';
import TransactionModal from '../components/TransactionModal';

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
        .eq('type', 'credit')
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
      const amount = parseFloat(transaction.amount);
      
      if (transaction.creditType === 'given') {
        given += amount;
      } else { // taken
        taken += amount;
      }
    });

    setTotalGiven(given);
    setTotalTaken(taken);
  };

  const handleAddTransaction = async (newTransaction) => {
    // Ensure it's a credit transaction
    newTransaction.type = 'credit';
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();
      
      if (error) throw error;
      
      const updatedTransactions = [data[0], ...transactions];
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
      
      // Show snackbar
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
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
  
  // Apply filters
  let filteredTransactions = transactions;
  
  // Credit type filter (given/taken)
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.creditType === filter);
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
            <div key={transaction.id} className="card credit-card">
              <div className="credit-header">
                <div>
                  <h3 className="credit-description">{transaction.description}</h3>
                  <span className="credit-date">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                </div>
                <div className="credit-right">
                  <div className={`credit-amount ${transaction.creditType === 'given' ? 'given' : 'taken'}`}>
                    ₹{transaction.amount.toLocaleString()}
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
                  <span className="detail-value">{transaction.creditType === 'given' ? 'Given' : 'Received'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Wallet:</span>
                  <span className="detail-value">{transaction.walletType.charAt(0).toUpperCase() + transaction.walletType.slice(1)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{transaction.isSettled ? 'Settled' : 'Pending'}</span>
                </div>
                {transaction.isSettled && (
                  <div className="detail-item">
                    <span className="detail-label">Settled Amount:</span>
                    <span className="detail-value">₹{transaction.settledAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No credit transactions found</p>
        )}
      </div>
      
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
        .search-input, .month-input {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--paper-bg);
          color: white;
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
      `}</style>
    </div>
  );
};

export default Credit;
