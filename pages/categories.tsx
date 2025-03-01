
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { MdAdd, MdDelete } from 'react-icons/md';
import supabase from '../lib/supabase';

const Categories: NextPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '💰' });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
      setNewCategory({ name: '', icon: '💰' });
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

  // Common emoji categories for finance
  const emojis = [
    '💰', '💵', '💸', '💳', '💴', '🏦', '🏠', '🚗', 
    '🛒', '🍔', '☕', '🍕', '🎮', '📱', '💊', '🛌', 
    '✈️', '🏨', '📚', '🎓', '🏥', '💼', '👕', '👟', 
    '💇', '🎭', '🎬', '🎟️', '🎁', '🏋️', '🐶', '🐱',
    '👶', '💍', '⚙️', '📝', '📊', '🧾', '🧹', '🚌'
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
            <label className="form-label">Category Icon</label>
            <div className="emoji-selector">
              <div 
                className="selected-emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <span className="emoji">{newCategory.icon}</span>
                <span className="emoji-hint">Click to select emoji</span>
              </div>
              
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map(emoji => (
                    <div 
                      key={emoji} 
                      className={`emoji-item ${newCategory.icon === emoji ? 'selected' : ''}`}
                      onClick={() => {
                        setNewCategory({...newCategory, icon: emoji});
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <h3>{category.name}</h3>
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
        .emoji-selector {
          position: relative;
        }
        .selected-emoji {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--divider);
          background-color: var(--paper-bg);
          cursor: pointer;
        }
        .emoji {
          font-size: 1.5rem;
        }
        .emoji-hint {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
        }
        .emoji-picker {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--divider);
          padding: 12px;
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
        }
        .emoji-item {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .emoji-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .emoji-item.selected {
          background-color: var(--primary);
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
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .category-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .category-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-right: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background-color: var(--surface);
        }
        .category-info {
          flex-grow: 1;
        }
        .category-info h3 {
          margin: 0;
          margin-bottom: 4px;
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
          transition: background-color 0.2s;
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
