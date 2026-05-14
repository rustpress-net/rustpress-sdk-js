'use strict';

const { BaseApp } = require('../src/index.js');

function makeContext(overrides = {}) {
  return {
    navigate: jest.fn(),
    showNotification: jest.fn(),
    showToast: jest.fn(),
    showDialog: jest.fn(async () => ({ confirmed: true, value: 42 })),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    ...overrides,
  };
}

describe('BaseApp', () => {
  test('stores id and metadata at construction', () => {
    const a = new BaseApp('my-app', { name: 'My App', version: '1.0.0' });
    expect(a.id).toBe('my-app');
    expect(a.metadata.name).toBe('My App');
  });

  test('activate calls onActivate and attaches context', async () => {
    const onActivate = jest.fn(async () => {});
    class A extends BaseApp {
      onActivate(ctx) {
        return onActivate(ctx);
      }
    }
    const a = new A('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    expect(onActivate).toHaveBeenCalledWith(ctx);
    expect(a._context).toBe(ctx);
  });

  test('deactivate clears context', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    await a.activate(makeContext());
    await a.deactivate();
    expect(a._context).toBeNull();
  });

  test('navigate forwards to context.navigate', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    a.navigate('/dashboard');
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard');
  });

  test('navigate is silent when no context is attached', () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    expect(() => a.navigate('/x')).not.toThrow();
  });

  test('showNotification forwards to context', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    const notification = { title: 't', message: 'm' };
    a.showNotification(notification);
    expect(ctx.showNotification).toHaveBeenCalledWith(notification);
  });

  test('showToast defaults to info type', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    a.showToast('hello');
    expect(ctx.showToast).toHaveBeenCalledWith('hello', 'info');
  });

  test('showToast respects explicit type', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    a.showToast('boom', 'error');
    expect(ctx.showToast).toHaveBeenCalledWith('boom', 'error');
  });

  test('showDialog returns context result when active', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    const result = await a.showDialog({ title: 'Confirm?' });
    expect(result).toEqual({ confirmed: true, value: 42 });
    expect(ctx.showDialog).toHaveBeenCalledWith({ title: 'Confirm?' });
  });

  test('showDialog returns { confirmed: false } when no context is attached', async () => {
    const a = new BaseApp('id', { name: 'n', version: '1' });
    const result = await a.showDialog({ title: 'x' });
    expect(result).toEqual({ confirmed: false });
  });

  test('log forwards to context.logger including app id', async () => {
    const a = new BaseApp('my-app', { name: 'n', version: '1' });
    const ctx = makeContext();
    await a.activate(ctx);
    a.log('info', 'started', { v: 1 });
    expect(ctx.logger.info).toHaveBeenCalledWith('started', { app: 'my-app', v: 1 });
  });
});
