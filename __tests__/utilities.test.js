'use strict';

const {
  sleep,
  retry,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateId,
  formatDate,
} = require('../src/index.js');

describe('Utility functions', () => {
  describe('sleep', () => {
    test('resolves after approximately the requested duration', async () => {
      const start = Date.now();
      await sleep(20);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(15);
    });

    test('returns a promise', () => {
      const p = sleep(0);
      expect(p).toBeInstanceOf(Promise);
      return p;
    });
  });

  describe('retry', () => {
    test('returns the result when the function succeeds on the first try', async () => {
      const fn = jest.fn(async () => 'ok');
      const result = await retry(fn, { attempts: 3, delay: 1 });
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries on failure and eventually resolves', async () => {
      let calls = 0;
      const fn = jest.fn(async () => {
        calls += 1;
        if (calls < 3) throw new Error('fail');
        return 'finally';
      });
      const result = await retry(fn, { attempts: 5, delay: 1 });
      expect(result).toBe('finally');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('throws the last error when all attempts fail', async () => {
      let n = 0;
      const fn = jest.fn(async () => {
        n += 1;
        throw new Error(`fail-${n}`);
      });
      await expect(retry(fn, { attempts: 3, delay: 1 })).rejects.toThrow('fail-3');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('uses default options when none are passed', async () => {
      const fn = jest.fn(async () => 'ok');
      const result = await retry(fn);
      expect(result).toBe('ok');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('delays invocation until wait time has elapsed', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      debounced('a');
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    test('coalesces multiple rapid calls into a single invocation', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      debounced(1);
      debounced(2);
      debounced(3);
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });

    test('resets the timer when called again before wait elapses', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      debounced('a');
      jest.advanceTimersByTime(50);
      debounced('b');
      jest.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('b');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('invokes the function immediately on the first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);
      throttled('a');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    test('blocks subsequent calls within the throttle window', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);
      throttled('a');
      throttled('b');
      throttled('c');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('allows another call after the window elapses', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);
      throttled('a');
      jest.advanceTimersByTime(100);
      throttled('b');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 'a');
      expect(fn).toHaveBeenNthCalledWith(2, 'b');
    });
  });

  describe('deepClone', () => {
    test('returns primitives unchanged', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hi')).toBe('hi');
      expect(deepClone(null)).toBeNull();
      expect(deepClone(true)).toBe(true);
    });

    test('clones plain objects without aliasing', () => {
      const src = { a: 1, b: { c: 2 } };
      const out = deepClone(src);
      expect(out).toEqual(src);
      expect(out).not.toBe(src);
      expect(out.b).not.toBe(src.b);
    });

    test('clones arrays without aliasing', () => {
      const src = [1, [2, 3], { x: 4 }];
      const out = deepClone(src);
      expect(out).toEqual(src);
      expect(out).not.toBe(src);
      expect(out[1]).not.toBe(src[1]);
      expect(out[2]).not.toBe(src[2]);
    });

    test('clones Date instances', () => {
      const d = new Date('2023-01-01T00:00:00Z');
      const out = deepClone(d);
      expect(out).toBeInstanceOf(Date);
      expect(out.getTime()).toBe(d.getTime());
      expect(out).not.toBe(d);
    });

    test('mutating the clone does not affect the original', () => {
      const src = { a: { b: 1 } };
      const out = deepClone(src);
      out.a.b = 999;
      expect(src.a.b).toBe(1);
    });
  });

  describe('deepMerge', () => {
    test('merges two flat objects', () => {
      const out = deepMerge({ a: 1 }, { b: 2 });
      expect(out).toEqual({ a: 1, b: 2 });
    });

    test('recursively merges nested objects', () => {
      const out = deepMerge({ a: { x: 1 } }, { a: { y: 2 } });
      expect(out).toEqual({ a: { x: 1, y: 2 } });
    });

    test('later sources override earlier ones for the same key', () => {
      const out = deepMerge({ a: 1 }, { a: 2 }, { a: 3 });
      expect(out.a).toBe(3);
    });

    test('treats arrays as non-mergeable values (replaces)', () => {
      const out = deepMerge({ list: [1, 2] }, { list: [3, 4] });
      expect(out.list).toEqual([3, 4]);
    });

    test('returns the target when called with no sources', () => {
      const t = { a: 1 };
      expect(deepMerge(t)).toBe(t);
    });
  });

  describe('generateId', () => {
    test('returns a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('includes the prefix when provided', () => {
      const id = generateId('order');
      expect(id.startsWith('order_')).toBe(true);
    });

    test('produces different IDs across successive calls', () => {
      const a = generateId();
      const b = generateId();
      expect(a).not.toBe(b);
    });
  });

  describe('formatDate', () => {
    const fixed = new Date('2024-06-15T12:34:56.000Z');

    test('formats as ISO by default', () => {
      expect(formatDate(fixed)).toBe('2024-06-15T12:34:56.000Z');
    });

    test('formats as ISO when explicitly requested', () => {
      expect(formatDate(fixed, 'iso')).toBe('2024-06-15T12:34:56.000Z');
    });

    test('formats as timestamp string', () => {
      expect(formatDate(fixed, 'timestamp')).toBe(String(fixed.getTime()));
    });

    test('formats as human-readable string', () => {
      const out = formatDate(fixed, 'human');
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });

    test('falls back to ISO for unknown format names', () => {
      expect(formatDate(fixed, 'mystery')).toBe('2024-06-15T12:34:56.000Z');
    });
  });
});
