import { MainApi, RendererApi } from '../../common/api';

export const apiClient: MainApi = new Proxy({} as any, {
  get({}, prop, {}) {
    return (...args) => window.electron.ipcRenderer.invoke(prop as string, ...args)
  },
});

interface TemporaryRendererApi {
  invokePending: (realApi: RendererApi) => void
}

let currentServer: RendererApi | TemporaryRendererApi = (() => {
  const pendingInvocations: { prop: string, args: string[]}[] = [];
  return new Proxy({} as any, {
    get({}, prop, {}) {
      if(prop === 'invokePending') {
        return (realApi: RendererApi) => {
          pendingInvocations.forEach(invc => realApi[invc.prop](invc.args))
        }
      } else {
        return (...args) => pendingInvocations.push({ prop: prop as string, args})
      }
    },
  });
})();

window.electron.ipcRenderer.on(`invoke-renderer`, ({}, ...args) => {
  const [method, ...methodArgs] = args;
  currentServer[method](...methodArgs);
});  

export const initRendererServer = (server: RendererApi) => {
  const temporaryRendererApi = currentServer as TemporaryRendererApi;
  if(temporaryRendererApi.invokePending !== undefined) {
    setTimeout(() => {
      temporaryRendererApi.invokePending(server);
    }, 10);
  }
  currentServer = server;
}

