import { useState, useEffect } from 'react';

/**
 * useDebounce — Custom hook to debounce rapid state updates (e.g. search inputs)
 * @param {*} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 300ms)
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
