
import { v4 as uuidv4 } from 'uuid';

// Function to store transactions locally
export const storeOfflineTransaction = (transaction) => {
  try {
    // Add a temporary ID and mark as offline
    const offlineTransaction = {
      ...transaction,
      offlineId: uuidv4(),
      isOffline: true,
      createdAt: new Date().toISOString()
    };
    
    // Get existing offline transactions
    const existingTransactions = getOfflineTransactions();
    
    // Add new transaction to the list
    existingTransactions.push(offlineTransaction);
    
    // Store updated list
    localStorage.setItem('offlineTransactions', JSON.stringify(existingTransactions));
    
    return offlineTransaction;
  } catch (error) {
    console.error('Error storing offline transaction:', error);
    return null;
  }
};

// Function to get all stored offline transactions
export const getOfflineTransactions = () => {
  try {
    const transactions = localStorage.getItem('offlineTransactions');
    return transactions ? JSON.parse(transactions) : [];
  } catch (error) {
    console.error('Error getting offline transactions:', error);
    return [];
  }
};

// Function to remove a transaction from offline storage
export const removeOfflineTransaction = (offlineId) => {
  try {
    const transactions = getOfflineTransactions();
    const filteredTransactions = transactions.filter(t => t.offlineId !== offlineId);
    localStorage.setItem('offlineTransactions', JSON.stringify(filteredTransactions));
  } catch (error) {
    console.error('Error removing offline transaction:', error);
  }
};

// Function to check if online
export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Function to clear all offline transactions
export const clearOfflineTransactions = () => {
  localStorage.setItem('offlineTransactions', JSON.stringify([]));
};
