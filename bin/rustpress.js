#!/usr/bin/env node

/**
 * RustPress SDK CLI
 * Command-line tools for building RustPress plugins, themes, and apps
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '1.0.0';
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// =============================================================================
// Colors for terminal output
// =============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// =============================================================================
// Templates
// =============================================================================

const templates = {
  plugin: {
    'package.json': (name, author) => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "A RustPress plugin",
  "main": "src/index.js",
  "scripts": {
    "dev": "rustpress dev",
    "build": "rustpress build",
    "test": "jest",
    "lint": "eslint src"
  },
  "keywords": ["rustpress", "plugin"],
  "author": "${author}",
  "license": "MIT",
  "dependencies": {
    "rustpress-sdk": "^1.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "rustpress": {
    "type": "plugin",
    "id": "${name}"
  }
}`,
    'src/index.js': (name) => `const { BasePlugin } = require('rustpress-sdk');

class ${toPascalCase(name)} extends BasePlugin {
  constructor() {
    super('${name}', {
      name: '${toTitleCase(name)}',
      version: '1.0.0',
      description: 'A RustPress plugin',
    });
  }

  async onActivate(context) {
    // Register hooks
    this.registerHook('content:before_save', async (content) => {
      // Modify content before saving
      return content;
    });

    // Register API routes
    this.registerRoute('GET', '/api/${name}/status', async (req, res) => {
      res.json({ status: 'active', version: this.metadata.version });
    });

    this.log('info', 'Plugin activated');
  }

  async onDeactivate() {
    this.log('info', 'Plugin deactivated');
  }
}

module.exports = new ${toPascalCase(name)}();
`,
    'src/hooks/index.js': (name) => `const { beforeHook, afterHook } = require('rustpress-sdk');

// Example before hook
const validateContent = beforeHook(
  '@@rustpress.content.Content.save@@',
  async (args, context) => {
    const content = args.originalArgs;

    if (!content.title) {
      throw new Error('Content title is required');
    }

    context.logger.info('Content validation passed');
  },
  { name: '${name}_validateContent' }
);

// Example after hook
const logContent = afterHook(
  '@@rustpress.content.Content.save@@',
  async (args, context) => {
    context.logger.info('Content saved', { id: args.result?.id });
  },
  { name: '${name}_logContent' }
);

module.exports = { validateContent, logContent };
`,
    'README.md': (name) => `# ${toTitleCase(name)}

A RustPress plugin.

## Installation

\`\`\`bash
rustpress plugin install ${name}
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
\`\`\`

## License

MIT
`,
    'rustpress.config.js': (name) => `module.exports = {
  type: 'plugin',
  id: '${name}',
  entry: './src/index.js',
  outDir: './dist',

  // Development server options
  dev: {
    port: 3001,
    hot: true,
  },

  // Build options
  build: {
    minify: true,
    sourcemap: true,
  },
};
`,
  },

  theme: {
    'package.json': (name, author) => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "A RustPress theme",
  "main": "src/index.js",
  "scripts": {
    "dev": "rustpress dev",
    "build": "rustpress build",
    "test": "jest"
  },
  "keywords": ["rustpress", "theme"],
  "author": "${author}",
  "license": "MIT",
  "dependencies": {
    "rustpress-sdk": "^1.0.0"
  },
  "rustpress": {
    "type": "theme",
    "id": "${name}"
  }
}`,
    'src/index.js': (name) => `const { BaseTheme } = require('rustpress-sdk');

class ${toPascalCase(name)} extends BaseTheme {
  constructor() {
    super('${name}', {
      name: '${toTitleCase(name)}',
      version: '1.0.0',
      description: 'A beautiful RustPress theme',
      screenshot: './assets/screenshot.png',
      supports: ['dark-mode', 'custom-colors', 'custom-fonts'],
    });
  }

  async onActivate(context) {
    this.log('info', 'Theme activated');
  }

  async onDeactivate() {
    this.log('info', 'Theme deactivated');
  }
}

module.exports = new ${toPascalCase(name)}();
`,
    'src/templates/layout.html': () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - {{site.name}}</title>
  <link rel="stylesheet" href="{{asset 'css/style.css'}}">
</head>
<body>
  {{> header}}

  <main class="content">
    {{{content}}}
  </main>

  {{> footer}}

  <script src="{{asset 'js/main.js'}}"></script>
</body>
</html>
`,
    'src/templates/partials/header.html': () => `<header class="site-header">
  <nav class="nav">
    <a href="/" class="logo">{{site.name}}</a>
    <ul class="nav-menu">
      {{#each menu.primary}}
        <li><a href="{{url}}">{{title}}</a></li>
      {{/each}}
    </ul>
  </nav>
</header>
`,
    'src/templates/partials/footer.html': () => `<footer class="site-footer">
  <p>&copy; {{year}} {{site.name}}. All rights reserved.</p>
</footer>
`,
    'src/assets/css/style.css': () => `/* Theme Styles */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --color-background: #ffffff;
  --color-foreground: #1f2937;
  --color-muted: #6b7280;
  --font-heading: system-ui, sans-serif;
  --font-body: system-ui, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  color: var(--color-foreground);
  background-color: var(--color-background);
  line-height: 1.6;
}

