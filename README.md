# rustpress-sdk - JavaScript SDK

Official JavaScript SDK for RustPress - Build hooks, plugins, themes, and apps.

## Installation

```bash
npm install rustpress-sdk
# or
yarn add rustpress-sdk
# or
pnpm add rustpress-sdk
```

## Quick Start

### Creating a Hook Function

```javascript
const { defineHook } = require('rustpress-sdk');

module.exports = defineHook(
  {
    name: 'orderValidation',
    displayName: 'Order Validation',
    description: 'Validates orders before creation',
    trigger: '@@rustpress.ecommerce.Order.create@@',
    timing: 'before',
  },
  async (args, context) => {
    const orderData = args.originalArgs;

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (orderData.total < 0) {
      throw new Error('Order total cannot be negative');
    }

    context.logger.info('Order validation passed');
  }
);
```

### Using Shorthand Hook Functions

```javascript
const { beforeHook, afterHook } = require('rustpress-sdk');

// Before hook
const validateOrder = beforeHook(
  '@@rustpress.ecommerce.Order.create@@',
  async (args, context) => {
    // Validation logic
  },
  { name: 'validateOrder' }
);

// After hook
const logOrder = afterHook(
  '@@rustpress.ecommerce.Order.create@@',
  async (args, context) => {
    console.log('Order created:', args.result);
  },
  { name: 'logOrder' }
);

module.exports = { validateOrder, logOrder };
```

### Creating a Plugin

```javascript
const { BasePlugin } = require('rustpress-sdk');

class MyPlugin extends BasePlugin {
  constructor() {
    super('my-plugin', {
      name: 'My Plugin',
      version: '1.0.0',
      description: 'A sample plugin',
    });
  }

  async onActivate(context) {
    // Register hooks
    this.registerHook('content:before_save', async (content) => {
      content.metadata.processedBy = this.id;
      return content;
    });

    // Register API routes
    this.registerRoute('GET', '/status', async (req, res) => {
      res.json({ status: 'active' });
    });

    this.log('info', 'Plugin activated');
  }

  async onDeactivate() {
    this.log('info', 'Plugin deactivated');
  }
}

module.exports = new MyPlugin();
```

### Creating a Theme

```javascript
const { BaseTheme } = require('rustpress-sdk');

class MyTheme extends BaseTheme {
  constructor() {
    super('my-theme', {
      name: 'My Theme',
      version: '1.0.0',
      description: 'A beautiful theme',
      supports: ['dark-mode', 'custom-colors'],
    });
  }

  async onActivate(context) {
    this.log('info', 'Theme activated');
  }

  async onDeactivate() {
    this.log('info', 'Theme deactivated');
  }
}

module.exports = new MyTheme();
```

### Creating an App

```javascript
const { BaseApp } = require('rustpress-sdk');

class MyApp extends BaseApp {
  constructor() {
    super('my-app', {
      name: 'My App',
      version: '1.0.0',
      description: 'A custom app',
      icon: 'dashboard',
      menu: {
        title: 'My App',
        icon: 'dashboard',
        position: 'sidebar',
      },
    });
  }

  async onActivate(context) {
    this.log('info', 'App activated');
  }

  async onDeactivate() {
    this.log('info', 'App deactivated');
  }
}

module.exports = new MyApp();
```

## API Reference

### Trigger Utilities

```javascript
const { parseTrigger, buildTrigger, isValidTrigger } = require('rustpress-sdk');

// Parse a trigger pattern
const parts = parseTrigger('@@rustpress.ecommerce.Order.create@@');
// { plugin: 'ecommerce', class: 'Order', method: 'create' }

// Build a trigger pattern
const trigger = buildTrigger('ecommerce', 'Order', 'create');
// '@@rustpress.ecommerce.Order.create@@'

// Validate a trigger pattern
isValidTrigger('@@rustpress.ecommerce.Order.create@@'); // true
isValidTrigger('invalid'); // false
```

### Utility Functions

```javascript
const { sleep, retry, debounce, throttle, generateId } = require('rustpress-sdk');

// Sleep
await sleep(1000); // Wait 1 second

// Retry with exponential backoff
const data = await retry(
  () => fetchData(),
  { attempts: 3, delay: 1000 }
);

// Debounce
const debouncedFn = debounce(myFunction, 300);

// Throttle
const throttledFn = throttle(myFunction, 1000);

// Generate unique ID
const id = generateId('order'); // 'order_lk2j3h4g5...'
```

### HTTP Client

```javascript
const { SimpleHttpClient } = require('rustpress-sdk');

const client = new SimpleHttpClient('https://api.example.com', {
  'Authorization': 'Bearer token'
});

const response = await client.get('/users');
const newUser = await client.post('/users', { name: 'John' });
```

### Event Emitter

```javascript
const { SimpleEventEmitter } = require('rustpress-sdk');

const emitter = new SimpleEventEmitter();

emitter.on('user:created', (user) => {
  console.log('User created:', user);
});

await emitter.emit('user:created', { id: 1, name: 'John' });
```

## Constants

```javascript
const {
  TriggerTiming,    // { BEFORE: 'before', AFTER: 'after' }
  NotificationType, // { INFO, SUCCESS, WARNING, ERROR }
  NotificationChannel, // { IN_APP, EMAIL, SMS, PUSH, SLACK, WEBHOOK }
  ContentStatus,    // { DRAFT, PENDING, PUBLISHED, SCHEDULED, ARCHIVED }
} = require('rustpress-sdk');
```

## License

MIT
