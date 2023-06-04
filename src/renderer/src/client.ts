import { MainApi } from '../../common/api';

export const apiClient: MainApi = new Proxy({} as any, {
  get(target, prop, receiver) {
    return (...args) => window.electron.ipcRenderer.invoke(prop as string, ...args)
  },
});
