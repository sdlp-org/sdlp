import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { clipboard } from 'electron';

const isDev = process.env.NODE_ENV === 'development';

// Set application name as early as possible - before any other app operations
app.setName('Secure Deep Link Demo');

// For macOS, also try to set the application name in the dock immediately
if (process.platform === 'darwin') {
  // Try to set dock name early
  try {
    app.dock?.setIcon(join(__dirname, '../../resources/icon.png'));
  } catch (error) {
    // Icon might not be available yet, will try again later
  }
}

let mainWindow: BrowserWindow | null = null;

// Load the test keys for generating example links
// Use the packaged key files that are distributed with the application
const trustedKeyPaths = [
  join(__dirname, '../../fixtures/valid-key.jwk'), // Packaged with the app
  join(process.cwd(), 'fixtures/valid-key.jwk'), // Development fallback
  join(__dirname, '../../../sdlp-cli/fixtures/valid-key.jwk'), // External fallback
];

const untrustedKeyPaths = [
  join(__dirname, '../../fixtures/untrusted-key.jwk'), // Packaged with the app
  join(process.cwd(), 'fixtures/untrusted-key.jwk'), // Development fallback
];

let trustedKey: any = null;
let untrustedKey: any = null;

// Load trusted key
for (const keyPath of trustedKeyPaths) {
  try {
    trustedKey = JSON.parse(readFileSync(keyPath, 'utf-8'));
    console.log('Successfully loaded trusted key from:', keyPath);
    break;
  } catch (error) {
    // Continue to next path
  }
}

// Load untrusted key
for (const keyPath of untrustedKeyPaths) {
  try {
    untrustedKey = JSON.parse(readFileSync(keyPath, 'utf-8'));
    console.log('Successfully loaded untrusted key from:', keyPath);
    break;
  } catch (error) {
    // Continue to next path
  }
}

if (!trustedKey) {
  console.warn(
    'Could not load trusted key for link generation from any of the attempted paths:',
    trustedKeyPaths
  );
}

if (!untrustedKey) {
  console.warn(
    'Could not load untrusted key for link generation from any of the attempted paths:',
    untrustedKeyPaths
  );
}

