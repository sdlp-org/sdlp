# SDLP Academic Paper

This directory contains the academic paper "SDLP: A Lightweight Protocol for Authenticated Deep Links with Decentralized Identity" prepared for arXiv submission.

## Files

- `sdlp-paper.tex` - Main LaTeX source file
- `references.bib` - BibTeX bibliography  
- `figures/` - Publication-quality figures (SVG format)
- `Makefile` - Build automation
- `README.md` - This file

## Building the Paper

### Requirements

- LaTeX distribution (e.g., TeX Live, MiKTeX)
- BibTeX for bibliography processing
- Just (optional, for automation)

### Build Commands

```bash
# Build PDF with bibliography
just pdf

# Create arXiv submission package
just arxiv

# Clean build artifacts
just clean

# Validate paper (check compilation, word count)
just validate

# Full check (clean, build, validate)
just check
```

### Manual Build

If `just` is not available:

```bash
pdflatex sdlp-paper
bibtex sdlp-paper
pdflatex sdlp-paper
pdflatex sdlp-paper
```

## Paper Structure

- **Abstract** (150 words) - Problem, solution, key results
- **Introduction** - Motivation, attack scenarios, contributions
- **Related Work** - Deep link security, JWS/JWT, DIDs
- **Protocol Design** - Requirements, architecture, security model
- **Implementation** - TypeScript SDK, performance analysis
- **Performance Evaluation** - Benchmarks from `/benchmarks` directory
- **Security Analysis** - Threat model, cryptographic security
- **Applications** - Use cases and real-world scenarios
- **Conclusion** - Summary and future work

## Performance Data

The paper includes benchmark results from the production benchmark suite:

- **Link Creation**: 0.09-0.11ms average (9,000-11,600 ops/sec)
- **Link Verification**: 0.32-0.38ms average (2,600-3,100 ops/sec)  
- **Compression**: 35.9% URL size reduction for 1KB payloads
- **Payload Efficiency**: 72% within URL length constraints

## Figures

1. **protocol-flow.svg** - End-to-end protocol workflow
2. **link-structure.svg** - SDLP link format breakdown  
3. **performance-chart.svg** - Benchmark performance comparison
4. **compression-analysis.svg** - Brotli compression effectiveness

## arXiv Submission

The paper is formatted for arXiv submission:

- IEEE conference paper format
- 8 pages including references
- Proper LaTeX structure for arXiv processing
- All figures in publication quality (vector format)
- Complete bibliography with DOIs where available

### Submission Checklist

- [ ] Paper compiles without errors or warnings
- [ ] PDF file size < 10MB (arXiv limit)
- [ ] All figures display correctly
- [ ] Bibliography complete and properly formatted
- [ ] Author information and affiliation correct
- [ ] Abstract within 150-200 word limit

### Categories for arXiv

**Primary**: cs.CR (Cryptography and Security)  
**Secondary**: cs.NI (Networking and Internet Architecture)

## Contact

For questions about the paper:
- Author: Prem Pillai (prem@block.xyz)
- Repository: https://github.com/sdlp-org/sdlp