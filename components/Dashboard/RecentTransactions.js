
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

export default function RecentTransactions({ transactions }) {
  const router = useRouter();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card recent-transactions">
        <h3 className="section-title">Recent Transactions</h3>
        <p className="empty-state">No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="card recent-transactions">
      <h3 className="section-title">Recent Transactions</h3>
      
      <div className="transaction-list">
        {transactions.slice(0, 5).map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <div className="transaction-info">
              <span className="transaction-description">{transaction.description}</span>
              <span className="transaction-date">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
            </div>
            <div className={`transaction-amount ${transaction.type === 'expense' ? 'expense' : 'income'}`}>
              {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="view-all-btn" 
        onClick={() => router.push('/transactions')}
      >
        View All
      </button>

      <style jsx>{`
        .recent-transactions {
          margin-top: 24px;
        }
        .section-title {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 1.2rem;
        }
        .transaction-list {
          margin-bottom: 16px;
        }
        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--divider);
        }
        .transaction-item:last-child {
          border-bottom: none;
        }
        .transaction-info {
          display: flex;
          flex-direction: column;
        }
        .transaction-description {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .transaction-date {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .transaction-amount {
          font-weight: 600;
        }
        .transaction-amount.expense {
          color: #ef4444;
        }
        .transaction-amount.income {
          color: var(--success);
        }
        .empty-state {
          text-align: center;
          padding: 20px;
          color: rgba(255, 255, 255, 0.7);
        }
        .view-all-btn {
          width: 100%;
          padding: 10px;
          background-color: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .view-all-btn:hover {
          background-color: rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
}