.site-header {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-menu a {
  color: var(--color-foreground);
  text-decoration: none;
}

.nav-menu a:hover {
  color: var(--color-primary);
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.site-footer {
  padding: 2rem;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  color: var(--color-muted);
}
`,
    'src/assets/js/main.js': () => `// Theme JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('Theme loaded');
});
`,
    'README.md': (name) => `# ${toTitleCase(name)}

A RustPress theme.

## Installation

\`\`\`bash
rustpress theme install ${name}
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## License

MIT
`,
    'rustpress.config.js': (name) => `module.exports = {
  type: 'theme',
  id: '${name}',
  entry: './src/index.js',
  outDir: './dist',

  templates: './src/templates',
  assets: './src/assets',

  dev: {
    port: 3002,
    hot: true,
  },
};
`,
  },

  app: {
    'package.json': (name, author) => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "A RustPress app",
  "main": "src/index.js",
  "scripts": {
    "dev": "rustpress dev",
    "build": "rustpress build",
    "test": "jest"
  },
  "keywords": ["rustpress", "app"],
  "author": "${author}",
  "license": "MIT",
  "dependencies": {
    "rustpress-sdk": "^1.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "jest": "^29.0.0"
  },
  "rustpress": {
    "type": "app",
    "id": "${name}"
  }
}`,
    'src/index.js': (name) => `const { BaseApp } = require('rustpress-sdk');

class ${toPascalCase(name)} extends BaseApp {
  constructor() {
    super('${name}', {
      name: '${toTitleCase(name)}',
      version: '1.0.0',
      description: 'A RustPress app',
      icon: 'dashboard',
      menu: {
        title: '${toTitleCase(name)}',
        icon: 'dashboard',
        position: 'sidebar',
        order: 100,
      },
      routes: [
        { path: '/${name}', component: 'Dashboard' },
        { path: '/${name}/settings', component: 'Settings' },
      ],
      permissions: ['${name}:read', '${name}:write'],
    });
  }

  async onActivate(context) {
    this.log('info', 'App activated');
  }

  async onDeactivate() {
    this.log('info', 'App deactivated');
  }
}

module.exports = new ${toPascalCase(name)}();
`,
    'src/components/Dashboard.jsx': (name) => `import React from 'react';

export default function Dashboard({ context }) {
  return (
    <div className="dashboard">
      <h1>${toTitleCase(name)}</h1>
      <p>Welcome to your app dashboard.</p>
    </div>
  );
}
`,
    'src/components/Settings.jsx': (name) => `import React, { useState } from 'react';

