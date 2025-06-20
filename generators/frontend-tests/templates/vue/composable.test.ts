import { describe, it, expect } from 'vitest';
import { useCounter } from '../<%= composableName %>';

describe('<%= composableName %>', () => {
  it('should initialize with the provided value', () => {
    const { count } = useCounter(10);
    expect(count.value).toBe(10);
  });

  it('should increment the counter', () => {
    const { count, increment } = useCounter(0);
    increment();
    expect(count.value).toBe(1);
    increment();
    expect(count.value).toBe(2);
  });

  it('should decrement the counter', () => {
    const { count, decrement } = useCounter(10);
    decrement();
    expect(count.value).toBe(9);
    decrement();
    expect(count.value).toBe(8);
  });

  it('should reset the counter to the initial value', () => {
    const { count, increment, reset } = useCounter(5);
    increment();
    increment();
    expect(count.value).toBe(7);
    reset();
    expect(count.value).toBe(5);
  });

  it('should update the counter with setValue', () => {
    const { count, setValue } = useCounter(0);
    setValue(42);
    expect(count.value).toBe(42);
  });

  it('should respect minimum value if provided', () => {
    const { count, decrement } = useCounter(0, { min: 0 });
    decrement();
    expect(count.value).toBe(0);
  });

  it('should respect maximum value if provided', () => {
    const { count, increment } = useCounter(9, { max: 10 });
    increment();
    expect(count.value).toBe(10);
    increment();
    expect(count.value).toBe(10);
  });
});
