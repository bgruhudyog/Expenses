
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { format } from 'date-fns';
import { MdAdd } from 'react-icons/md';
import supabase from '../lib/supabase';
import TransactionModal from '../components/TransactionModal';

const Transactions: NextPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showSnackbar, setShowSnackbar] = useState(false);

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

  const handleAddTransaction = async (newTransaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();
      
      if (error) throw error;
      
      setTransactions([data[0], ...transactions]);
      
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

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div>
      <h1>Transactions</h1>
      
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
      </div>
      
      <div className="transactions-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="card transaction-card">
              <div className="transaction-header">
                <div>
                  <h3 className="transaction-description">{transaction.description}</h3>
                  <span className="transaction-date">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                </div>
                <div className={`transaction-amount ${transaction.type === 'expense' ? 'expense' : 'income'}`}>
                  {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
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
                    <span className="detail-value">{transaction.creditType.charAt(0).toUpperCase() + transaction.creditType.slice(1)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No transactions found</p>
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
          Transaction created successfully
        </div>
      )}

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default Transactions;
