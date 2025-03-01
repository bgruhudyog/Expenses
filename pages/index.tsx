
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { MdAdd } from 'react-icons/md';
import supabase from '../lib/supabase';
import BalanceCard from '../components/Dashboard/BalanceCard';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import CategoryBreakdown from '../components/Dashboard/CategoryBreakdown';
import TransactionModal from '../components/TransactionModal';

const Home: NextPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [digitalBalance, setDigitalBalance] = useState(0);
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
      calculateBalances(data || []);
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

  const calculateBalances = (transactionList) => {
    let cash = 0;
    let digital = 0;

    transactionList.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      
      if (transaction.type === 'income') {
        if (transaction.walletType === 'cash') {
          cash += amount;
        } else {
          digital += amount;
        }
      } else if (transaction.type === 'expense') {
        if (transaction.walletType === 'cash') {
          cash -= amount;
        } else {
          digital -= amount;
        }
      } else if (transaction.type === 'credit') {
        if (transaction.creditType === 'given') {
          if (transaction.walletType === 'cash') {
            cash -= amount;
          } else {
            digital -= amount;
          }
        } else { // taken
          if (transaction.walletType === 'cash') {
            cash += amount;
          } else {
            digital += amount;
          }
        }
      }
    });

    setCashBalance(cash);
    setDigitalBalance(digital);
  };

  const handleAddTransaction = async (newTransaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();
      
      if (error) throw error;
      
      setTransactions([data[0], ...transactions]);
      calculateBalances([data[0], ...transactions]);
      
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

  return (
    <div>
      <h1>Rajyavardhan's Dashboard</h1>
      
      <BalanceCard 
        cashBalance={cashBalance} 
        digitalBalance={digitalBalance} 
      />
      
      <RecentTransactions transactions={transactions} />
      
      <CategoryBreakdown 
        transactions={transactions} 
        categories={categories}
      />
      
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
    </div>
  );
};

export default Home;
