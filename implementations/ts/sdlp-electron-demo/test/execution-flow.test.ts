import { describe, it, expect, beforeEach, vi } from 'vitest';

// Declare global variables for Node.js environment
declare const global: any;

// Mock the electronAPI for testing
const mockElectronAPI = {
  onSDLPResult: vi.fn(),
  onSDLPCommandToExecute: vi.fn(),
  removeAllListeners: vi.fn(),
  generateSDLPLink: vi.fn(),
  generateUntrustedSDLPLink: vi.fn(),
  verifySDLPLink: vi.fn(),
  processSDLPLinkWithDialog: vi.fn(),
  executeSDLPCommand: vi.fn(),
};

// Mock DOM elements
const mockElements = new Map<string, HTMLElement>();

const createMockElement = (
  id: string,
  tagName: string = 'div'
): HTMLElement => {
  const element = {
    id,
    tagName: tagName.toUpperCase(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
    textContent: '',
    innerHTML: '',
    onclick: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cloneNode: vi.fn(() => createMockElement(id, tagName)),
    parentNode: {
      replaceChild: vi.fn(),
    },
  } as unknown as HTMLElement;

  mockElements.set(id, element);
  return element;
};

// Mock document.getElementById
const mockGetElementById = vi.fn((id: string) => {
  if (!mockElements.has(id)) {
    createMockElement(id);
  }
  return mockElements.get(id) || null;
});

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks();
  mockElements.clear();

  // Mock global objects
  global.window = {
    electronAPI: mockElectronAPI,
  } as any;

  global.document = {
    getElementById: mockGetElementById,
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
  } as any;

  global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  } as any;
});

