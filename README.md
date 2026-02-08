# Code Editor Tool

A local-first, secure web application for editing and replacing functions in existing source code projects.

## Features

- **100% Browser-Based**: No backend, no databases, no external API calls
- **Secure & Private**: All processing happens locally in your browser
- **Project Loading**: Upload individual files, folders, or ZIP archives
- **Function Analysis**: Automatically detects functions in JavaScript/TypeScript code
- **Smart Indexing**: Browse all functions across your project with search capabilities
- **Safe Editing**: Replace or insert code into specific functions with visual diff comparison
- **Export Options**: Download modified files or entire projects as ZIP

## Supported Function Patterns

- `function name() {}`
- `export function name() {}`
- `const name = () => {}`
- `async function name() {}`
- And more via configurable regex patterns

## Technology Stack

- Vanilla JavaScript (ES6+)
- File System Access API
- JSZip for archive handling
- Vite for development/build tooling
- CSS3 with custom properties for theming

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
