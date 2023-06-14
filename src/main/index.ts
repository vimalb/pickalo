import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { apiServer, initRendererApiClient, rendererApiClient } from './server';
import { processInstallWindowsShellExtensions, processUninstallWindowsShellExtensions } from './shellex';
import { CLISwitches } from './cli';

console.log(process.argv)

if(app.commandLine.hasSwitch(CLISwitches.INSTALL_WINDOWS_SHELL_EX)) {
  (async () => {
    await processUninstallWindowsShellExtensions();
    await processInstallWindowsShellExtensions();
    app.quit();
    process.exit();  
  })();
} else if(app.commandLine.hasSwitch(CLISwitches.UNINSTALL_WINDOWS_SHELL_EX)) {
  (async () => {
    await processUninstallWindowsShellExtensions();
    app.quit();
    process.exit();
  })();
} else {

  const cliArgs = Object.fromEntries(Object.values(CLISwitches).map(sw => [
    sw,
    app.commandLine.hasSwitch(sw) ? app.commandLine.getSwitchValue(sw) : null
  ]));
  
  
  const singleAppLock = app.requestSingleInstanceLock(cliArgs);
  
  if(!singleAppLock) {
    app.quit();
    process.exit();
  }
  
  
  let mainWindow: BrowserWindow | null = null;
  
  const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: false
      }
    });

    initRendererApiClient(mainWindow.webContents);
  
    app.on('second-instance', ({}, {}, workingDirectory, additionalData) => {
      // Print out data received from the second instance.
      const secondSwitches: Record<CLISwitches,string|null> = additionalData as any;
      console.log(`Second instance launched in ${workingDirectory} with ${JSON.stringify(secondSwitches)}`)
      if(secondSwitches.unsorted_jpg) {
        rendererApiClient.setUnsortedJpegDirectory(secondSwitches.unsorted_jpg);
      }
      if(secondSwitches.unsorted_raw) {
        rendererApiClient.setUnsortedRawDirectory(secondSwitches.unsorted_raw);
      }
      if(secondSwitches.sorted_jpg) {
        rendererApiClient.setSortedJpegDirectory(secondSwitches.sorted_jpg);
      }
      if(secondSwitches.sorted_raw) {
        rendererApiClient.setSortedRawDirectory(secondSwitches.sorted_raw);
      }

    
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow?.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow?.focus();
    });
    
    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
    });
  
    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    });
  
    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')
  
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  
    createWindow()
  
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  
  })
  
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
  
  // Bind main server to IPC
  Object.keys(apiServer).forEach(method => {
    ipcMain.handle(method, async ({}, ...args) => {
      const result = await apiServer[method](...args)
      return result
    })
  });
}

