import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn } from 'child_process'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function processSDLPLink(url: string): Promise<void> {
  try {
    console.log('Processing SDLP link:', url)
    
    // Dynamically import the SDLP SDK
    const { verifyLink } = await import('@sdlp/sdk')
    
    // Verify the SDLP link
    const result = await verifyLink(url)
    console.log('Verification result:', result)
    
    if (!result.valid) {
      mainWindow?.webContents.send('sdlp-result', {
        status: 'error',
        message: `Invalid link: ${result.error.message || 'Unknown error'}`
      })
      return
    }

    // Parse the payload as a command string - convert Uint8Array to string
    const payload = new TextDecoder().decode(result.payload)
    console.log('Command payload:', payload)
    
    // Better command parsing - handle quoted strings properly
    const trimmedPayload = payload.trim()
    
    // For this MVP, we'll use a simple approach: if it starts with 'echo', handle it specially
    let command: string
    let args: string[]
    
    if (trimmedPayload.startsWith('echo ')) {
      command = 'echo'
      // Extract everything after 'echo ' as a single argument, removing outer quotes if present
      let echoArg = trimmedPayload.substring(5).trim()
      if ((echoArg.startsWith('"') && echoArg.endsWith('"')) || 
          (echoArg.startsWith("'") && echoArg.endsWith("'"))) {
        echoArg = echoArg.slice(1, -1)
      }
      args = [echoArg]
    } else {
      // Fallback to simple space splitting for other commands
      const parts = trimmedPayload.split(/\s+/)
      command = parts[0]
      args = parts.slice(1)
    }
    
    console.log('Executing command:', command, 'with args:', args)
    
    // Execute the command using spawn
    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    childProcess.on('close', (code) => {
      const output = stdout + (stderr ? '\n--- STDERR ---\n' + stderr : '')
      
      mainWindow?.webContents.send('sdlp-result', {
        status: 'success',
        from: result.sender,
        command: payload,
        output: output,
        exitCode: code
      })
    })
    
    childProcess.on('error', (error) => {
      mainWindow?.webContents.send('sdlp-result', {
        status: 'error',
        message: `Command execution failed: ${error.message}`
      })
    })
    
  } catch (error) {
    console.error('Error processing SDLP link:', error)
    mainWindow?.webContents.send('sdlp-result', {
      status: 'error',
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}

// Handle SDLP protocol
app.setAsDefaultProtocolClient('sdlp')

// Handle the protocol on different platforms
if (process.platform === 'darwin') {
  // macOS
  app.on('open-url', (event, url) => {
    event.preventDefault()
    if (url.startsWith('sdlp://')) {
      processSDLPLink(url)
    }
  })
} else {
  // Windows/Linux - check command line arguments
  const sdlpUrl = process.argv.find(arg => arg.startsWith('sdlp://'))
  if (sdlpUrl) {
    app.whenReady().then(() => {
      processSDLPLink(sdlpUrl)
    })
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
