const { app, BrowserWindow, ipcMain } = require('electron');
const addon = require(`../cpp/build/${isDev ? 'Debug' : 'Release'}/youchat-addon`);

const isDev = process.env.NODE_ENV === 'dev';

app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true
        },
    });

    isDev ? mainWindow.loadURL('http://localhost:3000') : mainWindow.loadFile('./build/index.html');
    isDev && mainWindow.webContents.openDevTools();

    let server;
    ipcMain.on('certs', (_, { key, cert, ca }) => {
        if (!server) {
            addon.init(ca, cert, key);
            server = new addon.Server();
            server.serve(9999, mainWindow.webContents.send.bind(mainWindow.webContents));
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
