// src/store/adminStore.ts
import { reactive } from 'vue';
import { AdminState, Category, ImagemOcultaItem } from '../types';
import { addToast } from './toastStore';

const API_BASE_URL = 'http://localhost:3001'; // A URL do seu backend

const initialState: AdminState = {
  categories: [],
  imagemOcultaItems: [],
  isLoadingCategories: false,
  isLoadingImagemOculta: false,
  selectedImagemOcultaItem: null,
};

export const adminStore = reactive<AdminState>({ ...initialState });

// --- Funções para Categorias ---

export async function fetchCategories() {
  adminStore.isLoadingCategories = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    adminStore.categories = await response.json();
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    addToast('Erro ao carregar categorias.', 'error');
  } finally {
    adminStore.isLoadingCategories = false;
  }
}

export async function addCategory(name: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
    adminStore.categories.push(data); // Adiciona a nova categoria
    addToast('Categoria adicionada com sucesso!', 'success');
    return data;
  } catch (error: any) {
    console.error('Erro ao adicionar categoria:', error);
    addToast(`Erro ao adicionar categoria: ${error.message}`, 'error');
    throw error; // Propagar o erro para o componente
  }
}

export async function updateCategory(id: number, name: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
    // Atualiza a categoria na store
    const index = adminStore.categories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      adminStore.categories[index].name = name;
    }
    addToast('Categoria atualizada com sucesso!', 'success');
    return data;
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    addToast(`Erro ao atualizar categoria: ${error.message}`, 'error');
    throw error;
  }
}

export async function deleteCategory(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
    // Remove a categoria da store
    adminStore.categories = adminStore.categories.filter(cat => cat.id !== id);
    // Também recarrega os itens de imagem oculta para atualizar as associações
    await fetchImagemOcultaItems();
    addToast('Categoria deletada com sucesso!', 'success');
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    addToast(`Erro ao deletar categoria: ${error.message}`, 'error');
    throw error;
  }
}

// --- Funções para Imagem Oculta ---

export async function fetchImagemOcultaItems() {
  adminStore.isLoadingImagemOculta = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/imagem-oculta`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    adminStore.imagemOcultaItems = await response.json();
  } catch (error) {
    console.error('Erro ao buscar itens de imagem oculta:', error);
    addToast('Erro ao carregar itens de imagem oculta.', 'error');
  } finally {
    adminStore.isLoadingImagemOculta = false;
  }
}

export async function fetchImagemOcultaItemById(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/imagem-oculta/${id}`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const item = await response.json();
    adminStore.selectedImagemOcultaItem = item;
    return item;
  } catch (error) {
    console.error('Erro ao buscar item de imagem oculta por ID:', error);
    addToast('Erro ao carregar item de imagem oculta.', 'error');
    throw error;
  }
}

export async function addImagemOcultaItem(item: { hint: string; answer: string; imageUrl: string; categoryIds: number[] }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/imagem-oculta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
    // Atualiza a lista na store
    await fetchImagemOcultaItems(); // Recarrega para garantir todas as categorias
    addToast('Item de Imagem Oculta adicionado com sucesso!', 'success');
    return data;
  } catch (error: any) {
    console.error('Erro ao adicionar item de imagem oculta:', error);
    addToast(`Erro ao adicionar item de imagem oculta: ${error.message}`, 'error');
    throw error;
  }
}

export async function updateImagemOcultaItem(id: number, item: { hint?: string; answer?: string; imageUrl?: string; categoryIds?: number[] }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/imagem-oculta/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Erro HTTP: ${response.status}`);
    // Atualiza a lista na store
    await fetchImagemOcultaItems(); // Recarrega para garantir todas as categorias
    addToast('Item de Imagem Oculta atualizado com sucesso!', 'success');
    return data;
  } catch (error: any) {
    console.error('Erro ao atualizar item de imagem oculta:', error);
    add