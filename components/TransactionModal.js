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
  const [walletType, setWalletType] = useState('digital'); // Default to digital
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('');
  const [creditType, setCreditType] = useState(true); // Default to given (true)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setType('expense');
      setWalletType('digital'); // Default to digital
      setCategoryId('');
      setIsRecurring(false);
      setRecurringInterval('');
      setCreditType(true); // Default to given (true)
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !description) {
      alert('Please fill all required fields');
      return;
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

    // Only add creditType if the transaction type is credit
    if (type === 'credit') {
      newTransaction.creditType = creditType; // true for given, false for taken
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
              <div className="switch-toggle">
                <span className={creditType ? 'active' : ''}>Given</span>
                <div 
                  className={`toggle-switch ${!creditType ? 'switched' : ''}`}
                  onClick={() => setCreditType(!creditType)}
                >
                  <div className="toggle-knob"></div>
                </div>
                <span className={!creditType ? 'active' : ''}>Taken</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Wallet Type</label>
            <div className="switch-toggle">
              <span className={walletType === 'digital' ? 'active' : ''}>Digital</span>
              <div 
                className={`toggle-switch ${walletType === 'cash' ? 'switched' : ''}`}
                onClick={() => setWalletType(walletType === 'digital' ? 'cash' : 'digital')}
              >
                <div className="toggle-knob"></div>
              </div>
              <span className={walletType === 'cash' ? 'active' : ''}>Cash</span>
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
        .switch-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #ccc;
          padding: 6px 12px;
          border-radius: 4px;
        }
        .switch-toggle .toggle-switch {
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .switch-toggle .toggle-switch.switched {
          background-color: #4CAF50;
        }
        .switch-toggle .toggle-knob {
          width: 16px;
          height: 16px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.3s;
        }
        .switch-toggle .toggle-switch.switched .toggle-knob {
          left: 22px;
        }
        .switch-toggle span {
          cursor: pointer;
        }
        .switch-toggle span.active {
          font-weight: bold;
        }

        h2 {
          margin-top: 0;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}