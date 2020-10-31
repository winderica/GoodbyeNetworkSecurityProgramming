const process = window.require('process');
const isDev = process.env.NODE_ENV === 'dev';
const cwd = process.cwd();
export const addon = window.require(isDev ? cwd + '/src/cpp/build/Debug/youchat-addon' : '../src/cpp/build/Release/youchat-addon');
