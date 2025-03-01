
import supabase from './supabase';

// Sample categories with emoji icons
const newCategories = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Shopping', icon: '🛒' },
  { name: 'Housing', icon: '🏠' },
  { name: 'Entertainment', icon: '🎮' },
  { name: 'Healthcare', icon: '💊' },
  { name: 'Education', icon: '📚' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Bills & Utilities', icon: '📱' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Personal Care', icon: '💇' },
  { name: 'Gifts', icon: '🎁' },
  { name: 'Credit Card', icon: '💳' },
  { name: 'Investments', icon: '📊' },
  { name: 'Salary', icon: '💰' },
  { name: 'Udhaar', icon: '🤝' }
];

// To use this function, call it from the browser console after importing it
export async function updateCategories() {
  try {
    // Clear existing categories (optional, use with caution)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .gte('id', 0);
    
    if (deleteError) {
      console.error('Error deleting categories:', deleteError);
      return;
    }

    // Insert new categories
    const { data, error } = await supabase
      .from('categories')
      .insert(newCategories)
      .select();
    
    if (error) {
      console.error('Error adding categories:', error);
      return;
    }
    
    console.log('Categories updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

// You can run this in your browser console:
// import { updateCategories } from './lib/updateCategories';
// updateCategories().then(data => console.log('Done:', data));
