<template>
  <div class="score-management">
    <h3>Gerenciar Pontuações das Equipes</h3>

    <div v-if="loading" class="loading-message">Carregando pontuações...</div>
    <div v-else-if="error" class="error-message">Erro ao carregar pontuações: {{ error }}</div>
    
    <div class="form-container"> <!-- Novo wrapper para o formulário -->
      <form @submit.prevent="saveScores" class="score-form">
        <div class="score-item" v-for="(_score, teamNamePortuguese) in editableScores" :key="teamNamePortuguese">
          <label 
            :for="`score-${teamNamePortuguese}`" 
            :class="`team-label team-label-${getTeamCssClass(teamNamePortuguese as TeamColor)}`"
          >
            {{ displayTeamName(teamNamePortuguese as TeamColor) }}: <!-- Usando a função displayTeamName -->
          </label>
          <input 
            type="number" 
            :id="`score-${teamNamePortuguese}`" 
            v-model.number="editableScores[teamNamePortuguese]" 
            min="0" 
            required 
            class="score-input"
          />
        </div>
        <button type="submit" class="btn-save-scores">Salvar Pontuações</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { scoreStore, fetchScores, setScore } from '../../store/scoreStore'; // Ajuste o caminho conforme necessário
import { TeamColor } from '../../types'; // Ajuste o caminho e certifique-se que TeamColor está definido

export default defineComponent({
  name: 'ScoreManagement',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);

    // Obtém APENAS os VALORES do enum (ex: 'Azul', 'Vermelho', 'Verde', 'Amarelo')
    const teamNamesPortuguese = Object.values(TeamColor).filter(value => typeof value === 'string') as TeamColor[];

    // Inicializa editableScores com todos os nomes das equipes em português e uma pontuação padrão de 0.
    const initialEditableScores: { [key: string]: number } = {};
    teamNamesPortuguese.forEach(name => {
      initialEditableScores[name] = 0; // Pontuação padrão
    });

    const editableScores = ref<{ [key: string]: number }>(initialEditableScores);

    // Função auxiliar para mapear o nome em português para a classe CSS (nome em inglês)
    const getTeamCssClass = (teamNamePortuguese: TeamColor): string => {
      switch (teamNamePortuguese) {
        case TeamColor.BLUE: return 'blue';
        case TeamColor.RED: return 'red';
        case TeamColor.GREEN: return 'green';
        case TeamColor.YELLOW: return 'yellow';
        default: return ''; // Fallback
      }
    };

    // Função para exibir o nome da equipe em maiúsculas, garantindo o tipo string
    const displayTeamName = (teamName: TeamColor): string => {
      return teamName.toUpperCase(); // Agora teamName é garantido como TeamColor (string)
    };

    // Função para carregar as pontuações e preencher o formulário
    const loadScores = async () => {
      loading.value = true;
      error.value = null;
      try {
        await fetchScores(); // Garante que o scoreStore está atualizado
        
        const currentScoresInStore = scoreStore.score || {}; 
        
        const mergedScores: { [key: string]: number } = {};
        teamNamesPortuguese.forEach(name => {
          mergedScores[name] = currentScoresInStore[name] !== undefined ? currentScoresInStore[name] : 0;
        });
        
        editableScores.value = mergedScores;

      } catch (err) {
        console.error('Erro ao carregar pontuações:', err);
        error.value = 'Não foi possível carregar as pontuações.';
      } finally {
        loading.value = false;
      }
    };

    // Função para salvar as pontuações editadas
    const saveScores = async () => {
      if (loading.value) return;

      loading.value = true;
      error.value = null;
      try {
        const promises = teamNamesPortuguese.map(name => {
          const newScore = editableScores.value[name];
          
          if (newScore !== undefined && newScore !== scoreStore.score[name]) {
            return setScore(name, newScore); 
          }
          return Promise.resolve();
        });
        await Promise.all(promises);
        alert('Pontuações salvas com sucesso!');
        await loadScores();
      } catch (err) {
        console.error('Erro ao salvar pontuações:', err);
        alert('Erro ao salvar pontuações.');
        error.value = 'Não foi possível salvar as pontuações.';
      } finally {
        loading.value = false;
      }
    };

    onMounted(loadScores);

    return {
      loading,
      error,
      editableScores,
      saveScores,
      getTeamCssClass,
      displayTeamName, // Expor a função para uso no template
    };
  },
});
</script>

<style scoped>
.score-management {
  padding: 20px;
  max-width: 600px; /* Mantive um max-width menor que o ConexaoManagement, pois é um formulário mais simples */
  margin: 0 auto;
  font-family: sans-serif;
}

.form-container { /* Estilo do container do formulário, similar ao ConexaoManagement */
  background: #f9f9f9;
  border: 1px solid #ddd;
  padding: 20px; /* Um pouco mais de padding para o formulário principal */
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); /* Adicionado sombra para profundidade */
}

h3 {
  color: #333;
  margin-bottom: 20px; /* Aumentei um pouco para separar do formulário */
  text-align: center;
}

.loading-message, .error-message {
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 20px;
}
.error-message {
  color: #dc3545;
}

.score-form {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Espaçamento entre os itens do formulário */
}

.score-item {
  display: flex;
  align-items: center;
  gap: 15px; /* Espaçamento entre label e input */
  padding: 10px;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Sombra suave para cada item */
}

.team-label {
  font-weight: bold;
  font-size: 1.1em;
  min-width: 100px; /* Aumentei para melhor alinhamento */
  text-align: right; /* Alinha o texto da label à direita */
}

/* Cores das labels das equipes */
.team-label-red { color: #e74c3c; }
.team-label-blue { color: #3498db; }
.team-label-green { color: #2ecc71; }
.team-label-yellow { color: #f1c40f; }

.score-input {
  flex-grow: 1;
  padding: 10px; /* Aumentei o padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  text-align: right;
  max-width: 150px; /* Mantido para controle de largura */
  transition: border-color 0.2s ease-in-out; /* Transição suave no foco */
}

.score-input:focus {
  border-color: #007bff; /* Borda azul no foco */
  outline: none; /* Remove o outline padrão do navegador */
}

.btn-save-scores {
  padding: 12px 25px; /* Padding maior para o botão principal */
  background-color: #28a745; /* Verde */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  margin-top: 25px; /* Mais espaço acima do botão */
  align-self: center; /* Centraliza o botão */
  width: fit-content;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out; /* Transições suaves */
}

.btn-save-scores:hover {
  background-color: #218838; /* Verde mais escuro no hover */
  transform: translateY(-1px); /* Pequeno efeito de "levantar" */
}

.btn-save-scores:active {
  background-color: #1e7e34; /* Verde ainda mais escuro no clique */
  transform: translateY(0);
}
</style>