
import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryBreakdown({ transactions, categories }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (!transactions || !categories) return;

    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Group by category and sum amounts
    const categoryTotals = {};
    expenses.forEach(transaction => {
      const categoryId = transaction.categoryId;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += transaction.amount;
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

    setChartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    });
  }, [transactions, categories]);

  return (
    <div className="card category-breakdown">
      <h3 className="section-title">Expense Breakdown</h3>
      
      {chartData.labels.length > 0 ? (
        <div className="chart-container">
          <Doughnut 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    padding: 16,
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `₹${context.raw.toLocaleString()}`;
                    }
                  }
                }
              },
            }}
          />
        </div>
      ) : (
        <p className="empty-state">No expense data available</p>
      )}

      <style jsx>{`
        .category-breakdown {
          margin-top: 24px;
        }
        .section-title {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 1.2rem;
        }
        .chart-container {
          height: 250px;
          display: flex;
          justify-content: center;
          padding: 8px;
        }
        .empty-state {
          text-align: center;
          padding: 20px;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}
