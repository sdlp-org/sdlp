import { Terminal } from '@xterm/xterm';
import { getHighlighter } from 'shiki';

// Define a type for the data received from the main process
interface SDLPResult {
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
    };
  }
}

class SDLPRenderer {
  private terminal: Terminal | null = null;
  private highlighter: any = null;
  private currentTab: string = 'home';

  constructor() {
    this.initializeHighlighter();
    this.setupEventListeners();
    this.setupTabNavigation();
    this.setupExampleLinks();
    this.setupTesterFunctionality();
    this.populateExamples();
  }

  private async initializeHighlighter() {
    try {
      this.highlighter = await getHighlighter({
        themes: ['dark-plus'],
        langs: ['bash', 'shell'],
      });
    } catch (error) {
      console.warn('Failed to initialize syntax highlighter:', error);
    }
  }

  private setupEventListeners() {
    // Listen for SDLP results from the main process
    window.electronAPI.onSDLPResult(data => {
      this.handleSDLPResult(data);
    });

    // Listen for SDLP commands to execute (new for Phase 9)
    window.electronAPI.onSDLPCommandToExecute(data => {
      this.handleSDLPCommand(data);
    });
  }

  private setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log('Found tab buttons:', tabButtons.length);

    tabButtons.forEach((button, index) => {
      console.log(
        `Setting up tab button ${index}:`,
        button.getAttribute('data-tab')
      );
      button.addEventListener('click', e => {
        console.log('Tab button clicked:', e.target);
        const target = e.target as HTMLButtonElement;
        const tabName = target.getAttribute('data-tab');
        console.log('Switching to tab:', tabName);
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Setup navigation buttons in Home tab
    const goToExamplesBtn = document.getElementById('go-to-examples');
    const goToToolsBtn = document.getElementById('go-to-tools');

    if (goToExamplesBtn) {
      goToExamplesBtn.addEventListener('click', () => {
        this.switchTab('examples');
      });
    }

    if (goToToolsBtn) {
      goToToolsBtn.addEventListener('click', () => {
        this.switchTab('tools');
      });
    }
  }

  private switchTab(tabName: string) {
    // Update active tab button
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      const buttonTab = button.getAttribute('data-tab');
      if (buttonTab === tabName) {
        button.classList.add('bg-blue-500', 'text-white');
        button.classList.remove('text-gray-500', 'hover:text-gray-700');
      } else {
        button.classList.remove('bg-blue-500', 'text-white');
        button.classList.add('text-gray-500', 'hover:text-gray-700');
      }
    });

    // Show/hide tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      const contentId = content.id.replace('-content', '');
      if (contentId === tabName) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });

