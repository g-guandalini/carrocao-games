# Carroção Games

Aplicação de jogos para telão, construída com Vue 3/Vite no frontend e Express/SQLite no backend.

## Requisitos

- Node.js 20 ou superior
- npm

## Executar localmente

Na raiz do projeto, instale as dependências do frontend e do backend:

```bash
npm install
npm run install-backend
```

Crie o arquivo `.env.development` na raiz com a URL local da API:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Em dois terminais diferentes, execute:

```bash
# Terminal 1: backend e banco SQLite
npm run start-backend
```

```bash
# Terminal 2: frontend Vite
npm run dev
```

Acesse `http://localhost:5173`.

O banco é criado automaticamente em `server/db/game.db` na primeira execução. Ele e as imagens enviadas pelo painel administrativo são locais e não são versionados pelo Git.

## Rotas

- `/`: tela inicial
- `/imagem-oculta`: jogo Imagem Oculta
- `/conexao`: jogo Conexão
- `/bug`: jogo BUG
- `/admin`: painel administrativo

## Operação dos jogos

Os jogos foram pensados para serem operados por teclado em um telão. Mantenha o foco na janela do jogo ao usar os atalhos.

### Tela inicial

| Tecla | Ação |
| --- | --- |
| `I` | Inicia Imagem Oculta |
| `C` | Inicia Conexão |
| `B` | Inicia BUG |
| `A` | Abre o painel administrativo |
| `L` | Zera o placar quando houver pontuação registrada |
| `1`, `2`, `3`, `4` | Disparam fogos nas cores Azul, Vermelho, Verde e Amarelo |

### Comandos compartilhados

| Tecla | Ação |
| --- | --- |
| `O` | Confirma resposta correta durante a fase de palpite |
| `X` | Confirma resposta errada durante a fase de palpite |
| `Espaço` | Avança para a próxima rodada ou confirma a ação exibida, conforme a fase |
| `P` | Abre o placar quando esse atalho estiver disponível |
| `Esc` | Sai do placar e retorna à tela inicial |

### Imagem Oculta

1. Entre pelo atalho `I`. A rodada começa na tela de dica.
2. Pressione `Espaço` para iniciar a revelação progressiva da imagem.
3. Durante a revelação, escolha quem vai responder: `1` Azul, `2` Vermelho, `3` Verde e `4` Amarelo.
4. Valide o palpite usando `O` para acerto ou `X` para erro. Em caso de erro, a imagem volta a revelar e outro time pode tentar.
5. No fim da rodada, `Espaço` inicia outra rodada e `P` abre o placar.

### Conexão

1. Entre pelo atalho `C`. A imagem é exibida e a palavra começa com traços.
2. Uma letra é revelada no intervalo configurado até o fim da rodada.
3. Durante a revelação, escolha quem responde: `1` Azul, `2` Vermelho, `3` Verde e `4` Amarelo.
4. Valide com `O` para acerto ou `X` para erro. Um erro desabilita o time naquela rodada e a revelação continua.
5. Quando a palavra ou o tempo terminar, `Espaço` inicia outra rodada e `P` abre o placar.

### BUG

O BUG tem três fases: sorteio, palavra e tabuleiro. A ordem dos times nesse jogo é Vermelho, Azul, Verde e Amarelo.

#### 1. Sorteio

| Tecla | Ação |
| --- | --- |
| `S` | Sorteia uma opção aleatória |
| `1` | Seleciona `Ganhe 20` |
| `2` | Seleciona `Perca 20` |
| `3` | Seleciona `Fora` |
| `4` | Seleciona `10 a 50` |
| `5` | Seleciona `Tire uma` |
| `6` | Seleciona `Tire duas` |

Depois do sorteio:

- Para `Ganhe 20` e `Perca 20`, use `Espaço` para aplicar o efeito e iniciar a próxima rodada, ou `P` para aplicar o efeito e abrir o placar.
- Para `10 a 50`, use `1` a `5` para escolher respectivamente 10, 20, 30, 40 ou 50 pontos; confirme com `Espaço`.
- Para `Tire uma` e `Tire duas`, use `1` Vermelho, `2` Azul, `3` Verde e `4` Amarelo para marcar os times e `Espaço` para confirmar.
- `Fora` desabilita o time da vez na fase da palavra.

