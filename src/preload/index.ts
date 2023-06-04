import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface PreloadApi {
  isPreloadMethod: () => boolean;
}

// Custom APIs for renderer
const preloadApi: PreloadApi = {
  isPreloadMethod: () => true
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('preloadApi', preloadApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
