/**
 * RustPress JavaScript SDK
 * Official SDK for building hooks, plugins, themes, and apps for RustPress
 *
 * @module rustpress-sdk
 */

'use strict';

// =============================================================================
// Constants
// =============================================================================

const VERSION = '1.0.0';
const SDK_NAME = 'rustpress-sdk';

const TriggerTiming = {
  BEFORE: 'before',
  AFTER: 'after',
};

const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

const NotificationChannel = {
  IN_APP: 'in-app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  SLACK: 'slack',
  WEBHOOK: 'webhook',
};

const ContentStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived',
};

// =============================================================================
// Hook Definition
// =============================================================================

/**
 * @typedef {Object} HookMetadata
 * @property {string} name - Unique name for the hook
 * @property {string} [displayName] - Human-readable name
 * @property {string} [description] - Description of what the hook does
 * @property {string} trigger - Trigger pattern (@@rustpress.plugin.Class.method@@)
 * @property {'before'|'after'} timing - When to execute the hook
 * @property {string} [version] - Version of the hook
 * @property {string} [author] - Author of the hook
 * @property {string[]} [tags] - Tags for categorization
 * @property {number} [priority] - Execution priority (lower runs first)
 * @property {boolean} [enabled] - Whether the hook is enabled
 */

/**
 * @typedef {Object} TriggerArgs
 * @property {*} originalArgs - Original arguments passed to the plugin function
 * @property {*} result - Result from the plugin function (only in AFTER hooks)
 * @property {string} trigger - The trigger pattern that activated this hook
 * @property {'before'|'after'} timing - Timing of the hook execution
 * @property {Date} timestamp - When the trigger was activated
 * @property {string} triggerId - Unique ID for this trigger execution
 */

/**
 * @typedef {Object} RustPressContext
 * @property {string} executionId - Unique execution ID for tracing
 * @property {User|null} user - Current authenticated user
 * @property {Database} db - Database access
 * @property {Cache} cache - Cache access
 * @property {HttpClient} http - HTTP client for external requests
 * @property {NotificationService} notifications - Notification service
 * @property {QueueService} queue - Queue service
 * @property {TemplateService} templates - Template rendering service
 * @property {StorageService} storage - File storage service
 * @property {Logger} logger - Logging service
 * @property {ConfigService} config - Configuration access
 * @property {EventEmitter} events - Event emitter
 * @property {ServiceContainer} services - Service container
 */

/**
 * Create a hook definition
 * @param {HookMetadata} metadata - Hook metadata
 * @param {Function} handler - Hook handler function
 * @returns {Object} Hook definition
 */
function defineHook(metadata, handler) {
  if (!metadata.name) {
    throw new Error('Hook name is required');
  }
  if (!metadata.trigger) {
    throw new Error('Hook trigger is required');
  }
  if (!metadata.timing || !['before', 'after'].includes(metadata.timing)) {
    throw new Error('Hook timing must be "before" or "after"');
  }
  if (typeof handler !== 'function') {
    throw new Error('Hook handler must be a function');
  }

  return {
    metadata: {
      ...metadata,
      enabled: metadata.enabled !== false,
      priority: metadata.priority || 100,
    },
    handler,
  };
}

/**
 * Create a before hook (shorthand)
 * @param {string} trigger - Trigger pattern
 * @param {Function} handler - Hook handler function
 * @param {Object} [options] - Additional options
 * @returns {Object} Hook definition
 */
function beforeHook(trigger, handler, options = {}) {
  return defineHook(
    {
      name: options.name || `before_${trigger.replace(/[^a-zA-Z0-9]/g, '_')}`,
      trigger,
      timing: 'before',
      ...options,
    },
    handler
  );
}

/**
 * Create an after hook (shorthand)
 * @param {string} trigger - Trigger pattern
 * @param {Function} handler - Hook handler function
 * @param {Object} [options] - Additional options
 * @returns {Object} Hook definition
 */
function afterHook(trigger, handler, options = {}) {
  return defineHook(
    {
      name: options.name || `after_${trigger.replace(/[^a-zA-Z0-9]/g, '_')}`,
      trigger,
      timing: 'after',
      ...options,
    },
    handler
  );
}

// =============================================================================
// Plugin Base Class
// =============================================================================

/**
 * @typedef {Object} PluginMetadata
 * @property {string} name - Plugin display name
 * @property {string} version - Plugin version
 * @property {string} [description] - Plugin description
 * @property {string} [author] - Plugin author
 * @property {string} [homepage] - Plugin homepage URL
 * @property {string} [repository] - Plugin repository URL
 * @property {string} [license] - Plugin license
 * @property {string[]} [keywords] - Plugin keywords
 * @property {Object} [dependencies] - Plugin dependencies
 * @property {string[]} [permissions] - Required permissions
 */

/**
 * Base class for RustPress plugins
 */
class BasePlugin {
  /**
   * @param {string} id - Plugin ID
   * @param {PluginMetadata} metadata - Plugin metadata
   */
  constructor(id, metadata) {
    this.id = id;
    this.metadata = metadata;
    this._hooks = [];
    this._routes = [];
    this._context = null;
  }

  /**
   * Called when the plugin is activated
   * @param {Object} context - Plugin context
   * @returns {Promise<void>}
   */
  async activate(context) {
    this._context = context;
    await this.onActivate(context);
  }

