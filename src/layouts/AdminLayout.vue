<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <img src="/logo_sitio.png" alt="Admin Carroção Logo" class="sidebar-logo" />
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <router-link :to="{ name: 'Home' }" class="nav-link">
              <i class="fas fa-home"></i> Voltar ao Jogo
            </router-link>
          </li>
          <li>
            <router-link :to="{ name: 'AdminCategories' }" class="nav-link">
              <i class="fas fa-tags"></i> Categorias
            </router-link>
          </li>
          <li>
            <router-link :to="{ name: 'AdminImagemOculta' }" class="nav-link">
              <i class="fas fa-image"></i> Imagem Oculta
            </router-link>
          </li>
        </ul>
      </nav>
      <!-- NOVO: Footer do Sidebar -->
      <div class="sidebar-footer">
        Desenvolvido por: Guandalini
      </div>
    </aside>

    <main class="admin-content">
      <div class="admin-content-header">
        <h2 class="page-title">{{ $route.meta.title || $route.name }}</h2>
      </div>
      <div class="admin-content-body">
        <slot></slot>
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
  background-color: #363435; /* Cor de fundo do menu */
  color: #ecf0f1;
  padding: 0; /* Removido padding vertical para controle mais preciso */
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Distribui o espaço entre header, nav e footer */
}

.sidebar-header {
  padding: 20px; /* Adicionado padding para o logo */
  border-bottom: 1px solid #4a4849;
  background-color: white; /* NOVO: Fundo branco para o logo */
  display: flex;
  justify-content: center;
  align-items: center;
}

.sidebar-logo {
  max-width: 180px; /* Ajuste o tamanho máximo do logo conforme necessário */
  height: auto;
  display: block;
}

.sidebar-nav {
  flex-grow: 1; /* Permite que o nav ocupe o espaço restante */
  padding: 20px 0; /* Adicionado padding para o menu de navegação */
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
  background-color: #4a4849;
  color: #ffffff;
}

.nav-link.router-link-exact-active {
  background-color: #5d5b5c;
  color: #ffffff;
  border-left-color: #a0aec0;
  font-weight: 600;
}

/* NOVO: Estilo para o footer do Sidebar */
.sidebar-footer {
  padding: 20px;
  text-align: center;
  font-size: 0.9em;
  color: #b0b0b0; /* Cor cinza claro para o texto do footer */
  border-top: 1px solid #4a4849; /* Uma linha para separar do conteúdo acima */
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