import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onSDLPResult: (callback: (data: any) => void) => {
    ipcRenderer.on('sdlp-result', (_event, data) => callback(data));
  },
  onSDLPCommandToExecute: (callback: (data: any) => void) => {
    ipcRenderer.on('sdlp-command-to-execute', (_event, data) => callback(data));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  generateSDLPLink: async (payload: string): Promise<string> => {
    return await ipcRenderer.invoke('generate-sdlp-link', payload);
  },
  generateUntrustedSDLPLink: async (payload: string): Promise<string> => {
    return await ipcRenderer.invoke('generate-untrusted-sdlp-link', payload);
  },
  verifySDLPLink: async (link: string): Promise<any> => {
    return await ipcRenderer.invoke('verify-sdlp-link', link);
  },
  processSDLPLinkWithDialog: async (
    link: string,
    forceUntrusted: boolean = false
  ): Promise<void> => {
    return await ipcRenderer.invoke(
      'process-sdlp-link-with-dialog',
      link,
      forceUntrusted
    );
  },
  executeSDLPCommand: async (
    command: string
  ): Promise<{ output: string; exitCode: number }> => {
    return await ipcRenderer.invoke('execute-sdlp-command', command);
  },
  // Trust Store APIs (new for Phase 11)
  trustStore: {
    isTrusted: async (did: string): Promise<boolean> => {
      return await ipcRenderer.invoke('trust-store-is-trusted', did);
    },
    addTrusted: async (did: string, label?: string): Promise<boolean> => {
      return await ipcRenderer.invoke('trust-store-add-trusted', did, label);
    },
    removeTrusted: async (did: string): Promise<boolean> => {
      return await ipcRenderer.invoke('trust-store-remove-trusted', did);
    },
    getAll: async (): Promise<Record<string, { addedAt: string; label?: string }>> => {
      return await ipcRenderer.invoke('trust-store-get-all');
    },
    clear: async (): Promise<boolean> => {
      return await ipcRenderer.invoke('trust-store-clear');
    },
  },
});
