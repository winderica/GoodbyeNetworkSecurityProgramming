const process = window.require('process');
const isDev = process.env.NODE_ENV === 'dev';
const cwd = process.cwd();
const addon = window.require(isDev ? cwd + '/src/cpp/build/Debug/youchat-addon' : '../src/cpp/build/Release/youchat-addon');

addon.init(cwd + "/assets/ca.cert.pem", cwd + "/assets/1.cert.pem", cwd + "/assets/1.private.pem");

export const client = new addon.Client();
