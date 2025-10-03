import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  image?: string;
  children?: Category[];
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  // Flatten categories to include both parent and child categories
  const allCategories: Category[] = [];
  
  data.forEach((category: Category) => {
    // Add parent category
    allCategories.push(category);
    
    // Add child categories if they exist
    if (category.children && category.children.length > 0) {
      category.children.forEach((child: Category) => {
        allCategories.push({
          ...child,
          name: `${category.name} > ${child.name}` // Show hierarchy
        });
      });
    }
  });
  
  return allCategories;
}

export async function createQuickCategory(name: string): Promise<Category> {
  const { data } = await api.post('/categories/quick-create', { name });
  return data;
}
