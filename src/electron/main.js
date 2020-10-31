const isDev = process.env.NODE_ENV === 'dev';

const { app, BrowserWindow, ipcMain } = require('electron')

const addon = require(isDev ? '../cpp/build/Debug/youchat-addon' : '../cpp/build/Release/youchat-addon');

app.whenReady().then(async () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadFile('./build/index.html');
    }

    isDev && mainWindow.webContents.openDevTools();

    let initialized = false;
    ipcMain.on('certs', (event, { key, cert, ca }) => {
        if (!initialized) {
            initialized = true;
            addon.init(ca, cert, key);
            const server = new addon.Server();
            server.serve(9999, mainWindow.webContents.send.bind(mainWindow.webContents));
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
