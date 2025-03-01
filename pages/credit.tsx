
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

  const handleAddTransaction = async (newTransaction: Partial<Transaction>) => {
    // Ensure it's properly marked as a credit transaction
    // The actual type (income/expense) is already determined in the modal
    // based on whether it's credit given or taken
    const creditTransaction: Transaction = {
      ...newTransaction as Transaction,
      // Don't override the type here - use the one from the modal
      // which should be either 'income' or 'expense' based on creditType
      isSettled: false,
      settledAmount: 0,
    };
    
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
      setSnackbarMessage('Credit transaction added successfully');
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction: ' + (error.message || 'Unknown error'));
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
            <div key={transaction.id} className={`card credit-card ${transaction.isSettled ? 'settled' : ''}`}>
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
