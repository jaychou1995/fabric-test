import fs from 'fs';
import * as electronBuild from 'electron-builder';
import path from 'path';

//打包需要index.html文件,需要vite先打包完成在进行打包
export const ElectronBuildPlugin = () => {
  return {
    name: 'electron-build',
    closeBundle() {
      //electron build需要指定packge.json的main
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
      packageJson.main = './background.js';
      fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 4));
      // bug electron-build 下载垃圾文件
      fs.mkdirSync('dist/node_modules');

      electronBuild.build({
        config: {
          directories: {
            output: path.resolve(process.cwd(), 'release'),
            app: path.resolve(process.cwd(), 'dist'),
          },
          appId: 'com.engagetest',
          productName: 'engagetest',
          nsis: {
            oneClick: false, // 是否一键安装
            perMachine: true, // 是否按用户安装
            allowToChangeInstallationDirectory: true // 是否允许修改安装目录
          }
        }
      })
    }
  }
}