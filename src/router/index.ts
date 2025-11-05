// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from '../views/ImagemOcultaView.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import CategoryManagement from '../views/admin/CategoryManagement.vue';
import ImagemOcultaManagement from '../views/admin/ImagemOcultaManagement.vue';
import CategorySelectionScreen from '../components/CategorySelectionScreen.vue'; // IMPORTE AQUI

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: SplashScreen,
  },
  {
    path: '/category-selection', // NOVA ROTA
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