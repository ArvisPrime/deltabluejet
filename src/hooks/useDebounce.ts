import { useState, useEffect } from 'react';

/**
 * useDebounce — delays updating a value until after a specified delay.
 * Useful for search inputs, filter fields, and API calls.
 *
 * @param value  The input value to debounce
 * @param delay  Delay in milliseconds (default: 300ms)
 * @returns      The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