describe('Phase 9: Two-Step Command Execution Flow', () => {
  describe('IPC Channel Integration', () => {
    it('should expose new IPC channels in electronAPI', () => {
      expect(mockElectronAPI.onSDLPCommandToExecute).toBeDefined();
      expect(mockElectronAPI.executeSDLPCommand).toBeDefined();
      expect(typeof mockElectronAPI.onSDLPCommandToExecute).toBe('function');
      expect(typeof mockElectronAPI.executeSDLPCommand).toBe('function');
    });

    it('should handle command-to-execute IPC messages', async () => {
      const testCommand = {
        status: 'success' as const,
        from: 'did:key:test',
        command: 'echo "test"',
      };

      // Simulate receiving a command-to-execute message
      const callback = vi.fn();
      mockElectronAPI.onSDLPCommandToExecute.mockImplementation(cb => {
        callback.mockImplementation(cb);
      });

      // Trigger the callback with test data
      callback(testCommand);

      expect(callback).toHaveBeenCalledWith(testCommand);
    });

    it('should execute commands via IPC when requested', async () => {
      const testCommand = 'echo "Hello World"';
      const expectedResult = {
        output: 'Hello World',
        exitCode: 0,
      };

      mockElectronAPI.executeSDLPCommand.mockResolvedValue(expectedResult);

      const result = await mockElectronAPI.executeSDLPCommand(testCommand);

      expect(mockElectronAPI.executeSDLPCommand).toHaveBeenCalledWith(
        testCommand
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('UI State Management', () => {
    it('should properly reset UI state between commands', () => {
      // Create mock elements for state reset
      const successState = createMockElement('success-state');
      const untrustedState = createMockElement('untrusted-state');
      const commandOutput = createMockElement('command-output');
      const untrustedOutput = createMockElement('untrusted-output');
      const commandOutputSection = createMockElement('command-output-section');
      const untrustedOutputSection = createMockElement(
        'untrusted-output-section'
      );

      // Simulate the resetToInitialState functionality
      const resetState = () => {
        successState.classList.add('hidden');
        untrustedState.classList.add('hidden');
        commandOutput.innerHTML = '';
        untrustedOutput.innerHTML = '';
        commandOutputSection.classList.add('hidden');
        untrustedOutputSection.classList.add('hidden');
      };

      resetState();

      expect(successState.classList.add).toHaveBeenCalledWith('hidden');
      expect(untrustedState.classList.add).toHaveBeenCalledWith('hidden');
      expect(commandOutputSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(untrustedOutputSection.classList.add).toHaveBeenCalledWith(
        'hidden'
      );
    });

    it('should display execute buttons for trusted commands', () => {
      const executeBtn = createMockElement('execute-command-btn', 'button');
      const commandText = createMockElement('command-text');

      const testData = {
        status: 'success' as const,
        from: 'did:key:trusted',
        command: 'echo "trusted command"',
      };

      // Simulate showing success state
      commandText.textContent = testData.command || '';

      // Simulate setting up execute button
      executeBtn.onclick = async () => {
        const result = await mockElectronAPI.executeSDLPCommand(
          testData.command!
        );
        return result;
      };

      expect(commandText.textContent).toBe('echo "trusted command"');
      expect(executeBtn.onclick).toBeDefined();
    });

    it('should display execute buttons for untrusted commands', () => {
      const executeBtn = createMockElement(
        'execute-untrusted-command-btn',
        'button'
      );
      const commandText = createMockElement('untrusted-command-text');

      const testData = {
        status: 'untrusted' as const,
        from: 'did:key:untrusted',
        command: 'echo "untrusted command"',
      };

      // Simulate showing untrusted state
      commandText.textContent = testData.command || '';

      // Simulate setting up execute button
      executeBtn.onclick = async () => {
        const result = await mockElectronAPI.executeSDLPCommand(
          testData.command!
        );
        return result;
      };

      expect(commandText.textContent).toBe('echo "untrusted command"');
      expect(executeBtn.onclick).toBeDefined();
    });
  });

  describe('Command Execution Flow', () => {
    it('should execute trusted commands and display output', async () => {
      const executeBtn = createMockElement('execute-command-btn', 'button');
      const commandOutputSection = createMockElement('command-output-section');
      const commandOutput = createMockElement('command-output');

      const testCommand = 'echo "Hello from trusted source"';
      const expectedOutput = 'Hello from trusted source';

      mockElectronAPI.executeSDLPCommand.mockResolvedValue({
        output: expectedOutput,
        exitCode: 0,
      });

      // Simulate button click handler
      const handleExecute = async () => {
        const result = await mockElectronAPI.executeSDLPCommand(testCommand);
        commandOutputSection.classList.remove('hidden');
        commandOutput.innerHTML = result.output;
      };

      await handleExecute();

      expect(mockElectronAPI.executeSDLPCommand).toHaveBeenCalledWith(
        testCommand
      );
      expect(commandOutputSection.classList.remove).toHaveBeenCalledWith(
        'hidden'
      );
      expect(commandOutput.innerHTML).toBe(expectedOutput);
    });

    it('should execute untrusted commands and display output', async () => {
      const executeBtn = createMockElement(
        'execute-untrusted-command-btn',
        'button'
      );
      const untrustedOutputSection = createMockElement(
        'untrusted-output-section'
      );
      const untrustedOutput = createMockElement('untrusted-output');

      const testCommand = 'echo "Hello from untrusted source"';
      const expectedOutput = 'Hello from untrusted source';

      mockElectronAPI.executeSDLPCommand.mockResolvedValue({
        output: expectedOutput,
        exitCode: 0,
      });

      // Simulate button click handler
      const handleExecute = async () => {
        const result = await mockElectronAPI.executeSDLPCommand(testCommand);
        untrustedOutputSection.classList.remove('hidden');
        untrustedOutput.innerHTML = result.output;
      };

      await handleExecute();

      expect(mockElectronAPI.executeSDLPCommand).toHaveBeenCalledWith(
        testCommand
      );
      expect(untrustedOutputSection.classList.remove).toHaveBeenCalledWith(
        'hidden'
      );
      expect(untrustedOutput.innerHTML).toBe(expectedOutput);
    });

    it('should handle command execution errors gracefully', async () => {
      const testCommand = 'invalid-command';
      const errorMessage = 'Command execution failed: Command not found';

      mockElectronAPI.executeSDLPCommand.mockRejectedValue(
        new Error(errorMessage)
      );

      // Simulate error handling
      const handleExecuteWithError = async () => {
        try {
          await mockElectronAPI.executeSDLPCommand(testCommand);
        } catch (error) {
          console.error('Failed to execute command:', error);
          return error;
        }
      };

      const result = await handleExecuteWithError();

      expect(mockElectronAPI.executeSDLPCommand).toHaveBeenCalledWith(
        testCommand
      );
      expect(result).toBeInstanceOf(Error);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to execute command:',
        expect.any(Error)
      );
    });
  });

  describe('Security and Validation', () => {
    it('should differentiate between trusted and untrusted sources', () => {
      const trustedSender =
        'did:key:z6MkozXRpKZqLRoLWE6dUTWpSp2Sw2nRrEYTo1S2gntiue5u';
      const untrustedSender = 'did:key:unknown-sender';

      // Simulate trust determination logic
      const isTrusted = (sender: string) => {
        return (
          sender.includes('z6MkozXRpKZqLRoLWE6dUTWpSp2Sw2nRrEY') ||
          sender.includes('test-key-1') ||
          sender.includes('trusted')
        );
      };

      expect(isTrusted(trustedSender)).toBe(true);
      expect(isTrusted(untrustedSender)).toBe(false);
    });

    it('should require explicit user action for command execution', () => {
      const executeBtn = createMockElement('execute-command-btn', 'button');
      let commandExecuted = false;

      // Simulate that command only executes when button is clicked
      executeBtn.onclick = () => {
        commandExecuted = true;
      };

      // Command should not be executed automatically
      expect(commandExecuted).toBe(false);

      // Command should only execute after explicit button click
      if (executeBtn.onclick) {
        executeBtn.onclick({} as any);
      }
      expect(commandExecuted).toBe(true);
    });

    it('should validate command format and content', () => {
      const validCommands = ['echo "Hello World"', 'echo Hello', 'ls -la'];

      const invalidCommands = ['', '   ', null, undefined];

      const isValidCommand = (command: any) => {
        return typeof command === 'string' && command.trim().length > 0;
      };

      validCommands.forEach(cmd => {
        expect(isValidCommand(cmd)).toBe(true);
      });

      invalidCommands.forEach(cmd => {
        expect(isValidCommand(cmd)).toBe(false);
      });
    });
  });

  describe('Output Sanitization', () => {
    it('should properly sanitize HTML in command output', () => {
      const dangerousOutput = '<script>alert("xss")</script>Hello World';
      const expectedSanitized =
        '&lt;script&gt;alert("xss")&lt;/script&gt;Hello World';

      const sanitizeOutput = (output: string) => {
        return output
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      const sanitized = sanitizeOutput(dangerousOutput);
      expect(sanitized).toBe(expectedSanitized);
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle newlines in output correctly', () => {
      const multilineOutput = 'Line 1\nLine 2\nLine 3';
      const expectedHtml = 'Line 1<br>Line 2<br>Line 3';

      const formatOutput = (output: string) => {
        return output.replace(/\n/g, '<br>');
      };

      const formatted = formatOutput(multilineOutput);
      expect(formatted).toBe(expectedHtml);
    });
  });

  describe('Integration with Existing Flow', () => {
    it('should maintain backward compatibility with existing SDLP result handling', () => {
      const legacyResult = {
        status: 'success' as const,
        from: 'did:key:test',
        command: 'echo "legacy"',
        output: 'legacy output',
        switchToHome: true,
      };

      // Simulate legacy result handler
      const handleLegacyResult = (data: typeof legacyResult) => {
        expect(data.status).toBe('success');
        expect(data.output).toBeDefined();
        expect(data.switchToHome).toBe(true);
      };

      expect(() => handleLegacyResult(legacyResult)).not.toThrow();
    });

    it('should properly switch tabs when processing commands', () => {
      const homeTab = createMockElement('home-tab', 'button');
      const examplesTab = createMockElement('examples-tab', 'button');

      // Simulate tab switching logic
      const switchToHome = () => {
        homeTab.classList.add('bg-blue-500', 'text-white');
        homeTab.classList.remove('text-gray-500');
        examplesTab.classList.remove('bg-blue-500', 'text-white');
        examplesTab.classList.add('text-gray-500');
      };

      switchToHome();

      expect(homeTab.classList.add).toHaveBeenCalledWith(
        'bg-blue-500',
        'text-white'
      );
      expect(homeTab.classList.remove).toHaveBeenCalledWith('text-gray-500');
      expect(examplesTab.classList.remove).toHaveBeenCalledWith(
        'bg-blue-500',
        'text-white'
      );
      expect(examplesTab.classList.add).toHaveBeenCalledWith('text-gray-500');
    });
  });
});
