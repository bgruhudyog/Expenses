
import { useState, useEffect } from 'react';

export default function BalanceCard({ cashBalance, digitalBalance }) {
  const totalBalance = cashBalance + digitalBalance;

  return (
    <div className="balance-card card">
      <h2 className="total-balance">₹{totalBalance.toLocaleString()}</h2>
      <p className="balance-label">Total Balance</p>
      
      <div className="balance-details">
        <div className="balance-item">
          <span className="balance-type">Cash</span>
          <span className="balance-amount">₹{cashBalance.toLocaleString()}</span>
        </div>
        <div className="balance-item">
          <span className="balance-type">Digital</span>
          <span className="balance-amount">₹{digitalBalance.toLocaleString()}</span>
        </div>
      </div>

      <style jsx>{`
        .balance-card {
          text-align: center;
          padding: 24px;
        }
        .total-balance {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--text);
        }
        .balance-label {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 24px;
        }
        .balance-details {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--divider);
        }
        .balance-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .balance-type {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }
        .balance-amount {
          font-size: 1.2rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
