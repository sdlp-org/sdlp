import { Terminal } from '@xterm/xterm'
import { getHighlighter } from 'shiki'

// Extend the Window interface to include our electronAPI
declare global {
  interface Window {
    electronAPI: {
      onSDLPResult: (callback: (data: any) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

class SDLPRenderer {
  private terminal: Terminal | null = null
  private highlighter: any = null

  constructor() {
    this.initializeHighlighter()
    this.setupEventListeners()
  }

  private async initializeHighlighter() {
    try {
      this.highlighter = await getHighlighter({
        themes: ['dark-plus'],
        langs: ['bash', 'shell']
      })
    } catch (error) {
      console.warn('Failed to initialize syntax highlighter:', error)
    }
  }

  private setupEventListeners() {
    // Listen for SDLP results from the main process
    window.electronAPI.onSDLPResult((data) => {
      this.handleSDLPResult(data)
    })
  }

  private handleSDLPResult(data: any) {
    console.log('Received SDLP result:', data)

    // Reset to clean state first
    this.resetToInitialState()

    if (data.status === 'success') {
      this.showSuccessState(data)
      this.showTerminalOutput(data.output)
    } else if (data.status === 'error') {
      this.showErrorState(data.message)
    }
  }

  private resetToInitialState() {
    // Hide all states
    const loadingState = document.getElementById('loading-state')
    const successState = document.getElementById('success-state')
    const errorState = document.getElementById('error-state')
    const terminalSection = document.getElementById('terminal-section')

    if (loadingState) loadingState.classList.remove('hidden')
    if (successState) successState.classList.add('hidden')
    if (errorState) errorState.classList.add('hidden')
    if (terminalSection) terminalSection.classList.add('hidden')

    // Clear terminal content
    const terminalElement = document.getElementById('terminal')
    if (terminalElement) {
      terminalElement.innerHTML = ''
    }

    // Clear previous content
    const senderInfo = document.getElementById('sender-info')
    const commandText = document.getElementById('command-text')
    const errorMessage = document.getElementById('error-message')

    if (senderInfo) senderInfo.textContent = ''
    if (commandText) commandText.textContent = ''
    if (errorMessage) errorMessage.textContent = ''
  }

  private showSuccessState(data: any) {
    // Hide loading state
    const loadingState = document.getElementById('loading-state')
    if (loadingState) loadingState.classList.add('hidden')

    // Show success state
    const successState = document.getElementById('success-state')
    if (successState) successState.classList.remove('hidden')

    // Update sender info
    const senderInfo = document.getElementById('sender-info')
    if (senderInfo) {
      senderInfo.textContent = `Verified from: ${data.from}`
    }

    // Update command text
    const commandText = document.getElementById('command-text')
    if (commandText) {
      commandText.textContent = data.command
    }
  }

  private showErrorState(message: string) {
    // Hide loading state
    const loadingState = document.getElementById('loading-state')
    if (loadingState) loadingState.classList.add('hidden')

    // Show error state
    const errorState = document.getElementById('error-state')
    if (errorState) errorState.classList.remove('hidden')

    // Update error message
    const errorMessage = document.getElementById('error-message')
    if (errorMessage) {
      errorMessage.textContent = message
    }
  }

  private showTerminalOutput(output: string) {
    // Show terminal section
    const terminalSection = document.getElementById('terminal-section')
    if (terminalSection) terminalSection.classList.remove('hidden')

    // Get the terminal element and display output directly as HTML
    const terminalElement = document.getElementById('terminal')
    if (terminalElement) {
      // Clean up the output and convert to HTML
      const cleanOutput = output.trim()
      const htmlOutput = cleanOutput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
      
      terminalElement.innerHTML = `<div class="terminal-content">${htmlOutput}</div>`
    }
  }
}

// Initialize the renderer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SDLPRenderer()
})