#### 2. Palavra

1. Escolha o time que vai responder: `1` Vermelho, `2` Azul, `3` Verde e `4` Amarelo.
2. Use `O` para resposta correta ou `X` para resposta errada.
3. Após um acerto, a palavra correta é mostrada; pressione `Espaço` para avançar ao tabuleiro.

#### 3. Tabuleiro

1. Escolha uma casa digitando a linha e depois a coluna em até 800 ms: `A` a `D`, seguida de `1` a `5`. Exemplo: `B` e depois `3` seleciona a casa B3.
2. A casa revela pontos, `BUG` ou `Carroção` e atualiza o placar.
3. Após a revelação, `Espaço` confirma e inicia uma nova rodada; `P` confirma e abre o placar.

### Painel administrativo

Em `/admin`, cadastre e organize categorias, itens de Imagem Oculta, itens de Conexão, palavras e tabuleiros BUG, além de ajustar o placar. As categorias marcadas para cada jogo determinam o conjunto de itens disponível na rodada.

O menu lateral possui as opções `Backup`, que baixa o banco SQLite atual, e
`Restaurar`, que permite selecionar um arquivo `.sqlite` ou `.db`. A restauração
substitui os dados atuais após confirmação e valida o arquivo antes da troca.

### Configuração da botoeira

O menu `Botoeira` permite cadastrar controles e mapear entradas SDL/Pygame para
teclas do jogo. O controlador unificado está em `hid/controle_hid.py` e lê sua
configuração pela API local (`/api/hid/config`). Para executá-lo manualmente,
instale `hid/requirements.txt` e inicie o backend antes:

```bash
python -m pip install -r hid/requirements.txt
python hid/controle_hid.py
```

As entradas de botões usam o formato `button:0`, `button:1` etc. O suporte a
Xbox e a controles PS2 depende de o dispositivo ser reconhecido pelo SDL.

## Configurações opcionais da Conexão

Além de `VITE_API_BASE_URL`, é possível configurar a duração da rodada e o intervalo de revelação das letras:

```env
VITE_TEMPO_RODADA_CONEXAO=30000
VITE_TEMPO_LETRA_CONEXAO=3000
```

Os valores são em milissegundos. Se não forem definidos, o jogo usa 30 segundos por rodada e revela uma letra a cada 3 segundos.

## Build de produção

```bash
npm run build
npm run start-backend
```

O backend serve os arquivos gerados em `dist` junto com a API na porta `3001`.

## Aplicativo desktop (Electron)

O Electron inicia automaticamente o backend Express e a interface Vue. Não é
necessário abrir terminais separados para o Vite e para o backend.

Instale as dependências da raiz e do backend uma vez:

```bash
npm install
npm run install-backend
```

Durante o desenvolvimento, com recarregamento automático do frontend:

```bash
npm run electron:dev
```

Esse comando usa as portas `5173` (Vite) e `3001` (API). Se elas estiverem
ocupadas por uma execução anterior ou por containers Docker, encerre esses
processos antes de iniciar o Electron.

Para compilar e abrir a versão de produção local:

```bash
npm run electron
```

Para gerar o pacote Linux AppImage em `release/`:

```bash
npm run electron:package
```

O pacote gerado fica em `release/` (Linux AppImage). No Linux, os scripts já
usam `--no-sandbox` para funcionar também quando o helper SUID do Electron não
está configurado.

No aplicativo empacotado, o banco e as imagens cadastradas ficam em `game-data` no diretório de dados da aplicação, preservando-os entre atualizações.

## Sem Node instalado: usar Docker

Instale as dependências uma vez:

```bash
docker run --rm -v "$PWD":/app -w /app node:20-alpine npm ci
docker run --rm -v "$PWD":/app -w /app/server node:20-alpine npm ci
```

Depois, inicie os serviços:

```bash
docker run -d --rm --name carrocao-games-api -p 3001:3001 -v "$PWD":/app -w /app node:20-alpine node server/index.js
docker run -d --rm --name carrocao-games-vite -p 5173:5173 -v "$PWD":/app -w /app node:20-alpine npm run dev -- --host 0.0.0.0
```

Para encerrar:

```bash
docker stop carrocao-games-api carrocao-games-vite
```
