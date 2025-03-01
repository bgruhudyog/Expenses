
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
  const [walletType, setWalletType] = useState('digital');
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('');
  const [creditType, setCreditType] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setType('expense');
      setWalletType('digital');
      setCategoryId('');
      setIsRecurring(false);
      setRecurringInterval('');
      setCreditType(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !description) {
      alert('Please fill all required fields');
      return;
    }

    let actualType = type;
    if (type === 'credit') {
      actualType = creditType ? 'expense' : 'income';
    }
    
    const newTransaction = {
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(),
      type: actualType,
      walletType,
      categoryId: categoryId ? parseInt(categoryId) : null,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null,
      isSettled: false,
      settledAmount: 0,
      creditType: type === 'credit' ? creditType : null
    };
    
    console.log("Adding transaction:", newTransaction);

    try {
      onAddTransaction(newTransaction);
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  if (!isOpen) return null;

  // Find the selected category to display its icon
  const selectedCategory = categories.find(c => c.id.toString() === categoryId);

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
                <span className="toggle-icon">💸</span>
                <span>Expense</span>
              </div>
              <div 
                className={`toggle-item ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                <span className="toggle-icon">💵</span>
                <span>Income</span>
              </div>
              <div 
                className={`toggle-item ${type === 'credit' ? 'active' : ''}`}
                onClick={() => setType('credit')}
              >
                <span className="toggle-icon">💳</span>
                <span>Credit</span>
              </div>
            </div>
          </div>

          {type === 'credit' && (
            <div className="form-group">
              <label className="form-label">Credit Type</label>
              <div className="switch-toggle modern">
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
            <div className="switch-toggle modern">
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
            <div className="input-with-icon">
              <span className="input-icon">₹</span>
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
            <div className="category-selector">
              <select 
                className="form-input" 
                id="category"
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category</option>
                {categories && categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <div className="selected-category-icon">
                  {selectedCategory.icon}
                </div>
              )}
            </div>
          </div>

          <div className="form-group checkbox-group modern">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                id="isRecurring"
                checked={isRecurring} 
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span>Recurring Payment</span>
            </label>
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background-color: var(--paper-bg);
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 1.5rem;
          text-align: center;
          color: var(--text);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text);
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--surface);
          color: var(--text);
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .form-input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
        
        .toggle-group {
          display: flex;
          background-color: var(--surface);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--divider);
        }
        
        .toggle-item {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: center;
        }
        
        .toggle-icon {
          font-size: 1.2rem;
        }
        
        .toggle-item.active {
          background-color: var(--primary);
          color: white;
        }
        
        .switch-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--surface);
        }
        
        .switch-toggle.modern {
          background-color: var(--surface);
          padding: 10px 16px;
          justify-content: space-between;
        }
        
        .switch-toggle span {
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .switch-toggle span.active {
          font-weight: 600;
          color: var(--text);
        }
        
        .toggle-switch {
          width: 44px;
          height: 22px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .toggle-switch.switched {
          background-color: var(--primary);
        }
        
        .toggle-knob {
          width: 18px;
          height: 18px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.3s;
        }
        
        .toggle-switch.switched .toggle-knob {
          left: 24px;
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }
        
        .input-with-icon .form-input {
          padding-left: 30px;
        }
        
        .category-selector {
          position: relative;
        }
        
        .selected-category-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.3rem;
        }
        
        .checkbox-group.modern {
          margin-top: 16px;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 35px;
          cursor: pointer;
          user-select: none;
        }
        
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 20px;
          width: 20px;
          background-color: var(--surface);
          border: 1px solid var(--divider);
          border-radius: 4px;
        }
        
        .checkbox-container:hover input ~ .checkmark {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .checkbox-container input:checked ~ .checkmark {
          background-color: var(--primary);
          border-color: var(--primary);
        }
        
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        
        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }
        
        .checkbox-container .checkmark:after {
          left: 7px;
          top: 3px;
          width: 4px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }
        
        .btn-primary {
          background-color: var(--primary);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .btn-secondary {
          background-color: transparent;
          color: var(--text);
          border: 1px solid var(--divider);
        }
        
        .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
