<div align="center">
  <img src="../../../assets/logo.png" alt="SDLP Logo" width="200"/>
</div>

# SDLP Electron Demo Application v1.1.0

A comprehensive Electron application that demonstrates the Secure Deep Link Protocol (SDLP) with an interactive user interface for testing, generating, and verifying SDLP links.

## 🚀 Quick Start

**Get up and running in 30 seconds:**

```bash
# 1. Clone the repository (if you haven't already)
git clone https://github.com/sdlp-org/sdlp.git
cd sdlp

# 2. Navigate to the demo directory
cd implementations/ts/sdlp-electron-demo

# 3. Install dependencies
npm install

# 4. Start the app
npm run dev
```

The Electron app will open with:
- **Home Tab**: Learn about SDLP and test example links
- **Tester Tab**: Create and verify your own SDLP links
- **Protocol Handler**: Automatically handles `sdlp://` links from your system

💡 **Try it immediately**: Click the example links in the Home tab to see SDLP in action!

## Documentation

- **[Getting Started Guide](../../../GETTING_STARTED.md)** - Complete setup and usage guide
- **[SDLP SDK API](../sdlp-sdk/docs/API.md)** - SDK API reference
- **[SDLP Specification](../../../specs/sdlp-v0.1-draft.md)** - Protocol specification

## Features

### Core Protocol Features

- **Protocol Handler**: Registers as the default handler for `sdlp://` links
- **Cryptographic Verification**: Uses the SDLP SDK to verify link authenticity and integrity
- **Two-Step Command Execution**: Decoupled verification and execution with explicit user confirmation
- **Security Dialogs**: Multi-layered user consent - initial verification dialog plus explicit execution confirmation
- **Safe Command Execution**: Commands are executed only after user explicitly clicks "Execute Command" button

### Interactive User Interface

- **Tabbed Navigation**: Clean two-tab interface (Home and Tester)
- **Protocol Introduction**: Educational content explaining SDLP benefits and security features
- **Example Links**: Pre-built test links demonstrating valid, invalid, and untrusted scenarios
- **Link Generator**: Interactive tool to create SDLP links from custom payloads
- **Link Verifier**: Tool to verify and inspect any SDLP link
- **Real-time Results**: Live verification status with detailed feedback
- **Terminal Output**: Styled terminal display for command execution results

## Architecture

The application follows standard Electron architecture with three main processes:

- **Main Process** (`src/main/index.ts`): Handles protocol registration, SDLP verification, and command execution
- **Preload Script** (`src/preload/index.ts`): Securely exposes IPC functionality to the renderer
- **Renderer Process** (`src/renderer/`): Provides the user interface, built with React.

## Technology Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe JavaScript development
- **React**: A JavaScript library for building user interfaces
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
2. The application will open with two main tabs:

#### Home Tab

- **Protocol Introduction**: Learn about SDLP and its security benefits
- **Example Links**: Test the protocol with pre-built examples:
  - **Valid Link**: Demonstrates successful verification and execution
  - **Invalid Link**: Shows how invalid signatures are rejected
  - **Untrusted Link**: Displays warnings for unknown senders
- **Status Display**: View real-time verification results and command output

#### Tester Tab

- **Link Generator**:
  - Enter any command payload (e.g., `echo "Hello World!"`)
  - Click "Generate Link" to create a signed SDLP link
  - Use the "Copy" button to copy the link to clipboard
- **Link Verifier**:
  - Paste any SDLP link to verify its authenticity
  - View detailed verification results including sender DID and payload

#### Deep Link Testing

You can also test the protocol handler directly:

1. Generate a link using the Tester tab or CLI tool
2. Open the link from your system: `open "sdlp://..."`
3. A security dialog will appear asking for permission to proceed
4. Click "Proceed" to execute the command or "Cancel" to abort

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
├── renderer/       # Renderer process (UI)
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks
│   ├── main.tsx    # React entry point
│   └── style.css   # Tailwind CSS styles
└── fixtures/       # Test keys and data (packaged with app)
    └── valid-key.jwk # Test signing key for link generation
```

## How It Works

1. **Protocol Registration**: The app registers as the default handler for `sdlp://` links
2. **Link Capture**: When a link is opened, the main process captures it via OS events
3. **Verification**: The SDLP SDK verifies the link's cryptographic signature and integrity
4. **User Consent**: A security dialog asks for permission to proceed with the verified command
5. **Command Display**: If approved, the command is sent to the renderer and displayed on the home screen
6. **Explicit Execution**: User must click the "Execute Command" button to actually run the command
7. **Safe Execution**: Commands are executed using `child_process.spawn` only after explicit user confirmation
8. **Output Display**: Results are sent to the renderer and displayed in a styled terminal interface

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
