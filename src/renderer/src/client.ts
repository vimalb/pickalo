import { MainApi, RendererApi } from '../../common/api';

export const apiClient: MainApi = new Proxy({} as any, {
  get({}, prop, {}) {
    return (...args) => window.electron.ipcRenderer.invoke(prop as string, ...args)
  },
});

let currentServer: RendererApi = new Proxy({} as any, {
  get() {
    return () => {}
  },
});
window.electron.ipcRenderer.on(`invoke-renderer`, ({}, ...args) => {
  const [method, ...methodArgs] = args;
  currentServer[method](...methodArgs);
});  

export const initRendererServer = (server: RendererApi) => {
  currentServer = server;
}

