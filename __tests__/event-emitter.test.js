'use strict';

const { SimpleEventEmitter } = require('../src/index.js');

describe('SimpleEventEmitter', () => {
  test('on subscribes a handler and emit dispatches data to it', async () => {
    const emitter = new SimpleEventEmitter();
    const handler = jest.fn();
    emitter.on('user:created', handler);
    await emitter.emit('user:created', { id: 1 });
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  test('emit invokes all subscribed handlers in registration order', async () => {
    const emitter = new SimpleEventEmitter();
    const order = [];
    emitter.on('e', async () => order.push('a'));
    emitter.on('e', async () => order.push('b'));
    emitter.on('e', async () => order.push('c'));
    await emitter.emit('e');
    expect(order).toEqual(['a', 'b', 'c']);
  });

  test('off removes a previously registered handler', async () => {
    const emitter = new SimpleEventEmitter();
    const handler = jest.fn();
    emitter.on('e', handler);
    emitter.off('e', handler);
    await emitter.emit('e', 'data');
    expect(handler).not.toHaveBeenCalled();
  });

  test('off is a safe no-op for unknown events', () => {
    const emitter = new SimpleEventEmitter();
    expect(() => emitter.off('never-registered', () => {})).not.toThrow();
  });

  test('emit on an event with no listeners is a safe no-op', async () => {
    const emitter = new SimpleEventEmitter();
    await expect(emitter.emit('nope', { x: 1 })).resolves.toBeUndefined();
  });

  test('once handler fires exactly one time', async () => {
    const emitter = new SimpleEventEmitter();
    const handler = jest.fn();
    emitter.once('e', handler);
    await emitter.emit('e', 1);
    await emitter.emit('e', 2);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  test('listeners returns the registered handlers for an event', () => {
    const emitter = new SimpleEventEmitter();
    const a = () => {};
    const b = () => {};
    emitter.on('e', a);
    emitter.on('e', b);
    expect(emitter.listeners('e')).toEqual([a, b]);
  });

  test('listeners returns an empty array for unknown events', () => {
    const emitter = new SimpleEventEmitter();
    expect(emitter.listeners('nope')).toEqual([]);
  });

  test('emit awaits async handlers in sequence', async () => {
    const emitter = new SimpleEventEmitter();
    const order = [];
    emitter.on('e', async () => {
      await new Promise(r => setTimeout(r, 5));
      order.push('slow');
    });
    emitter.on('e', async () => {
      order.push('fast');
    });
    await emitter.emit('e');
    expect(order).toEqual(['slow', 'fast']);
  });

  test('handlers receive whatever data is emitted', async () => {
    const emitter = new SimpleEventEmitter();
    const received = [];
    emitter.on('e', data => received.push(data));
    await emitter.emit('e', { a: 1 });
    await emitter.emit('e', 'string');
    await emitter.emit('e', 42);
    expect(received).toEqual([{ a: 1 }, 'string', 42]);
  });
});
