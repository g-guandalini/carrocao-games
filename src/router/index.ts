// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from '../views/ImagemOcultaView.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import CategoryManagement from '../views/admin/CategoryManagement.vue';
import ImagemOcultaManagement from '../views/admin/ImagemOcultaManagement.vue';
import CategorySelectionScreen from '../components/CategorySelectionScreen.vue'; 
import ConexaoManagement from '../views/admin/ConexaoManagement.vue'; 

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: SplashScreen,
  },
  {
    path: '/category-selection', 
    name: 'CategorySelection',
    component: CategorySelectionScreen,
  },
  {
    path: '/imagem-oculta',
    name: 'ImagemOcultaGame',
    component: ImagemOcultaView,
  },
  {
    path: '/admin',
    component: AdminDashboard,
    children: [
      {
        path: '',
        name: 'AdminDefaultRedirect',
        redirect: { name: 'AdminCategories' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: CategoryManagement,
        meta: {
            title: 'Gerenciar Categorias' 
        }
      },
      {
        path: 'imagem-oculta',
        name: 'AdminImagemOculta',
        component: ImagemOcultaManagement,
        meta: {
            title: 'Gerenciar Imagem Oculta' 
        }
      },
      {
        path: 'conexao', // O caminho da URL para este gerenciamento
        name: 'AdminConexao', // O nome da rota
        component: ConexaoManagement, // O componente Vue que acabamos de criar
        meta: {
            title: 'Gerenciar Conexões' // Título para fins de navegação ou exibição
        }
      },
    ],
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;