if (!trustedKey && !untrustedKey) {
  console.warn(
    'No keys available for link generation. The application will still work for verification, but link generation will be disabled.'
  );
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(details => {
    return { action: 'deny' };
  });

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Helper function to truncate SDLP links for display in dialogs
function truncateSDLPLink(link: string, maxLength: number = 100): string {
  if (link.length <= maxLength) {
    return link;
  }

  // For SDLP links, show the protocol and first/last parts
  if (link.startsWith('sdlp://')) {
    const linkContent = link.substring(7); // Remove 'sdlp://'
    if (linkContent.length <= maxLength - 7) {
      return link;
    }

    const prefixLength = Math.floor((maxLength - 10) / 2); // Account for 'sdlp://' and '...'
    const suffixLength = Math.floor((maxLength - 10) / 2);

    return `sdlp://${linkContent.substring(0, prefixLength)}...${linkContent.substring(linkContent.length - suffixLength)}`;
  }

  // For other links, simple truncation
  return link.substring(0, maxLength - 3) + '...';
}

// Setup IPC handlers
function setupIpcHandlers() {
  // Handle SDLP link generation (trusted)
  ipcMain.handle('generate-sdlp-link', async (_event, payload: string) => {
    try {
      const { createLink } = await import('@sdlp/sdk');

      if (!trustedKey) {
        throw new Error('Trusted key not available for link generation');
      }

      const link = await createLink({
        payload: new TextEncoder().encode(payload),
        payloadType: 'text/plain',
        signer: {
          kid: trustedKey.kid,
          privateKeyJwk: trustedKey,
        },
        compress: 'none',
      });
      return link;
    } catch (error) {
      console.error('Failed to generate SDLP link:', error);
      throw error;
    }
  });

  // Handle SDLP link generation (untrusted)
  ipcMain.handle(
    'generate-untrusted-sdlp-link',
    async (_event, payload: string) => {
      try {
        const { createLink } = await import('@sdlp/sdk');

        if (!untrustedKey) {
          throw new Error('Untrusted key not available for link generation');
        }

        const link = await createLink({
          payload: new TextEncoder().encode(payload),
          payloadType: 'text/plain',
          signer: {
            kid: untrustedKey.kid,
            privateKeyJwk: untrustedKey,
          },
          compress: 'none',
        });
        return link;
      } catch (error) {
        console.error('Failed to generate untrusted SDLP link:', error);
        throw error;
      }
    }
  );

  // Handle SDLP link verification
  ipcMain.handle('verify-sdlp-link', async (_event, link: string) => {
    try {
      const { verifyLink } = await import('@sdlp/sdk');
      const result = await verifyLink(link);
      return result;
    } catch (error) {
      console.error('Failed to verify SDLP link:', error);
      throw error;
    }
  });

  // Handle SDLP link processing with dialog (for test links)
  // This MUST use exactly the same code path as external protocol links
  ipcMain.handle(
    'process-sdlp-link-with-dialog',
    async (_event, link: string, forceUntrusted: boolean = false) => {
      try {
        console.log(
          'IPC handler: Processing SDLP link via same path as protocol handler:',
          link
        );
        // Use exactly the same function call as the protocol handlers
        await processSDLPLink(link, forceUntrusted);
      } catch (error) {
        console.error('Failed to process SDLP link with dialog:', error);
        throw error;
      }
    }
  );

  // Handle command execution (new for Phase 9)
  ipcMain.handle('execute-sdlp-command', async (_event, command: string) => {
    return new Promise((resolve, reject) => {
      // SECURITY: This is still for demonstration.
      const trimmedPayload = command.trim();
      let cmd: string;
      let args: string[];

      if (trimmedPayload.startsWith('echo ')) {
        cmd = 'echo';
        let echoArg = trimmedPayload.substring(5).trim();
        if (
          (echoArg.startsWith('"') && echoArg.endsWith('"')) ||
          (echoArg.startsWith("'") && echoArg.endsWith("'"))
        ) {
          echoArg = echoArg.slice(1, -1);
        }
        args = [echoArg];
      } else {
        const parts = trimmedPayload.split(/\s+/);
        cmd = parts[0];
        args = parts.slice(1);
      }

      const childProcess = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', data => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', data => {
        stderr += data.toString();
      });

      childProcess.on('close', code => {
        const output = stdout + (stderr ? '\n--- STDERR ---\n' + stderr : '');
        resolve({ output, exitCode: code });
      });

      childProcess.on('error', error => {
        reject(error);
      });
    });
  });
}

