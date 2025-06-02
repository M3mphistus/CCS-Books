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
  migrateSaveFiles(); // Migration ausführen
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC for reading/writing inventory files
const getAppDataPath = () => {
  return path.join(
    process.env.APPDATA || process.env.HOME || process.env.USERPROFILE,
    'local',
    'ccs-books'
  );
};

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

ipcMain.handle('migrate-save-files', async () => {
  try {
    const oldPath = path.join(os.homedir(), 'AppData', 'Roaming', 'local', 'ccs-books');
    const newPath = path.join(os.homedir(), 'Documents', 'CCS-Books');

    if (fs.existsSync(oldPath)) {
      if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true });
      }

      const files = fs.readdirSync(oldPath);
      for (const file of files) {
        const oldFilePath = path.join(oldPath, file);
        const newFilePath = path.join(newPath, file);
        fs.renameSync(oldFilePath, newFilePath);
      }

      console.log('Speicherdaten erfolgreich migriert.');
    }
  } catch (error) {
    console.error('Fehler bei der Migration der Speicherdaten:', error);
    throw error;
  }
});
