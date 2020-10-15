const isDev = process.env.NODE_ENV === 'dev';

const { app, BrowserWindow } = require('electron')
const cwd = process.cwd();

const addon = require(isDev ? '../cpp/build/Debug/youchat-addon' : '../cpp/build/Release/youchat-addon');

addon.init(cwd + "/assets/ca.cert.pem", cwd + "/assets/1.cert.pem", cwd + "/assets/1.private.pem");

app.whenReady().then(async () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadFile('./build/index.html');
    }

    isDev && mainWindow.webContents.openDevTools();

    mainWindow.webContents.once('did-finish-load', () => {
        const server = new addon.Server();
        server.serve(9999, mainWindow.webContents.send.bind(mainWindow.webContents));
    });
});

app.on('window-all-closed', () => {
    app.quit();
});