export default function Settings({ context }) {
  const [settings, setSettings] = useState({});

  const handleSave = async () => {
    await context.settings.set('config', settings);
    context.showToast('Settings saved', 'success');
  };

  return (
    <div className="settings">
      <h1>Settings</h1>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
}
`,
    'README.md': (name) => `# ${toTitleCase(name)}

A RustPress app.

## Installation

\`\`\`bash
rustpress app install ${name}
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## License

MIT
`,
    'rustpress.config.js': (name) => `module.exports = {
  type: 'app',
  id: '${name}',
  entry: './src/index.js',
  outDir: './dist',

  dev: {
    port: 3003,
    hot: true,
  },

  build: {
    minify: true,
    sourcemap: true,
  },
};
`,
  },

  hook: {
    'package.json': (name, author) => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "A RustPress hook function",
  "main": "src/index.js",
  "scripts": {
    "dev": "rustpress dev",
    "build": "rustpress build",
    "test": "jest"
  },
  "keywords": ["rustpress", "hook"],
  "author": "${author}",
  "license": "MIT",
  "dependencies": {
    "rustpress-sdk": "^1.0.0"
  },
  "rustpress": {
    "type": "hook",
    "id": "${name}"
  }
}`,
    'src/index.js': (name) => `const { defineHook } = require('rustpress-sdk');

module.exports = defineHook(
  {
    name: '${name}',
    displayName: '${toTitleCase(name)}',
    description: 'A RustPress hook function',
    trigger: '@@rustpress.content.Content.save@@',
    timing: 'before',
    priority: 100,
  },
  async (args, context) => {
    const data = args.originalArgs;

    // Your hook logic here
    context.logger.info('Hook executed', { trigger: args.trigger });

    // Return modified data or void
    return data;
  }
);
`,
    'README.md': (name) => `# ${toTitleCase(name)}

A RustPress hook function.

## Installation

\`\`\`bash
rustpress hook install ${name}
\`\`\`

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## License

MIT
`,
    'rustpress.config.js': (name) => `module.exports = {
  type: 'hook',
  id: '${name}',
  entry: './src/index.js',
  outDir: './dist',
};
`,
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  createDirectory(dir);
  fs.writeFileSync(filePath, content);
}

function getAuthor() {
  try {
    const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
    return `${name} <${email}>`;
  } catch {
    return 'Unknown';
  }
}

// =============================================================================
// Commands
// =============================================================================

function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}RustPress SDK CLI${colors.reset} v${VERSION}

${colors.bright}Usage:${colors.reset}
  rustpress <command> [options]

${colors.bright}Commands:${colors.reset}
  ${colors.green}create${colors.reset} <type> <name>    Create a new project (plugin, theme, app, hook)
  ${colors.green}dev${colors.reset}                     Start development server
  ${colors.green}build${colors.reset}                   Build for production
  ${colors.green}validate${colors.reset}                Validate project structure
  ${colors.green}publish${colors.reset}                 Publish to RustPress registry
  ${colors.green}help${colors.reset}                    Show this help message
  ${colors.green}version${colors.reset}                 Show version

${colors.bright}Examples:${colors.reset}
  rustpress create plugin my-plugin
  rustpress create theme my-theme
  rustpress create app my-app
  rustpress create hook my-hook
  rustpress dev
  rustpress build
  rustpress publish

${colors.bright}Documentation:${colors.reset}
  https://rustpress.dev/docs/sdk
`);
}

function showVersion() {
  console.log(`rustpress-sdk v${VERSION}`);
}

function createProject(type, name) {
  if (!['plugin', 'theme', 'app', 'hook'].includes(type)) {
    log.error(`Invalid project type: ${type}`);
    log.info('Valid types: plugin, theme, app, hook');
    process.exit(1);
  }

  if (!name) {
    log.error('Project name is required');
    log.info(`Usage: rustpress create ${type} <name>`);
    process.exit(1);
  }

  const projectDir = path.join(process.cwd(), name);

  if (fs.existsSync(projectDir)) {
    log.error(`Directory ${name} already exists`);
    process.exit(1);
  }

  log.title(`Creating RustPress ${type}: ${name}`);

  const template = templates[type];
  const author = getAuthor();

  for (const [file, generator] of Object.entries(template)) {
    const content = generator(name, author);
    const filePath = path.join(projectDir, file);
    writeFile(filePath, content);
    log.success(`Created ${file}`);
  }

  // Create .gitignore
  writeFile(path.join(projectDir, '.gitignore'), `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`);
  log.success('Created .gitignore');

  console.log(`
