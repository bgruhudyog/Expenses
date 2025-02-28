
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { MdAdd, MdDelete } from 'react-icons/md';
import supabase from '../lib/supabase';

const Categories: NextPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#2563EB', icon: 'tag' });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 3000);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      alert('Please enter a category name');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select();
      
      if (error) throw error;
      
      setCategories([...categories, data[0]]);
      setNewCategory({ name: '', color: '#2563EB', icon: 'tag' });
      showMessage('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}" category?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
        
      if (error) throw error;
      
      setCategories(categories.filter(c => c.id !== category.id));
      showMessage('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Make sure it\'s not used by any transactions.');
    }
  };

  const iconOptions = [
    'tag', 'home', 'shopping-cart', 'food', 'car', 
    'gift', 'health', 'entertainment', 'education', 
    'travel', 'utility', 'phone', 'clothing', 'pet', 'other'
  ];

  return (
    <div>
      <h1>Categories</h1>
      
      <div className="card">
        <h2 className="form-title">Create New Category</h2>
        <form onSubmit={handleCreateCategory} className="category-form">
          <div className="form-group">
            <label className="form-label" htmlFor="categoryName">Category Name</label>
            <input 
              type="text" 
              id="categoryName"
              className="form-input" 
              value={newCategory.name} 
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              placeholder="Enter category name"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="categoryColor">Category Color</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                id="categoryColor"
                className="color-input" 
                value={newCategory.color} 
                onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
              />
              <span className="color-preview" style={{ backgroundColor: newCategory.color }}></span>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="categoryIcon">Category Icon</label>
            <select 
              id="categoryIcon"
              className="form-input" 
              value={newCategory.icon} 
              onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
            >
              {iconOptions.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Create Category
          </button>
        </form>
      </div>
      
      <div className="categories-list">
        <h2>Your Categories</h2>
        
        {categories.length > 0 ? (
          categories.map(category => (
            <div key={category.id} className="category-item">
              <div className="category-color" style={{ backgroundColor: category.color }}></div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <span className="category-icon">Icon: {category.icon}</span>
              </div>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteCategory(category)}
              >
                <MdDelete size={20} />
              </button>
            </div>
          ))
        ) : (
          <p className="empty-state">No categories found</p>
        )}
      </div>
      
      {showSnackbar && (
        <div className="snackbar">
          {snackbarMessage}
        </div>
      )}

      <style jsx>{`
        .form-title {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 1.2rem;
        }
        .category-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .color-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .color-input {
          width: 100px;
          height: 40px;
          border: none;
          background: none;
          cursor: pointer;
        }
        .color-preview {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        .categories-list {
          margin-top: 32px;
          margin-bottom: 80px;
        }
        .category-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background-color: var(--paper-bg);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .category-color {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-right: 16px;
          flex-shrink: 0;
        }
        .category-info {
          flex-grow: 1;
        }
        .category-info h3 {
          margin: 0;
          margin-bottom: 4px;
        }
        .category-icon {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .delete-btn {
          background-color: transparent;
          color: #ef4444;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-btn:hover {
          background-color: rgba(239, 68, 68, 0.1);
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

export default Categories;
