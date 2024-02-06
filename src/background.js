// electron 主进程文件
import { app, BrowserWindow } from "electron";

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true, // 是否在渲染进程开启node的api
      contextIsolation: false, // 是否开启隔离上下文
      webSecurity: false // 是否允许跨域
    }
  });

  win.webContents.openDevTools()

  //判断是否是开发环境还是生产环境
  const dev = process.env.NODE_ENV === 'development'
  if(dev){
    win.loadURL("http://localhost:5173/");
  }else{
    win.loadFile('index.html')
  }

})