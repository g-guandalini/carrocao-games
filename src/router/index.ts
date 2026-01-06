// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SplashScreen from '../components/SplashScreen.vue';
import ImagemOcultaView from '../views/ImagemOcultaView.vue';
import ConexaoView from '../views/ConexaoView.vue';
import BugView from '../views/BugView.vue';

import AdminDashboard from '../views/admin/AdminDashboard.vue';
import CategoryManagement from '../views/admin/CategoryManagement.vue';
import ImagemOcultaManagement from '../views/admin/ImagemOcultaManagement.vue';
import ConexaoManagement from '../views/admin/ConexaoManagement.vue';
import BugWordsManagement from '../views/admin/BugWordsManagement.vue';
import BugBoardsManagement from '../views/admin/BugBoardsManagement.vue';
import ScoreManagement from '../views/admin/ScoreManagement.vue'; // Importar ScoreManagement


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
    path: '/conexao',
    name: 'ConexaoGame',
    component: ConexaoView,
  },
  {
    path: '/bug',
    name: 'BugGame',
    component: BugView,
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
      {
        path: 'bug-words',
        name: 'AdminBugWords',
        component: BugWordsManagement,
        meta: {
            title: 'Gerenciar Palavras BUG'
        }
      },
      {
        path: 'bug-boards',
        name: 'AdminBugBoards',
        component: BugBoardsManagement,
        meta: {
            title: 'Gerenciar Tabuleiros BUG'
        }
      },
      {
        path: 'scores', // NOVA ROTA
        name: 'AdminScores',
        component: ScoreManagement,
        meta: {
            title: 'Gerenciar Pontuações'
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