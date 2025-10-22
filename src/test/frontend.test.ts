import { describe, it, expect } from 'vitest';

describe('Frontend Test Setup', () => {
  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('should have basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
});
