
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import supabase from '../lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports: NextPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [expensesByCategory, setExpensesByCategory] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      },
    ],
  });
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Income',
        data: [],
        backgroundColor: '#34D399',
      },
      {
        label: 'Expenses',
        data: [],
        backgroundColor: '#ef4444',
      },
    ],
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      prepareExpensesByCategory();
      prepareMonthlyData();
    }
  }, [transactions, categories, timeRange]);

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

  const prepareExpensesByCategory = () => {
    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Group by category and sum amounts
    const categoryTotals = {};
    expenses.forEach(transaction => {
      const categoryId = transaction.categoryId;
      if (!categoryId) return;
      
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += parseFloat(transaction.amount);
    });

    // Prepare chart data
    const labels = [];
    const data = [];
    const backgroundColor = [];

    Object.entries(categoryTotals).forEach(([categoryId, amount]) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      if (category) {
        labels.push(category.name);
        data.push(amount);
        backgroundColor.push(category.color);
      }
    });

    setExpensesByCategory({
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    });
  };

  const prepareMonthlyData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    let labels = [];
    let incomeData = [];
    let expenseData = [];
    
    // Generate labels and initialize data arrays
    if (timeRange === 'month') {
      // Last 30 days, grouped by day
      for (let i = 29; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, currentDate.getDate() - i);
        labels.push(date.getDate().toString());
        incomeData.push(0);
        expenseData.push(0);
      }
      
      // Process transactions
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const dayDiff = Math.floor((currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

        
        if (dayDiff >= 0 && dayDiff < 30) {
          const amount = parseFloat(transaction.amount);
          
          if (transaction.type === 'income') {
            incomeData[29 - dayDiff] += amount;
          } else if (transaction.type === 'expense') {
            expenseData[29 - dayDiff] += amount;
          }
        }
      });
    } else if (timeRange === 'year') {
      // Last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        labels.push(monthNames[monthIndex]);
        incomeData.push(0);
        expenseData.push(0);
      }
      
      // Process transactions
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = transactionDate.getMonth();
        
        const monthDiff = (currentYear - transactionYear) * 12 + (currentMonth - transactionMonth);
        
        if (monthDiff >= 0 && monthDiff < 12) {
          const amount = parseFloat(transaction.amount);
          
          if (transaction.type === 'income') {
            incomeData[11 - monthDiff] += amount;
          } else if (transaction.type === 'expense') {
            expenseData[11 - monthDiff] += amount;
          }
        }
      });
    }
    
    setMonthlyData({
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#34D399',
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444',
        },
      ],
    });
  };

  return (
    <div>
      <h1>Financial Reports</h1>
      
      <div className="filters">
        <div 
          className={`filter-item ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          Last 30 Days
        </div>
        <div 
          className={`filter-item ${timeRange === 'year' ? 'active' : ''}`}
          onClick={() => setTimeRange('year')}
        >
          Last 12 Months
        </div>
      </div>
      
      <div className="card">
        <h2>Income vs Expenses</h2>
        <div className="chart-container">
          <Bar 
            data={monthlyData} 
            options={{
              responsive: true,
              scales: {
                x: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                },
                y: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ₹' + context.raw.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
      
      <div className="card">
        <h2>Expenses by Category</h2>
        <div className="chart-container">
          {expensesByCategory.labels.length > 0 ? (
            <Doughnut 
              data={expensesByCategory} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: 'rgba(255, 255, 255, 0.8)',
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.label + ': ₹' + context.raw.toLocaleString();
                      }
                    }
                  }
                },
              }}
            />
          ) : (
            <p className="empty-state">No expense data available</p>
          )}
        </div>
      </div>

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
        .card {
          margin-bottom: 24px;
          padding: 24px;
        }
        .chart-container {
          height: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 16px;
        }
        h2 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1.2rem;
        }
        .empty-state {
          text-align: center;
          padding: 20px 0;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Reports;
