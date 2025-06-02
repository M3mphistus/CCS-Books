const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// __dirname ist in CommonJS automatisch verfügbar

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public', 'ccs.png'),
  });
    win.loadFile('dist/index.html');
  }

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC for reading/writing inventory files
const getAppDataPath = () => app.getPath('userData');

ipcMain.handle('read-inventory', async (event, filename) => {
  const dir = getAppDataPath();
  const file = path.join(dir, filename);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(file)) return '{}';
    return fs.readFileSync(file, 'utf-8');
  } catch (e) {
    return '{}';
  }
});

ipcMain.handle('write-inventory', async (event, filename, data) => {
  const dir = getAppDataPath();
  const file = path.join(dir, filename);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, data, 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
});



