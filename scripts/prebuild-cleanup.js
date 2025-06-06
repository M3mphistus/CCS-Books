const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fkill = require('fkill').default;

const forceUnlock = async () => {
  try {
    // Attempt to kill processes locking the app.asar file
    await fkill('ccs.exe', { force: true });
    console.log('Forcefully terminated processes locking app.asar.');
  } catch (error) {
    console.warn('No processes found or failed to terminate:', error.message);
  }
};

const killAppInstances = async () => {
  await forceUnlock();
  try {
    // Kill any running instances of the app
    execSync('taskkill /IM "ccs.exe" /F', { stdio: 'ignore' });
    console.log('Terminated running app instances.');
  } catch (error) {
    console.warn('No running app instances found or failed to terminate.');
  }
};

killAppInstances();

const retryOperation = (operation, retries, delay) => {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      try {
        operation();
        resolve();
      } catch (error) {
        if (retries > 0 && error.code === 'EBUSY') {
          setTimeout(() => {
            attempt();
          }, delay);
          retries--;
        } else {
          reject(error);
        }
      }
    };
    attempt();
  });
};



cleanup();
