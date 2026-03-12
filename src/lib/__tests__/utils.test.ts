import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle empty string', () => {
    expect(cn('', 'foo')).toBe('foo');
  });

  it('should handle no arguments', () => {
    expect(cn()).toBe('');
  });

  it('should merge tailwind conflicting classes', () => {
    // twMerge should resolve conflicting tailwind classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should merge tailwind color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle mixed inputs', () => {
    expect(cn('foo', ['bar', 'baz'], { qux: true })).toBe('foo bar baz qux');
  });
});
