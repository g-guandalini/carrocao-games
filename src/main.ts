// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importe o roteador

// 1. Crie a instância da aplicação e guarde-a em uma variável
const app = createApp(App);

// 2. Use o roteador na instância da aplicação
app.use(router);

// 3. Monte a aplicação DEPOIS que o roteador foi instalado
app.mount('#app');