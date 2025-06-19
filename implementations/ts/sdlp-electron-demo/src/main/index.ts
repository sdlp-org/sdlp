import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

// Load the test key for generating example links
// Use the packaged key file that's distributed with the application
const possibleKeyPaths = [
  join(__dirname, '../../fixtures/valid-key.jwk'), // Packaged with the app
  join(process.cwd(), 'fixtures/valid-key.jwk'), // Development fallback
  join(__dirname, '../../../sdlp-cli/fixtures/valid-key.jwk'), // External fallback
];

let testKey: any = null;

for (const keyPath of possibleKeyPaths) {
  try {
    testKey = JSON.parse(readFileSync(keyPath, 'utf-8'));
    console.log('Successfully loaded test key from:', keyPath);
    break;
  } catch (error) {
    // Continue to next path
  }
}

if (!testKey) {
  console.warn(
    'Could not load test key for link generation from any of the attempted paths:',
    possibleKeyPaths
  );
  console.warn(
    'The application will still work for verification, but link generation will be disabled.'
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

// Setup IPC handlers
function setupIpcHandlers() {
  // Handle SDLP link generation
  ipcMain.handle('generate-sdlp-link', async (_event, payload: string) => {
    try {
      const { createLink } = await import('@sdlp/sdk');

      if (!testKey) {
        throw new Error('Test key not available for link generation');
      }

      const link = await createLink({
        payload: new TextEncoder().encode(payload),
        payloadType: 'text/plain',
        signer: {
          kid: testKey.kid,
          privateKeyJwk: testKey,
        },
        compress: 'none',
      });
      return link;
    } catch (error) {
      console.error('Failed to generate SDLP link:', error);
      throw error;
    }
  });

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
  ipcMain.handle(
    'process-sdlp-link-with-dialog',
    async (_event, link: string, forceUntrusted: boolean = false) => {
      try {
        // This will trigger the same flow as a real deep link
        await processSDLPLink(link, forceUntrusted);
      } catch (error) {
        console.error('Failed to process SDLP link with dialog:', error);
        throw error;
      }
    }
  );
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
      dialogDetail = `Link: ${url}\n\nError: ${result.error?.message || 'Unknown error'}\n\nThis link failed verification and cannot be trusted.`;
      dialogType = 'none';
    } else {
      const payload = new TextDecoder().decode(result.payload);

      // Determine trust level - for demo purposes, we'll consider our test key as trusted
      // TODO: In a real implementation, this should check against a configurable trust store
      // or a list of known senders, not hardcoded values.
      const senderKey = result.sender || '';
      isTrusted =
        !forceUntrusted &&
        (senderKey.includes('test-key-1') ||
          senderKey.includes('trusted') ||
          senderKey.includes('z6MkozXRpKZqLRoLWE6dUTWpSp2Sw2nRrEY')); // Our actual test key identifier

      const trustIndicator = isTrusted ? '✅' : '⚠️';
      const trustStatus = isTrusted
        ? 'Trusted Sender'
        : 'Unknown/Untrusted Sender';

      if (isTrusted) {
        dialogTitle = `${trustIndicator} SDLP Link from Trusted Source`;
        // Format the dialog detail to match the desired layout from Image 2
        dialogDetail = `Link: ${url}

Sender:
${result.sender || 'N/A'}
Status: ${trustStatus}

Payload: ${payload}

This link has been cryptographically verified and comes from a trusted source. Do you want to proceed with executing the command?`;
        dialogType = 'none';
      } else {
        dialogTitle = `${trustIndicator} SDLP Link from Unknown Source`;
        // Format the dialog detail to match the desired layout from Image 2
        dialogDetail = `Link: ${url}

Sender:
${result.sender || 'N/A'}
Status: ${trustStatus}

Payload: ${payload}

This link is cryptographically valid but comes from an unknown or untrusted source. Proceed with caution. Do you want to continue?`;
        dialogType = 'none';
      }

      canProceed = true;
    }

    // Show blocker dialog
    const response = await dialog.showMessageBox(mainWindow!, {
      type: 'none',
      title: 'SDLP Link Processing',
      message: dialogTitle,
      detail: dialogDetail,
      icon: join(__dirname, '../../resources/icon.png'),
      buttons: canProceed ? ['Proceed', 'Cancel'] : ['OK'],
      defaultId: canProceed ? 1 : 0, // Default to Cancel/OK
      cancelId: canProceed ? 1 : 0,
    });

    if (!canProceed || response.response !== 0) {
      // User cancelled or link was invalid
      console.log('User cancelled or link was invalid');
      return;
    }

    // User chose to proceed - execute the command
    // At this point we know result.valid is true, so we can safely cast
    if (!result.valid) {
      throw new Error('Unexpected: result should be valid at this point');
    }

    const payload = new TextDecoder().decode(result.payload);
    console.log('Command payload:', payload);

    // SECURITY: In a production application, never execute arbitrary commands from a payload.
    // This is for demonstration purposes only. A real application should have a strict
    // allowlist of commands and sanitize all arguments.
    const trimmedPayload = payload.trim();

    // For this MVP, we'll use a simple approach: if it starts with 'echo', handle it specially
    let command: string;
    let args: string[];

    if (trimmedPayload.startsWith('echo ')) {
      command = 'echo';
      // Extract everything after 'echo ' as a single argument, removing outer quotes if present
      let echoArg = trimmedPayload.substring(5).trim();
      if (
        (echoArg.startsWith('"') && echoArg.endsWith('"')) ||
        (echoArg.startsWith("'") && echoArg.endsWith("'"))
      ) {
        echoArg = echoArg.slice(1, -1);
      }
      args = [echoArg];
    } else {
      // Fallback to simple space splitting for other commands
      const parts = trimmedPayload.split(/\s+/);
      command = parts[0];
      args = parts.slice(1);
    }

    console.log('Executing command:', command, 'with args:', args);

    // Execute the command using spawn
    const childProcess = spawn(command, args, {
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

      // Send appropriate status based on trust level
      const status = isTrusted ? 'success' : 'untrusted';

      mainWindow?.webContents.send('sdlp-result', {
        status: status,
        from: result.sender || 'Unknown',
        command: payload,
        output: output,
        exitCode: code,
        switchToHome: true,
        message: isTrusted
          ? undefined
          : 'This link is valid but from an untrusted source',
      });
    });

    childProcess.on('error', error => {
      mainWindow?.webContents.send('sdlp-result', {
        status: 'error',
        message: `Command execution failed: ${error.message}`,
      });
    });
  } catch (error) {
    console.error('Error processing SDLP link:', error);

    // Show error dialog
    await dialog.showMessageBox(mainWindow!, {
      type: 'none',
      title: 'SDLP Processing Error',
      message: '❌ Failed to process SDLP link',
      detail: `Link: ${url}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
      buttons: ['OK'],
      icon: join(__dirname, '../../resources/icon.png'),
    });
  }
}

// Handle SDLP protocol
app.setAsDefaultProtocolClient('sdlp');

// Handle the protocol on different platforms
if (process.platform === 'darwin') {
  // macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('sdlp://')) {
      processSDLPLink(url);
    }
  });
} else {
  // Windows/Linux - check command line arguments
  const sdlpUrl = process.argv.find(arg => arg.startsWith('sdlp://'));
  if (sdlpUrl) {
    app.whenReady().then(() => {
      processSDLPLink(sdlpUrl!);
    });
  }
}

// Set application name early to ensure it shows in dock
app.setName('SDLP Electron Demo');

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