${colors.green}✔ Project created successfully!${colors.reset}

Next steps:
  ${colors.cyan}cd ${name}${colors.reset}
  ${colors.cyan}npm install${colors.reset}
  ${colors.cyan}npm run dev${colors.reset}
`);
}

function runDev() {
  const configPath = path.join(process.cwd(), 'rustpress.config.js');

  if (!fs.existsSync(configPath)) {
    log.error('No rustpress.config.js found');
    log.info('Run this command from a RustPress project directory');
    process.exit(1);
  }

  const config = require(configPath);
  log.title(`Starting development server for ${config.type}: ${config.id}`);

  const port = config.dev?.port || 3000;
  log.info(`Server running at http://localhost:${port}`);
  log.info('Watching for changes...');

  // In a real implementation, this would start a dev server
  // For now, we just show the message
  log.warn('Development server not yet implemented');
}

function runBuild() {
  const configPath = path.join(process.cwd(), 'rustpress.config.js');

  if (!fs.existsSync(configPath)) {
    log.error('No rustpress.config.js found');
    process.exit(1);
  }

  const config = require(configPath);
  log.title(`Building ${config.type}: ${config.id}`);

  const outDir = config.outDir || './dist';
  createDirectory(path.join(process.cwd(), outDir));

  log.info('Bundling...');
  log.info('Minifying...');
  log.success(`Build complete! Output: ${outDir}`);

  // In a real implementation, this would bundle the project
  log.warn('Build process not yet fully implemented');
}

function validate() {
  const configPath = path.join(process.cwd(), 'rustpress.config.js');

  if (!fs.existsSync(configPath)) {
    log.error('No rustpress.config.js found');
    process.exit(1);
  }

  const config = require(configPath);
  log.title(`Validating ${config.type}: ${config.id}`);

  let errors = 0;
  let warnings = 0;

  // Check required files
  const requiredFiles = ['package.json', 'src/index.js'];
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      log.success(`Found ${file}`);
    } else {
      log.error(`Missing ${file}`);
      errors++;
    }
  }

  // Check package.json
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (!pkg.rustpress) {
      log.warn('Missing "rustpress" field in package.json');
      warnings++;
    }

    if (!pkg.dependencies?.['rustpress-sdk']) {
      log.warn('rustpress-sdk not found in dependencies');
      warnings++;
    }
  }

  console.log('');
  if (errors > 0) {
    log.error(`Validation failed with ${errors} error(s) and ${warnings} warning(s)`);
    process.exit(1);
  } else if (warnings > 0) {
    log.warn(`Validation passed with ${warnings} warning(s)`);
  } else {
    log.success('Validation passed!');
  }
}

function publish() {
  const configPath = path.join(process.cwd(), 'rustpress.config.js');

  if (!fs.existsSync(configPath)) {
    log.error('No rustpress.config.js found');
    process.exit(1);
  }

  const config = require(configPath);
  log.title(`Publishing ${config.type}: ${config.id}`);

  log.info('Validating...');
  log.info('Building...');
  log.info('Uploading to RustPress registry...');

  // In a real implementation, this would publish to a registry
  log.warn('Publishing not yet implemented');
  log.info('Once implemented, your package will be available at:');
  log.info(`  https://registry.rustpress.dev/${config.type}s/${config.id}`);
}

// =============================================================================
// Main
// =============================================================================

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createProject(args[1], args[2]);
    break;
  case 'dev':
    runDev();
    break;
  case 'build':
    runBuild();
    break;
  case 'validate':
    validate();
    break;
  case 'publish':
    publish();
    break;
  case 'version':
  case '-v':
  case '--version':
    showVersion();
    break;
  case 'help':
  case '-h':
  case '--help':
  case undefined:
    showHelp();
    break;
  default:
    log.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
