// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from '../views/ImagemOcultaView.vue';
import ConexaoView from '../views/ConexaoView.vue'; // Importa a view do jogo Conexão
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import CategoryManagement from '../views/admin/CategoryManagement.vue';
import ImagemOcultaManagement from '../views/admin/ImagemOcultaManagement.vue';
import ConexaoManagement from '../views/admin/ConexaoManagement.vue'; 

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: SplashScreen,
  },
  {
    path: '/imagem-oculta',
    name: 'ImagemOcultaGame',
    component: ImagemOcultaView,
  },
  // Rota para o jogo Conexão
  {
    path: '/conexao',
    name: 'ConexaoGame',
    component: ConexaoView,
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
        path: 'conexao', 
        name: 'AdminConexao', 
        component: ConexaoManagement,
        meta: {
            title: 'Gerenciar Conexões' 
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