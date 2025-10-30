// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from '../views/ImagemOcultaView.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import CategoryManagement from '../views/admin/CategoryManagement.vue';
import ImagemOcultaManagement from '../views/admin/ImagemOcultaManagement.vue';

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
  {
    path: '/admin',
    // REMOVIDO: name: 'Admin', // Remova esta linha
    component: AdminDashboard, // Este componente será o layout base para as rotas admin
    children: [
      {
        path: '', // Rota padrão para /admin
        name: 'AdminDefaultRedirect', // ADICIONE ESTE NOME
        redirect: { name: 'AdminCategories' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: CategoryManagement,
      },
      {
        path: 'imagem-oculta',
        name: 'AdminImagemOculta',
        component: ImagemOcultaManagement,
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