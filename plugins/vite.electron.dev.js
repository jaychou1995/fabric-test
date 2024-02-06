
import { spawn } from 'child_process'
import electron from 'electron';
import fs from 'fs';

// vite 插件要求必须导出一个对象,对象有一个name
// 这个对象有很多钩子
export const ElectronDevPlugin = () => {
  return {
    name: 'electron-dev',
    configureServer(server) {
      server.httpServer.on('listening', (req, res) => {
        const addressInfo = server.httpServer.address(); //读取vite服务信息
        //拼接ip地址,给electron启动用
        const IP = `http://loclahost:${addressInfo.port}`;
        // 第一个参数是electron入口文件
        // require('electron')返回一个路径
        let electronProcess = spawn(electron, ['./src/background.js', IP]);
        fs.watchFile('./src/background.js', () => {
          electronProcess.kill();
          electronProcess = spawn(electron, ['./src/background.js', IP]);
        })
        electronProcess.stderr.on('data', (data) => {
          console.log(data.toString());
        })
      })
    }
  }
}