async function processSDLPLink(
  url: string,
  forceUntrusted: boolean = false
): Promise<void> {
  try {
    console.log('Processing SDLP link:', url);

    // Dynamically import the SDLP SDK
    const { verifyLink } = await import('@sdlp/sdk');

    // Verify the SDLP link
    const result = await verifyLink(url);
    console.log('Verification result:', result);

    let dialogType: 'info' | 'warning' | 'error' | 'none' = 'info';
    let canProceed = false;
    let isTrusted = false;

    let dialogTitle: string;
    let dialogDetail: string;

    if (!result.valid) {
      dialogTitle = '❌ Invalid SDLP Link';
      const truncatedLink = truncateSDLPLink(url, 80);
      const linkDisplay =
        url.length > 80 ? `${truncatedLink} (truncated)` : truncatedLink;
      dialogDetail = `Link: ${linkDisplay}

Error: ${result.error?.message || 'Unknown error'}

This link failed verification and cannot be trusted.`;
      dialogType = 'none';
    } else {
      const payload = new TextDecoder().decode(result.payload);

      // Determine trust level based on sender key
      // TODO: In a real implementation, this should check against a configurable trust store
      // or a list of known senders, not hardcoded values.
      const senderKey = result.sender || '';

      // Check if the sender is our trusted key
      const trustedKeyId = trustedKey?.kid || '';
      const isTrustedSender =
        trustedKeyId && senderKey.includes(trustedKeyId.split('#')[0]);

      isTrusted = !forceUntrusted && isTrustedSender;

      const trustIndicator = isTrusted ? '✅' : '⚠️';
      const trustStatus = isTrusted
        ? 'Trusted Sender'
        : 'Unknown/Untrusted Sender';

      const truncatedLink = truncateSDLPLink(url, 80);
      const linkDisplay =
        url.length > 80 ? `${truncatedLink} (truncated)` : truncatedLink;

      if (isTrusted) {
        dialogTitle = `${trustIndicator} SDLP Link from Trusted Source`;
        dialogDetail = `Link: ${linkDisplay}

Sender:
${result.sender || 'N/A'}
Status: ${trustStatus}

Payload: ${payload}

This link has been cryptographically verified and comes from a trusted source. Do you want to proceed with executing the command?`;
        dialogType = 'none';
      } else {
        dialogTitle = `${trustIndicator} SDLP Link from Unknown Source`;
        dialogDetail = `Link: ${linkDisplay}

Sender:
${result.sender || 'N/A'}
Status: ${trustStatus}

Payload: ${payload}

This link is cryptographically valid but comes from an unknown or untrusted source. Proceed with caution. Do you want to continue?`;
        dialogType = 'none';
      }

      canProceed = true;
    }

    // Show blocker dialog with copy button for full link
    const buttons = canProceed
      ? ['Proceed', 'Copy Full Link', 'Cancel']
      : ['Copy Full Link', 'OK'];
    const response = await dialog.showMessageBox(mainWindow!, {
      type: 'none',
      title: 'SDLP Link Processing',
      message: dialogTitle,
      detail: dialogDetail,
      icon: join(__dirname, '../../resources/icon.png'),
      buttons: buttons,
      defaultId: canProceed ? 2 : 1, // Default to Cancel/OK
      cancelId: canProceed ? 2 : 1,
    });

    // Handle copy button - just copy silently without confirmation dialog
    if (
      (canProceed && response.response === 1) ||
      (!canProceed && response.response === 0)
    ) {
      clipboard.writeText(url);
      return;
    }

    if (!canProceed || response.response !== 0) {
      // User cancelled or link was invalid
      console.log('User cancelled or link was invalid');
      return;
    }

    // User chose to proceed - send command to renderer for confirmation
    if (!result.valid) {
      throw new Error('Unexpected: result should be valid at this point');
    }

    const payload = new TextDecoder().decode(result.payload);
    const status = isTrusted ? 'success' : 'untrusted';

    mainWindow?.webContents.send('sdlp-command-to-execute', {
      status: status,
      from: result.sender || 'Unknown',
      command: payload,
      message: isTrusted
        ? undefined
        : 'This link is valid but from an untrusted source',
    });
  } catch (error) {
    console.error('Error processing SDLP link:', error);

    // Show error dialog with copy button
    const response = await dialog.showMessageBox(mainWindow!, {
      type: 'none',
      title: 'SDLP Processing Error',
      message: '❌ Failed to process SDLP link',
      detail: `Link: ${truncateSDLPLink(url, 80)}

Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      buttons: ['Copy Full Link', 'OK'],
      icon: join(__dirname, '../../resources/icon.png'),
    });

    // Handle copy button in error dialog - just copy silently
    if (response.response === 0) {
      clipboard.writeText(url);
    }
  }
}

// Handle SDLP protocol
app.setAsDefaultProtocolClient('sdlp');

// Handle the protocol on different platforms
if (process.platform === 'darwin') {
  // macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log(
      'Protocol handler: Processing SDLP link via same path as IPC handler:',
      url
    );
    if (url.startsWith('sdlp://')) {
      processSDLPLink(url);
    }
  });
} else {
  // Windows/Linux - check command line arguments
  const sdlpUrl = process.argv.find(arg => arg.startsWith('sdlp://'));
  if (sdlpUrl) {
    app.whenReady().then(() => {
      console.log(
        'Command line: Processing SDLP link via same path as IPC handler:',
        sdlpUrl
      );
      processSDLPLink(sdlpUrl);
    });
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(join(__dirname, '../../resources/icon.png'));
  }
  setupIpcHandlers();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
