
import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  categories 
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [walletType, setWalletType] = useState('cash');
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('');
  const [creditType, setCreditType] = useState('given');
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setType('expense');
      setWalletType('cash');
      setCategoryId('');
      setIsRecurring(false);
      setRecurringInterval('');
      setCreditType('given');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !description) {
      alert('Please fill all required fields');
      return;
    }

    // Try to determine if the creditType column exists
    let includesCreditType = true;
    
    try {
      // Check if the table has the creditType column
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error checking schema:', error);
        includesCreditType = false;
      }
    } catch (error) {
      console.error('Error checking schema:', error);
      includesCreditType = false;
    }

    const newTransaction = {
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(),
      type,
      walletType,
      categoryId: categoryId ? parseInt(categoryId) : null,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null,
      isSettled: false,
      settledAmount: 0
    };

    // If credit, adjust based on given/taken
    if (type === 'credit') {
      if (includesCreditType) {
        newTransaction.creditType = creditType;
      } else {
        // If creditType column doesn't exist, include it in description as a workaround
        newTransaction.description = `[${creditType.toUpperCase()}] ${description}`;
      }
    }

    try {
      onAddTransaction(newTransaction);
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Transaction</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="toggle-group">
              <div 
                className={`toggle-item ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </div>
              <div 
                className={`toggle-item ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </div>
              <div 
                className={`toggle-item ${type === 'credit' ? 'active' : ''}`}
                onClick={() => setType('credit')}
              >
                Credit
              </div>
            </div>
          </div>
          
          {type === 'credit' && (
            <div className="form-group">
              <label className="form-label">Credit Type</label>
              <div className="toggle-group">
                <div 
                  className={`toggle-item ${creditType === 'given' ? 'active' : ''}`}
                  onClick={() => setCreditType('given')}
                >
                  Given
                </div>
                <div 
                  className={`toggle-item ${creditType === 'taken' ? 'active' : ''}`}
                  onClick={() => setCreditType('taken')}
                >
                  Taken
                </div>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Wallet Type</label>
            <div className="toggle-group">
              <div 
                className={`toggle-item ${walletType === 'cash' ? 'active' : ''}`}
                onClick={() => setWalletType('cash')}
              >
                Cash
              </div>
              <div 
                className={`toggle-item ${walletType === 'digital' ? 'active' : ''}`}
                onClick={() => setWalletType('digital')}
              >
                Digital
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Amount (₹)</label>
            <input 
              type="number" 
              className="form-input" 
              id="amount"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <input 
              type="text" 
              className="form-input" 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select 
              className="form-input" 
              id="category"
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories && categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="isRecurring"
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <label htmlFor="isRecurring">Recurring Payment</label>
          </div>
          
          {isRecurring && (
            <div className="form-group">
              <label className="form-label" htmlFor="recurringInterval">Interval</label>
              <select 
                className="form-input" 
                id="recurringInterval"
                value={recurringInterval} 
                onChange={(e) => setRecurringInterval(e.target.value)}
                required={isRecurring}
              >
                <option value="">Select interval</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
          
          <div className="form-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Transaction
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        h2 {
          margin-top: 0;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
