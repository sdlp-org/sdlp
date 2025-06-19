import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onSDLPResult: (callback: (data: any) => void) => {
    ipcRenderer.on('sdlp-result', (_event, data) => callback(data));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  generateSDLPLink: async (payload: string): Promise<string> => {
    return await ipcRenderer.invoke('generate-sdlp-link', payload);
  },
  verifySDLPLink: async (link: string): Promise<any> => {
    return await ipcRenderer.invoke('verify-sdlp-link', link);
  },
});
