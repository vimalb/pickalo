import { MainApi } from '../../common/api';

export const apiClient: MainApi = new Proxy({} as any, {
  get({}, prop, {}) {
    return (...args) => window.electron.ipcRenderer.invoke(prop as string, ...args)
  },
});
