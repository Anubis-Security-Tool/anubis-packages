# electerm-icons

A lightweight TypeScript library providing essential file type icons, similar to vscode-icons but with a curated set of the most commonly used icons.

## Features

- 🎯 **Essential Icons Only**: Curated set of 48 most commonly used file type icons
- 📦 **Lightweight**: Reduced from 1400+ to 48 icons (96.6% size reduction)
- 🔧 **TypeScript**: Full TypeScript support with type definitions
- 🌐 **ES Modules**: Modern ES module support only
- 📁 **Complete API**: Same interface as vscode-icons for easy migration

## Installation

```bash
npm install electerm-icons
```

## Usage

```typescript
import { 
  getIconForFile,
  getIconForFolder
} from 'electerm-icons';

// Get icon for files
console.log(getIconForFile('index.html'));      // 'file_type_html.svg'
console.log(getIconForFile('script.js'));       // 'file_type_js.svg'
console.log(getIconForFile('main.py'));         // 'file_type_python.svg'
console.log(getIconForFile('unknown.xyz'));     // 'default_file.svg'

// Get icon for folders
console.log(getIconForFolder('src'));           // 'default_folder.svg'
```

## Supported File Types

### Web Development
- HTML: `.html`, `.htm`, `.xhtml`
- CSS: `.css`, `.scss`, `.sass`, `.less`
- JavaScript: `.js`, `.mjs`, `.cjs`
- TypeScript: `.ts`, `.tsx`
- JSON: `.json`, `.jsonc`
- XML: `.xml`, `.xsd`, `.xsl`

### Programming Languages
- Python: `.py`, `.pyw`, `.pyc`, `.pyo`
- Java: `.java`, `.class`, `.jar`
- C/C++: `.c`, `.h`, `.cpp`, `.cxx`, `.cc`, `.hpp`, `.hxx`
- C#: `.cs`, `.csx`
- PHP: `.php`, `.phtml`, `.php3`, `.php4`, `.php5`
- Go: `.go`
- Rust: `.rs`, `.rlib`
- Ruby: `.rb`, `.erb`, `.gemspec`
- Swift: `.swift`
- Kotlin: `.kt`, `.kts`

### Data & Configuration
- YAML: `.yaml`, `.yml`
- TOML: `.toml`
- INI: `.ini`, `.cfg`, `.conf`
- SQL: `.sql`, `.mysql`, `.pgsql`

### Documentation
- Markdown: `.md`, `.markdown`, `.mdown`

### Special Files
- `package.json`, `package-lock.json`
- `.gitignore`, `.gitattributes`
- `Dockerfile`, `docker-compose.yml`
- `CMakeLists.txt`, `Makefile`
- `LICENSE`, `README.md`

## API Reference

### Functions

#### `getIconForFile(fileName: string): string`
Returns the appropriate icon filename for a given file.

#### `getIconForFolder(folderName: string): string`
Returns the appropriate icon filename for a folder.

### Constants

- `DEFAULT_FILE`: Default file icon
- `DEFAULT_FOLDER`: Default folder icon

## Size Comparison

| Library | Icons | Size | Use Case |
|---------|-------|------|----------|
| vscode-icons | 1400+ | 7.7MB | Full IDE support |
| electerm-icons | 48 | ~0.14MB | Essential files only |

## Migration from vscode-icons

electerm-icons provides the same API as vscode-icons, making migration simple:

```typescript
// Before (vscode-icons)
import { getIconForFile } from 'vscode-icons-js';

// After (electerm-icons)
import { getIconForFile } from 'electerm-icons';

// Same function calls work identically
const icon = getIconForFile('index.html');
```

## Development

```bash

# Build the library
npm run build

# Run tests
npm test

# Development with watch mode
npm run dev
```

## License

MIT © ZHAO Xudong

## Contributing

Feel free to submit issues and pull requests to improve the icon selection or add missing essential file types.