  /**
   * Called when the plugin is deactivated
   * @returns {Promise<void>}
   */
  async deactivate() {
    await this.onDeactivate();
    this._context = null;
  }

  /**
   * Override this method to add activation logic
   * @param {Object} context - Plugin context
   * @returns {Promise<void>}
   */
  async onActivate(context) {
    // Override in subclass
  }

  /**
   * Override this method to add deactivation logic
   * @returns {Promise<void>}
   */
  async onDeactivate() {
    // Override in subclass
  }

  /**
   * Register a hook
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  registerHook(event, handler) {
    if (this._context) {
      this._context.hooks.register(event, handler);
    }
    this._hooks.push({ event, handler });
  }

  /**
   * Register an API route
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   */
  registerRoute(method, path, handler) {
    if (this._context) {
      this._context.api[method.toLowerCase()](path, handler);
    }
    this._routes.push({ method, path, handler });
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @param {*} [defaultValue] - Default value if not set
   * @returns {*}
   */
  getSetting(key, defaultValue) {
    if (this._context) {
      return this._context.settings.get(key, defaultValue);
    }
    return defaultValue;
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    if (this._context) {
      await this._context.settings.set(key, value);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  log(level, message, context = {}) {
    if (this._context) {
      this._context.logger[level](message, { plugin: this.id, ...context });
    }
  }
}

// =============================================================================
// Trigger Pattern Utilities
// =============================================================================

const TRIGGER_PATTERN = /^@@rustpress\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)@@$/;

/**
 * Parse a trigger pattern into its components
 * @param {string} trigger - Trigger pattern
 * @returns {Object|null} Parsed components or null if invalid
 */
function parseTrigger(trigger) {
  const match = trigger.match(TRIGGER_PATTERN);
  if (!match) return null;
  return {
    plugin: match[1],
    class: match[2],
    method: match[3],
  };
}

/**
 * Build a trigger pattern from components
 * @param {string} plugin - Plugin name
 * @param {string} className - Class name
 * @param {string} method - Method name
 * @returns {string} Trigger pattern
 */
function buildTrigger(plugin, className, method) {
  return `@@rustpress.${plugin}.${className}.${method}@@`;
}

/**
 * Validate a trigger pattern
 * @param {string} trigger - Trigger pattern
 * @returns {boolean} True if valid
 */
function isValidTrigger(trigger) {
  return TRIGGER_PATTERN.test(trigger);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.attempts=3] - Number of attempts
 * @param {number} [options.delay=1000] - Initial delay in ms
 * @param {number} [options.maxDelay=30000] - Maximum delay in ms
 * @returns {Promise<*>}
 */
async function retry(fn, options = {}) {
  const { attempts = 3, delay = 1000, maxDelay = 30000 } = options;
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const waitTime = Math.min(delay * Math.pow(2, i), maxDelay);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Create a debounced function
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timeoutId;

  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Create a throttled function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function}
 */
function throttle(fn, limit) {
  let inThrottle = false;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  return obj;
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects
 * @returns {Object}
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Generate a unique ID
 * @param {string} [prefix] - Optional prefix
 * @returns {string}
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}${randomPart}` : `${timestamp}${randomPart}`;
}

/**
 * Format a date
 * @param {Date} date - Date to format
 * @param {string} [format='iso'] - Format type
 * @returns {string}
 */
function formatDate(date, format = 'iso') {
  if (format === 'iso') return date.toISOString();
  if (format === 'timestamp') return date.getTime().toString();
  if (format === 'human') return date.toLocaleString();
  return date.toISOString();
}

// =============================================================================
// HTTP Client Helper
// =============================================================================

/**
 * Simple HTTP client wrapper
 */
class SimpleHttpClient {
  constructor(baseUrl = '', defaultHeaders = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  async request(method, url, options = {}) {
    const fullUrl = this.baseUrl + url;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const fetchOptions = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(fullUrl, fetchOptions);

    const data = await response.json().catch(() => null);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    };
  }

  get(url, options) {
    return this.request('GET', url, options);
  }

  post(url, body, options = {}) {
    return this.request('POST', url, { ...options, body });
  }

  put(url, body, options = {}) {
    return this.request('PUT', url, { ...options, body });
  }

  patch(url, body, options = {}) {
    return this.request('PATCH', url, { ...options, body });
  }

  delete(url, options) {
    return this.request('DELETE', url, options);
  }
}

// =============================================================================
// Event Emitter
// =============================================================================

/**
 * Simple event emitter
 */
class SimpleEventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, handler) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
  }

  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event, handler) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(h => h !== handler);
  }

  async emit(event, data) {
    if (!this._events[event]) return;
    for (const handler of this._events[event]) {
      await handler(data);
    }
  }

  listeners(event) {
    return this._events[event] || [];
  }
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  // Version
  VERSION,
  SDK_NAME,

  // Constants
  TriggerTiming,
  NotificationType,
  NotificationChannel,
  ContentStatus,

  // Hook functions
  defineHook,
  beforeHook,
  afterHook,

  // Plugin base class
  BasePlugin,

  // Trigger utilities
  parseTrigger,
  buildTrigger,
  isValidTrigger,

  // Utility functions
  sleep,
  retry,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateId,
  formatDate,

  // HTTP Client
  SimpleHttpClient,

  // Event Emitter
  SimpleEventEmitter,
};
