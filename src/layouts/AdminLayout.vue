<template>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">Admin Carroção</h3>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li>
              <router-link :to="{ name: 'Home' }" class="nav-link">
                <i class="fas fa-home"></i> Início (Jogo)
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'AdminCategories' }" class="nav-link">
                <i class="fas fa-tags"></i> Gerenciar Categorias
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'AdminImagemOculta' }" class="nav-link">
                <i class="fas fa-image"></i> Gerenciar Imagem Oculta
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>
  
      <main class="admin-content">
        <div class="admin-content-header">
          <!-- Você pode adicionar um cabeçalho aqui, talvez com o nome da rota atual -->
          <h2 class="page-title">{{ $route.meta.title || $route.name }}</h2>
        </div>
        <div class="admin-content-body">
          <slot></slot> <!-- Aqui é onde o conteúdo das rotas filhas será injetado -->
        </div>
      </main>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'AdminLayout',
  });
  </script>
  
  <style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background-color: #f0f2f5;
    font-family: 'Poppins', sans-serif;
  }
  
  .admin-sidebar {
    width: 250px;
    background-color: #2c3e50; /* Azul escuro */
    color: #ecf0f1; /* Cinza claro */
    padding: 20px 0;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-header {
    padding: 0 20px 20px;
    border-bottom: 1px solid #3e5a76;
  }
  
  .sidebar-title {
    font-size: 1.8em;
    font-weight: 600;
    color: #3498db; /* Azul vibrante */
    text-align: center;
  }
  
  .sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .sidebar-nav li {
    margin-bottom: 5px;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #ecf0f1;
    text-decoration: none;
    font-size: 1.1em;
    transition: background-color 0.2s ease, color 0.2s ease;
    border-left: 5px solid transparent;
  }
  
  .nav-link i {
    margin-right: 10px;
    font-size: 1.2em;
  }
  
  .nav-link:hover {
    background-color: #34495e; /* Azul mais escuro no hover */
    color: #ffffff;
  }
  
  .nav-link.router-link-exact-active {
    background-color: #3498db; /* Cor de destaque para o ativo */
    color: #ffffff;
    border-left-color: #2980b9; /* Borda para destaque */
    font-weight: 600;
  }
  
  .admin-content {
    flex-grow: 1;
    padding: 30px;
    display: flex;
    flex-direction: column;
  }
  
  .admin-content-header {
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .page-title {
    font-size: 2.2em;
    color: #2c3e50;
    margin: 0;
  }
  
  .admin-content-body {
    background-color: #ffffff;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    flex-grow: 1;
  }
  </style>