const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

// O pynput injeta teclas pelo X11. Em sessões Wayland, force o Electron a
// usar o XWayland para que as teclas da botoeira cheguem à janela do jogo.
app.commandLine.appendSwitch('ozone-platform', 'x11');

const PORT = Number(process.env.PORT || 3001);
let backend;
let hidController;

function serverPath() {
  return path.join(app.getAppPath(), 'server', 'index.js');
}

function startBackend() {
  const dataPath = path.join(app.getPath('userData'), 'game-data');
  // Em desenvolvimento, use o mesmo Node que instalou o sqlite3. O Electron
  // possui um ABI nativo próprio; no pacote, o electron-builder recompila os
  // módulos nativos e o próprio executável do Electron pode ser usado.
  const nodeRuntime = app.isPackaged
    ? process.execPath
    : (process.env.npm_node_execpath || process.env.NODE_EXEC_PATH || 'node');
  backend = spawn(nodeRuntime, [serverPath()], {
    env: {
      ...process.env,
      PORT: String(PORT),
      GAME_DATA_PATH: dataPath,
      GAME_DB_PATH: path.join(dataPath, 'game.db'),
      FRONTEND_BUILD_PATH: path.join(app.getAppPath(), 'dist'),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'inherit',
  });

  backend.on('error', (error) => {
    dialog.showErrorBox('Carroção Games', `Não foi possível iniciar o servidor local.\n${error.message}`);
    app.quit();
  });
}

function hidScriptPath() {
  return path.join(app.getAppPath(), 'hid', 'controle_hid.py');
}

function startHidController() {
  const pythonRuntime = process.env.CARROCAO_HID_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  hidController = spawn(pythonRuntime, [hidScriptPath()], {
    cwd: app.getAppPath(),
    env: {
      ...process.env,
      CARROCAO_HID_API: `http://127.0.0.1:${PORT}/api/hid/config`,
    },
    stdio: 'inherit',
  });

  hidController.on('error', (error) => {
    console.error(`[HID] Não foi possível iniciar o controlador (${pythonRuntime}):`, error.message);
  });
  hidController.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`[HID] Controlador encerrado (código ${code}, sinal ${signal || 'nenhum'}).`);
    }
  });
}

function waitForServer(attempts = 50) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`http://127.0.0.1:${PORT}/api/status`, (response) => {
        response.resume();
        if (response.statusCode === 200) return resolve();
        retry();
      });
      request.on('error', retry);
      request.setTimeout(500, () => request.destroy());
    };
    const retry = () => attempts-- > 0 ? setTimeout(check, 100) : reject(new Error('O servidor local não respondeu.'));
    check();
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    icon: path.join(app.getAppPath(), 'public', 'logo_sitio_electron.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  const useDevServer = !app.isPackaged && !process.argv.includes('--production');
  const startUrl = process.env.ELECTRON_START_URL || (useDevServer
    ? 'http://127.0.0.1:5173'
    : `http://127.0.0.1:${PORT}`);
  window.loadURL(startUrl);
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await waitForServer();
    // O aplicativo lê a botoeira pela Gamepad API do próprio Electron, sem
    // depender de Python/Pygame no computador instalado. O controlador Python
    // continua disponível como fallback manual para ambientes especiais.
    if (process.env.CARROCAO_HID_EXTERNAL === '1') {
      startHidController();
    }
    createWindow();
  } catch (error) {
    dialog.showErrorBox('Carroção Games', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  hidController?.kill();
  backend?.kill();
});
