const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ccsAPI', {
  readInventory: (filename) => ipcRenderer.invoke('read-inventory', filename),
  writeInventory: (filename, data) => ipcRenderer.invoke('write-inventory', filename, data),
});
