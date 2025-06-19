# SDLP Electron MVP

A minimal viable product (MVP) Electron application that demonstrates the Secure Deep Link Protocol (SDLP) by handling `sdlp://` protocol links, verifying them cryptographically, and executing commands from verified payloads.

## Features

- **Protocol Handler**: Registers as the default handler for `sdlp://` links
- **Cryptographic Verification**: Uses the SDLP SDK to verify link authenticity and integrity
- **Command Execution**: Safely executes commands from verified payloads using `child_process.spawn`
- **Terminal UI**: Displays command output in a styled terminal with syntax highlighting
- **Security**: Implements proper Electron security practices with context isolation and sandboxing

## Architecture

The application follows standard Electron architecture with three main processes:

- **Main Process** (`src/main/index.ts`): Handles protocol registration, SDLP verification, and command execution
- **Preload Script** (`src/preload/index.ts`): Securely exposes IPC functionality to the renderer
- **Renderer Process** (`src/renderer/`): Provides the user interface with terminal display

## Technology Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe JavaScript development
- **Electron Vite**: Modern build tooling for Electron
- **Tailwind CSS**: Utility-first CSS framework
- **@xterm/xterm**: Terminal emulator for the web
- **Shiki**: Syntax highlighting
- **@sdlp/sdk**: SDLP protocol implementation

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Testing

To test the application:

1. Start the development server: `npm run dev`
2. Create a test SDLP link using the CLI tool
3. Open the link in your browser or terminal: `open "sdlp://..."`
4. The Electron app should launch and process the link

## Security Considerations

⚠️ **WARNING**: This MVP executes arbitrary commands from SDLP links. In a production environment, you should implement:

- **User Confirmation**: Require explicit user approval before executing commands
- **Command Sandboxing**: Execute commands in isolated environments
- **Allow-listing**: Restrict to a predefined set of safe commands
- **Input Validation**: Sanitize and validate all command inputs

## Project Structure

```
src/
├── main/           # Main Electron process
│   └── index.ts    # Protocol handling and command execution
├── preload/        # Preload scripts
│   └── index.ts    # IPC context bridge
└── renderer/       # Renderer process (UI)
    ├── index.html  # Main HTML template
    ├── index.ts    # UI logic and terminal handling
    └── style.css   # Tailwind CSS styles
```

## How It Works

1. **Protocol Registration**: The app registers as the default handler for `sdlp://` links
2. **Link Capture**: When a link is opened, the main process captures it via OS events
3. **Verification**: The SDLP SDK verifies the link's cryptographic signature and integrity
4. **Command Parsing**: Valid payloads are parsed to extract commands and arguments
5. **Execution**: Commands are executed using `child_process.spawn` for security
6. **Display**: Output is sent to the renderer and displayed in a styled terminal

## Integration with SDLP Ecosystem

This application integrates with:

- **@sdlp/sdk**: For cryptographic verification and DID resolution
- **@sdlp/cli**: For creating test SDLP links
- **SDLP Protocol**: Implements the full SDLP verification workflow

## Future Enhancements

- Enhanced security controls and user confirmation dialogs
- Support for more complex payload types beyond simple commands
- Integration with system notifications
- Command history and logging
- Configuration management for trusted senders
