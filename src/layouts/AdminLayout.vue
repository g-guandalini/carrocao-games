<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <img src="/logo_sitio.png" alt="Admin Carroção Logo" class="sidebar-logo" />
      </div>

      <!-- Navegação Principal (excluindo "Voltar ao Jogo") -->
      <nav class="sidebar-nav-main">
        <ul>
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
          <li>
            <router-link :to="{ name: 'AdminConexao' }" class="nav-link">
              <i class="fas fa-plug"></i> Conexão
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Novo: Contêiner para o botão "Voltar ao Jogo" na parte inferior -->
      <div class="sidebar-bottom-action">
        <router-link :to="{ name: 'Home' }" class="nav-link">
          <i class="fas fa-home"></i> Voltar ao Jogo
        </router-link>
      </div>

      <!-- Footer do Sidebar -->
      <div class="sidebar-footer">
        Desenvolvido por: Guandalini
      </div>
    </aside>

    <main class="admin-content">
      <!-- NOVO: Wrapper para aplicar o padding e permitir que o admin-content gerencie o scroll -->
      <div class="admin-content-wrapper">
        <div class="admin-content-header">
          <h2 class="page-title">{{ $route.meta.title || $route.name }}</h2>
        </div>
        <div class="admin-content-body">
          <slot></slot>
        </div>
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
/* Adicionado: Garante que o HTML e o Body preencham a tela e evitam a rolagem da página inteira */
html, body {
  margin: 0;
  padding: 0;
  height: 100%; /* Garante que o body tenha altura para 'vh' e '%' funcionarem */
  overflow: hidden; /* Impede que a barra de rolagem apareça no corpo da página */
}

.admin-layout {
  display: flex;
  height: 100vh; /* O layout principal sempre ocupará 100% da altura da viewport */
  background-color: #f0f2f5;
  font-family: 'Poppins', sans-serif;
}

.admin-sidebar {
  width: 250px;
  background-color: #363435; /* Cor de fundo do menu */
  color: #ecf0f1;
  padding: 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%; /* Ocupa 100% da altura do seu pai (.admin-layout) */
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #4a4849;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sidebar-logo {
  max-width: 180px;
  height: auto;
  display: block;
}

/* Antigo .sidebar-nav, agora renomeado e com flex-grow */
.sidebar-nav-main {
  flex-grow: 1; /* Permite que esta seção ocupe o espaço vertical restante no sidebar */
  padding: 20px 0;
  overflow-y: auto; /* A barra de rolagem aparecerá aqui se os itens de navegação estourarem */
}

.sidebar-nav-main ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav-main li {
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

.sidebar-bottom-action {
  padding: 10px 0;
  border-top: 1px solid #4a4849;
  margin-bottom: 0;
}

.sidebar-footer {
  padding: 20px;
  text-align: center;
  font-size: 0.9em;
  color: #b0b0b0;
  border-top: 1px solid #4a4849;
}

.admin-content {
  flex-grow: 1; /* Ocupa todo o espaço horizontal restante */
  height: 100%; /* Ocupa 100% da altura do seu pai (.admin-layout) */
  overflow-y: auto; /* **ESSENCIAL**: A barra de rolagem aparecerá aqui para o conteúdo principal */
  display: flex;
  flex-direction: column;
  /* O padding foi movido para o .admin-content-wrapper */
}

/* NOVO: Wrapper para o conteúdo principal para aplicar o padding */
.admin-content-wrapper {
  flex-grow: 1; /* Ocupa todo o espaço vertical disponível dentro de .admin-content */
  display: flex;
  flex-direction: column;
  padding: 30px; /* O padding é aplicado aqui, dentro da área de rolagem */
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
  flex-grow: 1; /* Permite que o corpo do conteúdo principal ocupe o espaço restante */
}
</style>