# SDLP Web Playground

Interactive web demonstration of the Secure Deep Link Protocol (SDLP).

## Overview

The SDLP Playground is a browser-based tool that demonstrates SDLP functionality through an intuitive interface. It allows users to:

- **Create signed links** with custom payloads and settings
- **Verify existing links** to check authenticity and view payloads  
- **Explore real-world examples** across different use cases
- **View performance benchmarks** from production testing

## Features

### 🔐 Link Creation
- Interactive form for payload input (JSON, YAML, XML, plain text)
- Configurable compression options (Brotli, Gzip, None)
- Expiration time settings
- Real-time link generation with size statistics

### 🔍 Link Verification  
- Paste and verify any SDLP link
- Display sender identity and signature status
- Show decompressed payload with syntax highlighting
- Error handling for malformed links

### 📊 Performance Insights
- Live benchmark data from production tests
- Performance metrics across different payload sizes
- Comparison with traditional approaches

### 💡 Example Gallery
- AI prompt sharing scenarios
- Configuration distribution use cases  
- Cross-application authentication flows

## Demo Mode

**Important**: This playground operates in demo mode with mock cryptographic operations. It demonstrates the SDLP workflow and data structures but uses simulated signing and verification for security and simplicity.

### What's Mocked:
- Private key generation and storage
- Ed25519 signature creation and verification
- DID document resolution
- Actual compression algorithms

### What's Real:
- SDLP link structure and format
- Payload encoding and Base64URL handling  
- Link parsing and validation logic
- Performance characteristics simulation

## Usage

### Local Development

```bash
# Install dependencies and start the server
npm install
npm start

# Or run directly without installation
npx http-server . -p 8080 -o

# Opens automatically at http://localhost:8080
```

### Production Deployment

The playground is a static HTML/CSS/JS application that can be deployed to any web server or CDN:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`  
- **GitHub Pages**: Commit to `gh-pages` branch
- **AWS S3**: Upload to S3 bucket with static hosting

## Security Considerations

### Browser Limitations
- **No Private Keys**: Real private keys should never be handled in browser environments
- **Mock Verification**: Actual signature verification requires secure key management
- **Educational Purpose**: Designed for demonstration and learning, not production use

### Production Integration  
For real applications:
- Use server-side SDLP SDK for signing operations
- Implement proper DID resolution infrastructure  
- Store private keys in hardware security modules (HSM)
- Use HTTPS for all communications

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used**: ES6 modules, async/await, CSS Grid, Flexbox
- **Fallbacks**: Graceful degradation for older browsers

## Customization

### Styling
The playground uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
```

### Examples
Add new examples by updating the `examples` object in the JavaScript:

```javascript
const examples = {
  newExample: `sdlp://your_example_link_here`,
  // ...existing examples
};
```

### Performance Data
Update benchmark statistics in the HTML to reflect current performance:

```html
<div class="stat-card">
  <div class="stat-value">0.09-0.11ms</div>
  <div class="stat-label">Link Creation</div>
</div>
```

## Integration with Main Project

The playground complements the main SDLP implementation:

- **SDK Integration**: Can be extended to use the actual SDLP SDK via WebAssembly
- **Demo Data**: Uses realistic examples from the test vectors
- **Performance Sync**: Statistics updated from benchmark results
- **Documentation**: Links to full specification and implementation guides

## Contributing

Improvements welcome:

1. Enhanced UX/UI design
2. Real-time collaboration features  
3. Advanced payload editors (JSON/YAML syntax highlighting)
4. WebAssembly integration for real cryptographic operations
5. Accessibility improvements
6. Mobile responsiveness enhancements

## Links

- **Main Repository**: [../](../)
- **SDLP Specification**: [../specs/sdlp-v0.1-draft.md](../specs/sdlp-v0.1-draft.md)
- **Academic Paper**: [../paper/sdlp-paper.pdf](../paper/sdlp-paper.pdf)
- **SDK Documentation**: [../implementations/ts/sdlp-sdk/](../implementations/ts/sdlp-sdk/)

---

*This playground provides a safe, educational environment to explore SDLP concepts without the complexity of full cryptographic implementation.*