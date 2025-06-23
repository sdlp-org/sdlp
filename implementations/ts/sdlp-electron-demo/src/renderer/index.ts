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
    this.setupTrustedKeysManagement();
    this.populateExamples();
    this.loadTrustedKeys();
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
    const malformedLinkBtn = document.getElementById('example-malformed-link');
    const expiredLinkBtn = document.getElementById('example-expired-link');
    const wrongKeyLinkBtn = document.getElementById('example-wrong-key-link');

    console.log('Setting up example links...');
    console.log('Valid link button:', validLinkBtn);
    console.log('Invalid link button:', invalidLinkBtn);

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

    // Payload Tampering Example
    if (invalidLinkBtn) {
      console.log('Adding click listener to invalid link button');
      invalidLinkBtn.addEventListener('click', async () => {
        console.log('Invalid link button clicked!');
        try {
          // Generate a valid link first, then corrupt it
          const validLink = await window.electronAPI.generateSDLPLink('echo "Original payload"');
          // Corrupt the link by changing some characters in the middle - this will cause real signature verification failure
          const corruptedLink = validLink.replace(/(.{50})(.{10})/, '$1CORRUPTED');
          await window.electronAPI.processSDLPLinkWithDialog(corruptedLink);
        } catch (error) {
          console.error('Failed to generate corrupted example:', error);
        }
      });
    } else {
      console.error('Invalid link button not found!');
    }

    // Malformed Link Example
    if (malformedLinkBtn) {
      console.log('Adding click listener to malformed link button');
      malformedLinkBtn.addEventListener('click', async () => {
        console.log('Malformed link button clicked!');
        // Create a malformed SDLP link that looks realistic but has invalid JWT structure
        // This will cause the SDLP SDK to naturally fail when trying to parse it
        const malformedLink = 'sdlp://eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.INVALID_STRUCTURE.signature';
        await window.electronAPI.processSDLPLinkWithDialog(malformedLink);
      });
    }

    // Key Mismatch Example - Create a real key mismatch by using a different signing key
    if (wrongKeyLinkBtn) {
      console.log('Adding click listener to wrong key link button');
      wrongKeyLinkBtn.addEventListener('click', async () => {
        console.log('Wrong key link button clicked!');
        try {
          // Generate a link signed with the untrusted key - this creates a real key mismatch
          // The link will be valid but signed with a different key than expected
          const keyMismatchLink = await window.electronAPI.generateUntrustedSDLPLink('echo "Key mismatch demo"');
          
          await window.electronAPI.processSDLPLinkWithDialog(keyMismatchLink);
        } catch (error) {
          console.error('Failed to generate key mismatch example:', error);
        }
      });
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

  private setupTrustedKeysManagement() {
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-trusted-keys-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadTrustedKeys();
      });
    }

    // Setup clear all button
    const clearAllBtn = document.getElementById('clear-all-trusted-keys-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async () => {
        if (window.confirm('Are you sure you want to clear all trusted keys?')) {
          try {
            await window.electronAPI.trustStore.clear();
            this.loadTrustedKeys();
            this.showNotification('All trusted keys cleared', 'success');
          } catch (error) {
            console.error('Failed to clear trusted keys:', error);
            this.showNotification('Failed to clear trusted keys', 'error');
          }
        }
      });
    }
  }

  private async loadTrustedKeys() {
    const loadingElement = document.getElementById('trusted-keys-loading');
    const emptyElement = document.getElementById('trusted-keys-empty');
    const listElement = document.getElementById('trusted-keys-list');
    const actionsElement = document.getElementById('trusted-keys-actions');

    // Show loading state
    if (loadingElement) loadingElement.classList.remove('hidden');
    if (emptyElement) emptyElement.classList.add('hidden');
    if (listElement) listElement.classList.add('hidden');
    if (actionsElement) actionsElement.classList.add('hidden');

    try {
      const trustedKeys = await window.electronAPI.trustStore.getAll();
      const keyCount = Object.keys(trustedKeys).length;

      // Hide loading state
      if (loadingElement) loadingElement.classList.add('hidden');

      if (keyCount === 0) {
        // Show empty state
        if (emptyElement) emptyElement.classList.remove('hidden');
      } else {
        // Show keys list and actions
        if (listElement) {
          listElement.classList.remove('hidden');
          this.renderTrustedKeysList(trustedKeys, listElement);
        }
        if (actionsElement) actionsElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Failed to load trusted keys:', error);
      // Hide loading state and show error
      if (loadingElement) loadingElement.classList.add('hidden');
      if (emptyElement) {
        emptyElement.classList.remove('hidden');
        emptyElement.innerHTML = `
          <div class="text-red-500 mb-2">Failed to load trusted keys</div>
          <p class="text-sm text-red-400">
            ${error instanceof Error ? error.message : 'Unknown error'}
          </p>
        `;
      }
    }
  }

  private renderTrustedKeysList(trustedKeys: Record<string, { addedAt: string; label?: string }>, container: HTMLElement) {
    container.innerHTML = '';

    Object.entries(trustedKeys).forEach(([did, info]) => {
      const keyElement = document.createElement('div');
      keyElement.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
      
      const addedDate = new Date(info.addedAt).toLocaleDateString();
      const shortDid = did.length > 50 ? `${did.substring(0, 30)}...${did.substring(did.length - 20)}` : did;
      
      keyElement.innerHTML = `
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center mb-2">
              <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <h4 class="font-medium text-gray-800 truncate">
                ${info.label || 'Trusted Sender'}
              </h4>
            </div>
            <div class="text-sm text-gray-600 mb-1">
              <strong>DID:</strong> <code class="bg-white px-1 rounded text-xs">${shortDid}</code>
            </div>
            <div class="text-xs text-gray-500">
              Added: ${addedDate}
            </div>
          </div>
          <button 
            class="remove-trusted-key-btn ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            data-did="${did}"
          >
            Remove
          </button>
        </div>
      `;

      // Add remove button listener
      const removeBtn = keyElement.querySelector('.remove-trusted-key-btn') as HTMLButtonElement;
      if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
          const didToRemove = removeBtn.getAttribute('data-did');
          if (didToRemove && window.confirm(`Remove trust for this sender?\n\n${shortDid}`)) {
            try {
              await window.electronAPI.trustStore.removeTrusted(didToRemove);
              this.loadTrustedKeys();
              this.showNotification('Trusted key removed', 'success');
            } catch (error) {
              console.error('Failed to remove trusted key:', error);
              this.showNotification('Failed to remove trusted key', 'error');
            }
          }
        });
      }

      container.appendChild(keyElement);
    });
  }

  private async populateExamples() {
    try {
      // Generate example links and populate the Examples tab
      const validPayload = 'echo "Hello from a valid SDLP link!"';

      // Generate the valid link using trusted key
      const validLink = await window.electronAPI.generateSDLPLink(validPayload);

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

      // Generate realistic links for all failure mode displays
      const corruptedPayload = 'echo "Original payload"';
      const originalLink = await window.electronAPI.generateSDLPLink(corruptedPayload);
      const corruptedLink = originalLink.replace(/(.{50})(.{10})/, '$1CORRUPTED');
      
      // Populate corrupted link display
      const corruptedLinkDisplay = document.getElementById('corrupted-link-display');
      if (corruptedLinkDisplay) {
        corruptedLinkDisplay.textContent = corruptedLink;
      }

      // Generate malformed link display
      const malformedLinkDisplay = document.getElementById('malformed-link-display');
      if (malformedLinkDisplay) {
        malformedLinkDisplay.textContent = 'sdlp://eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.INVALID_STRUCTURE.signature';
      }


      // Generate key mismatch link display - use untrusted key to create real key mismatch
      const keyMismatchLink = await window.electronAPI.generateUntrustedSDLPLink('echo "Key mismatch demo"');
      const keyMismatchLinkDisplay = document.getElementById('key-mismatch-link-display');
      if (keyMismatchLinkDisplay) {
        keyMismatchLinkDisplay.textContent = keyMismatchLink;
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
      trustStore: {
        isTrusted: async () => false,
        addTrusted: async () => false,
        removeTrusted: async () => false,
        getAll: async () => ({}),
        clear: async () => false,
      },
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
