// Define a type for the data received from the main process
export interface SDLPResult {
  status: 'success' | 'untrusted' | 'error';
  from?: string;
  command?: string;
  output?: string;
  exitCode?: number;
  message?: string;
  switchToHome?: boolean;
}

// Extend the Window interface to include our electronAPI
declare global {
  interface Window {
    electronAPI: {
      onSDLPResult: (callback: (data: SDLPResult) => void) => void;
      onSDLPCommandToExecute: (callback: (data: SDLPResult) => void) => void;
      onSDLPCommandOutput: (callback: (data: { output: string; exitCode: number }) => void) => void;
      removeAllListeners: (channel: string) => void;
      generateSDLPLink: (payload: string) => Promise<string>;
      generateUntrustedSDLPLink: (payload: string) => Promise<string>;
      verifySDLPLink: (link: string) => Promise<any>;
      processSDLPLinkWithDialog: (
        link: string,
        forceUntrusted?: boolean
      ) => Promise<void>;
      executeSDLPCommand: (
        command: string
      ) => Promise<{ output: string; exitCode: number }>;
      trustStore: {
        isTrusted: (did: string) => Promise<boolean>;
        addTrusted: (did: string, label?: string) => Promise<boolean>;
        removeTrusted: (did: string) => Promise<boolean>;
        getAll: () => Promise<Record<string, { addedAt: string; label?: string }>>;
        clear: () => Promise<boolean>;
      };
    };
  }
}