    this.currentTab = tabName;
  }

  private setupExampleLinks() {
    // We'll create example links using the SDLP SDK
    const validLinkBtn = document.getElementById('example-valid-link');
    const invalidLinkBtn = document.getElementById('example-invalid-link');
    const untrustedLinkBtn = document.getElementById('example-untrusted-link');

    console.log('Setting up example links...');
    console.log('Valid link button:', validLinkBtn);
    console.log('Invalid link button:', invalidLinkBtn);
    console.log('Untrusted link button:', untrustedLinkBtn);

    if (validLinkBtn) {
      console.log('Adding click listener to valid link button');
      validLinkBtn.addEventListener('click', async () => {
        console.log('Valid link button clicked!');
        try {
          // Generate a valid link using our test fixtures
          const validLink = await window.electronAPI.generateSDLPLink(
            'echo "Hello from a valid SDLP link!"'
          );
          await window.electronAPI.processSDLPLinkWithDialog(validLink);
        } catch (error) {
          console.error('Failed to generate valid example link:', error);
        }
      });
    } else {
      console.error('Valid link button not found!');
    }

    if (invalidLinkBtn) {
      console.log('Adding click listener to invalid link button');
      invalidLinkBtn.addEventListener('click', async () => {
        console.log('Invalid link button clicked!');
        // Create an invalid link by corrupting a valid one
        const invalidLink = 'sdlp://invalid-signature-example';
        await window.electronAPI.processSDLPLinkWithDialog(invalidLink);
      });
    } else {
      console.error('Invalid link button not found!');
    }

    if (untrustedLinkBtn) {
      console.log('Adding click listener to untrusted link button');
      untrustedLinkBtn.addEventListener('click', async () => {
        console.log('Untrusted link button clicked!');
        try {
          // Generate a link using the untrusted key
          const untrustedLink =
            await window.electronAPI.generateUntrustedSDLPLink(
              'echo "This is from an untrusted source"'
            );
          await window.electronAPI.processSDLPLinkWithDialog(untrustedLink);
        } catch (error) {
          console.error('Failed to generate untrusted example link:', error);
        }
      });
    } else {
      console.error('Untrusted link button not found!');
    }
  }

  private setupTesterFunctionality() {
    // Link Generator
    const generateBtn = document.getElementById('generate-link-btn');
    const payloadInput = document.getElementById(
      'payload-input'
    ) as HTMLTextAreaElement;
    const generatedLinkSection = document.getElementById(
      'generated-link-section'
    );
    const generatedLinkInput = document.getElementById(
      'generated-link'
    ) as HTMLInputElement;
    const copyBtn = document.getElementById('copy-link-btn');

    if (generateBtn && payloadInput) {
      generateBtn.addEventListener('click', async () => {
        const payload = payloadInput.value.trim();
        if (!payload) {
          this.showNotification('Please enter a payload', 'error');
          return;
        }

        try {
          generateBtn.textContent = 'Generating...';
          generateBtn.setAttribute('disabled', 'true');

          const link = await window.electronAPI.generateSDLPLink(payload);

          if (generatedLinkInput) {
            generatedLinkInput.value = link;
          }

          if (generatedLinkSection) {
            generatedLinkSection.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Failed to generate link:', error);
          // Show error in UI instead of alert
          this.showNotification(
            'Failed to generate link: ' + (error as Error).message,
            'error'
          );
        } finally {
          generateBtn.textContent = 'Generate SDLP Link';
          generateBtn.removeAttribute('disabled');
        }
      });
    }

    // Copy button
    if (copyBtn && generatedLinkInput) {
      copyBtn.addEventListener('click', async () => {
        try {
          await window.navigator.clipboard.writeText(generatedLinkInput.value);
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          window.setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
        }
      });
    }

    // Open generated link button
    const openGeneratedLinkBtn = document.getElementById(
      'open-generated-link-btn'
    );
    if (openGeneratedLinkBtn && generatedLinkInput) {
      openGeneratedLinkBtn.addEventListener('click', async () => {
        const link = generatedLinkInput.value.trim();
        if (link) {
          try {
            await window.electronAPI.processSDLPLinkWithDialog(link);
          } catch (error) {
            console.error('Failed to open generated link:', error);
            this.showNotification(
              'Failed to open link: ' + (error as Error).message,
              'error'
            );
          }
        }
      });
    }

    // Link Verifier
    const verifyBtn = document.getElementById('verify-link-btn');
    const linkInput = document.getElementById(
      'link-input'
    ) as HTMLTextAreaElement;
    const verificationResult = document.getElementById('verification-result');
    const verificationStatus = document.getElementById('verification-status');
    const verificationDetails = document.getElementById('verification-details');

    if (verifyBtn && linkInput) {
      verifyBtn.addEventListener('click', async () => {
        const link = linkInput.value.trim();
        if (!link) {
          this.showNotification('Please enter an SDLP link', 'error');
          return;
        }

        try {
          verifyBtn.textContent = 'Verifying...';
          verifyBtn.setAttribute('disabled', 'true');

          const result = await window.electronAPI.verifySDLPLink(link);

          this.displayVerificationResult(
            result,
            verificationStatus,
            verificationDetails
          );

          if (verificationResult) {
            verificationResult.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Failed to verify link:', error);
          this.displayVerificationResult(
            { valid: false, error: { message: (error as Error).message } },
            verificationStatus,
            verificationDetails
          );

          if (verificationResult) {
            verificationResult.classList.remove('hidden');
          }
        } finally {
          verifyBtn.textContent = 'Verify Link';
          verifyBtn.removeAttribute('disabled');
        }
      });
    }
  }

  private displayVerificationResult(
    result: any,
    statusElement: HTMLElement | null,
    detailsElement: HTMLElement | null
  ) {
    if (!statusElement || !detailsElement) return;

    // Get the actions element
    const verificationActions = document.getElementById('verification-actions');

    if (result.valid) {
      statusElement.innerHTML = `
        <div class="flex items-center">
          <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <span class="font-medium text-green-800">Valid Link</span>
        </div>
      `;

      const payload = result.payload
        ? new TextDecoder().decode(result.payload)
        : 'N/A';
      detailsElement.innerHTML = `
        <div class="space-y-2">
          <div><strong>Sender:</strong> ${result.sender || 'Unknown'}</div>
          <div><strong>Payload:</strong> <code class="bg-gray-100 px-2 py-1 rounded">${payload}</code></div>
        </div>
      `;

      // Show the "Open Link" button for valid links
      if (verificationActions) {
        verificationActions.classList.remove('hidden');

        // Set up the open verified link button if not already set up
        const openVerifiedLinkBtn = document.getElementById(
          'open-verified-link-btn'
        );
        if (openVerifiedLinkBtn) {
          // Remove any existing listeners to avoid duplicates
          const newBtn = openVerifiedLinkBtn.cloneNode(true) as HTMLElement;
          openVerifiedLinkBtn.parentNode?.replaceChild(
            newBtn,
            openVerifiedLinkBtn
          );

          // Add the click listener
          newBtn.addEventListener('click', async () => {
            const linkInput = document.getElementById(
              'link-input'
            ) as HTMLTextAreaElement;
            const link = linkInput?.value.trim();
            if (link) {
              try {
                await window.electronAPI.processSDLPLinkWithDialog(link);
              } catch (error) {
                console.error('Failed to open verified link:', error);
                this.showNotification(
                  'Failed to open link: ' + (error as Error).message,
                  'error'
                );
              }
            }
          });
        }
      }
    } else {
      statusElement.innerHTML = `
        <div class="flex items-center">
          <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <span class="font-medium text-red-800">Invalid Link</span>
        </div>
      `;

      detailsElement.innerHTML = `
        <div class="text-red-600">
          <strong>Error:</strong> ${result.error?.message || 'Unknown error'}
        </div>
      `;

      // Hide the "Open Link" button for invalid links
      if (verificationActions) {
        verificationActions.classList.add('hidden');
      }
    }
  }

  private async processSDLPLinkAsNormal(
    link: string,
    forceUntrusted: boolean = false
  ) {
    // Send the link to the main process to trigger the normal deep link flow
    // This will show the dialog and then process the link normally
    try {
      // Use the new IPC method to trigger the real dialog flow
      await window.electronAPI.processSDLPLinkWithDialog(link, forceUntrusted);
    } catch (error) {
      console.error('Failed to process SDLP link:', error);
      // Fallback to simulation
      this.simulateNormalFlow(link, forceUntrusted);
    }
  }

  private async simulateNormalFlow(
    link: string,
    forceUntrusted: boolean = false
  ) {
    // Switch to home tab to show results
    this.switchTab('home');

    // Simulate the deep link processing that would normally happen in main process
    try {
      const result = await window.electronAPI.verifySDLPLink(link);

      if (result.valid && forceUntrusted) {
        // Show as untrusted for demo purposes
        this.handleSDLPResult({
          status: 'untrusted',
          from: result.sender,
          command: new TextDecoder().decode(result.payload),
          message: 'This link is valid but from an untrusted source',
          switchToHome: true,
        });
      } else if (result.valid) {
        // For the example, simulate the actual command output
        const command = new TextDecoder().decode(result.payload);
        let simulatedOutput = '';

        // Simulate the output based on the command
        if (command.includes('echo')) {
          // Extract the echo message and simulate the output
          const echoMatch = command.match(/echo\s+"([^"]+)"/);
          if (echoMatch && echoMatch[1]) {
            simulatedOutput = echoMatch[1];
          } else {
            // Handle echo without quotes
            const parts = command.split(' ');
            if (parts.length > 1) {
              simulatedOutput = parts.slice(1).join(' ').replace(/['"]/g, '');
            }
          }
        } else {
          simulatedOutput = `Simulated output for: ${command}`;
        }

        this.handleSDLPResult({
          status: 'success',
          from: result.sender,
          command: command,
          output: simulatedOutput,
          switchToHome: true,
        });
      } else {
        this.handleSDLPResult({
          status: 'error',
          message: result.error?.message || 'Invalid link',
          switchToHome: true,
        });
      }
    } catch (error) {
      this.handleSDLPResult({
        status: 'error',
        message: (error as Error).message,
        switchToHome: true,
      });
    }
  }

  private handleSDLPCommand(data: SDLPResult) {
    console.log('Received SDLP command to execute:', data);

    // Switch to home tab to show the command
    this.switchTab('home');
    this.resetToInitialState();

    if (data.status === 'success') {
      this.showSuccessState(data);
      // Set up the execute button for trusted commands
      const executeBtn = document.getElementById('execute-command-btn');
      if (executeBtn && data.command) {
        executeBtn.onclick = async () => {
          try {
            const result = await window.electronAPI.executeSDLPCommand(
              data.command!
            );
            this.showTerminalOutput(result.output, false);
          } catch (error) {
            console.error('Failed to execute command:', error);
            this.showNotification(
              'Failed to execute command: ' + (error as Error).message,
              'error'
            );
          }
        };
      }
    } else if (data.status === 'untrusted') {
      this.showUntrustedState(data);
      // Set up the execute button for untrusted commands
      const executeBtn = document.getElementById(
        'execute-untrusted-command-btn'
      );
      if (executeBtn && data.command) {
        executeBtn.onclick = async () => {
          try {
            const result = await window.electronAPI.executeSDLPCommand(
              data.command!
            );
            this.showTerminalOutput(result.output, true);
          } catch (error) {
            console.error('Failed to execute untrusted command:', error);
            this.showNotification(
              'Failed to execute command: ' + (error as Error).message,
              'error'
            );
          }
        };
      }
    }
  }

  private handleSDLPResult(data: SDLPResult) {
    console.log('Received SDLP result:', data);

    // Switch to home tab if requested (for deep link interception)
    if (data.switchToHome) {
      this.switchTab('home');
    }

    // Reset to clean state first
    this.resetToInitialState();

    if (data.status === 'success') {
      this.showSuccessState(data);
      if (data.output) {
        this.showTerminalOutput(data.output, false);
      }
    } else if (data.status === 'untrusted') {
      this.showUntrustedState(data);
      if (data.output) {
        this.showTerminalOutput(data.output, true);
      }
    } else if (data.status === 'error') {
      this.showErrorState(data.message || 'An unknown error occurred.');
    }
  }

  private resetToInitialState() {
    // Hide all states
    const loadingState = document.getElementById('loading-state');
    const successState = document.getElementById('success-state');
    const errorState = document.getElementById('error-state');
    const untrustedState = document.getElementById('untrusted-state');
    const terminalSection = document.getElementById('terminal-section');

    if (loadingState) loadingState.classList.add('hidden');
    if (successState) successState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (untrustedState) untrustedState.classList.add('hidden');
    if (terminalSection) terminalSection.classList.add('hidden');

    // Clear terminal content
    const terminalElement = document.getElementById('terminal');
    if (terminalElement) {
      terminalElement.innerHTML = '';
    }

    // Clear previous content
    const senderInfo = document.getElementById('sender-info');
    const commandText = document.getElementById('command-text');
    const errorMessage = document.getElementById('error-message');
    const untrustedInfo = document.getElementById('untrusted-info');
    const untrustedCommandText = document.getElementById(
      'untrusted-command-text'
    );

    if (senderInfo) senderInfo.textContent = '';
    if (commandText) commandText.textContent = '';
    if (errorMessage) errorMessage.textContent = '';
    if (untrustedInfo) untrustedInfo.textContent = '';
    if (untrustedCommandText) untrustedCommandText.textContent = '';

    // Hide and clear output sections
    const commandOutputSection = document.getElementById(
      'command-output-section'
    );
    const commandOutput = document.getElementById('command-output');
    const untrustedOutputSection = document.getElementById(
      'untrusted-output-section'
    );
    const untrustedOutput = document.getElementById('untrusted-output');

    if (commandOutputSection) commandOutputSection.classList.add('hidden');
    if (commandOutput) commandOutput.innerHTML = '';
    if (untrustedOutputSection) untrustedOutputSection.classList.add('hidden');
    if (untrustedOutput) untrustedOutput.innerHTML = '';
  }

  private showSuccessState(data: SDLPResult) {
    // Show success state
    const successState = document.getElementById('success-state');
    if (successState) successState.classList.remove('hidden');

    // Update sender info with trust indicator
    const senderInfo = document.getElementById('sender-info');
    if (senderInfo) {
      // Determine if sender is trusted (same logic as main process)
      const senderKey = data.from || '';
      const isTrusted =
        senderKey.includes('test-key-1') ||
        senderKey.includes('trusted') ||
        senderKey.includes('z6MkozXRpKZqLRoLWE6dUTWpSp2Sw2nRrEY');
      const trustStatus = isTrusted ? 'Trusted' : 'Unknown';

      senderInfo.innerHTML = `<strong>${data.from}</strong> (${trustStatus})`;
    }

    // Update command text
    const commandText = document.getElementById('command-text');
    if (commandText) {
      commandText.textContent = data.command || '';
    }
  }

  private showUntrustedState(data: SDLPResult) {
    // Show untrusted state
    const untrustedState = document.getElementById('untrusted-state');
    if (untrustedState) untrustedState.classList.remove('hidden');

    // Update untrusted info (sender information)
    const untrustedInfo = document.getElementById('untrusted-info');
    if (untrustedInfo) {
      untrustedInfo.innerHTML = `<strong>${data.from}</strong> (Untrusted Source)`;
    }

    // Update command text
    const untrustedCommandText = document.getElementById(
      'untrusted-command-text'
    );
    if (untrustedCommandText) {
      untrustedCommandText.textContent = data.command || '';
    }
  }

  private showErrorState(message: string) {
    // Show error state
    const errorState = document.getElementById('error-state');
    if (errorState) errorState.classList.remove('hidden');

    // Update error message
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  private showTerminalOutput(output: string, isUntrusted: boolean = false) {
    const cleanOutput = output.trim();
    const htmlOutput = cleanOutput
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    if (isUntrusted) {
      // Show output in the untrusted command & output section
      const untrustedOutputSection = document.getElementById(
        'untrusted-output-section'
      );
      const untrustedOutput = document.getElementById('untrusted-output');

      if (untrustedOutputSection)
        untrustedOutputSection.classList.remove('hidden');
      if (untrustedOutput) {
        untrustedOutput.innerHTML = htmlOutput;
      }
    } else {
      // Show output in the success command & output section
      const commandOutputSection = document.getElementById(
        'command-output-section'
      );
      const commandOutput = document.getElementById('command-output');

      if (commandOutputSection) commandOutputSection.classList.remove('hidden');
      if (commandOutput) {
        commandOutput.innerHTML = htmlOutput;
      }
    }

    // Keep the old terminal section for backward compatibility, but hide it
    const terminalSection = document.getElementById('terminal-section');
    if (terminalSection) terminalSection.classList.add('hidden');
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) {
    // Create a simple notification system using console for now
    // In a real implementation, you might want to show a toast or modal
    console.log(`[${type.toUpperCase()}] ${message}`);

    // For now, we'll just log to console, but you could implement a proper notification UI here
    // This is a simple fallback to avoid using alert()
  }

  private async populateExamples() {
    try {
      // Generate example links and populate the Examples tab
      const validPayload = 'echo "Hello from a valid SDLP link!"';
      const untrustedPayload = 'echo "This is from an untrusted source"';

      // Generate the valid link using trusted key
      const validLink = await window.electronAPI.generateSDLPLink(validPayload);
      // Generate the untrusted link using untrusted key
      const untrustedLink =
        await window.electronAPI.generateUntrustedSDLPLink(untrustedPayload);

      // Populate valid example
      const validPayloadElement = document.getElementById('valid-payload');
      const validLinkElement = document.getElementById('valid-link');
      const validKeyElement = document.getElementById('valid-key');

      if (validPayloadElement) {
        validPayloadElement.textContent = validPayload;
      }

      if (validLinkElement) {
        validLinkElement.textContent = validLink;
      }

      if (validKeyElement) {
        // Show a simplified version of the public key info
        validKeyElement.textContent = `{
  "kty": "OKP",
  "crv": "Ed25519",
  "use": "sig",
  "kid": "test-key-1",
  "x": "...",
  "alg": "EdDSA"
}`;
      }

      // Populate untrusted example
      const untrustedPayloadElement =
        document.getElementById('untrusted-payload');
      const untrustedLinkElement = document.getElementById('untrusted-link');
      const untrustedKeyElement = document.getElementById('untrusted-key');

      if (untrustedPayloadElement) {
        untrustedPayloadElement.textContent = untrustedPayload;
      }

      if (untrustedKeyElement) {
        // Show the same key structure for untrusted example
        untrustedKeyElement.textContent = `{
  "kty": "OKP",
  "crv": "Ed25519",
  "use": "sig",
  "kid": "test-key-1",
  "x": "...",
  "alg": "EdDSA"
}`;
      }

      if (untrustedLinkElement) {
        untrustedLinkElement.textContent = untrustedLink;
      }
    } catch (error) {
      console.error('Failed to populate examples:', error);
    }
  }
}

// Initialize the renderer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing SDLP renderer...');

  // Check if electronAPI is available
  if (typeof window.electronAPI === 'undefined') {
    console.error(
      'electronAPI is not available! Preload script may not be working.'
    );
    // Create a fallback for development
    window.electronAPI = {
      onSDLPResult: () => {},
      onSDLPCommandToExecute: () => {},
      removeAllListeners: () => {},
      generateSDLPLink: async () => 'sdlp://fallback-link',
      generateUntrustedSDLPLink: async () => 'sdlp://fallback-untrusted-link',
      verifySDLPLink: async () => ({
        valid: false,
        error: { message: 'electronAPI not available' },
      }),
      processSDLPLinkWithDialog: async () => {},
      executeSDLPCommand: async () => ({
        output: 'electronAPI not available',
        exitCode: 1,
      }),
    };
  } else {
    console.log('electronAPI is available');
  }

  try {
    new SDLPRenderer();
    console.log('SDLP renderer initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SDLP renderer:', error);
  }
});

// Add some global error handling
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});
