import { renderHook, act } from '@testing-library/react';
import <%= hookName %> from '../<%= hookName %>';

describe('<%= hookName %> Hook', () => {
  test('should initialize with default value', () => {
    const { result } = renderHook(() => <%= hookName %>(0));
    expect(result.current.count).toBe(0);
  });

  test('should increment counter', () => {
    const { result } = renderHook(() => <%= hookName %>(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  test('should decrement counter', () => {
    const { result } = renderHook(() => <%= hookName %>(10));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(9);
  });

  test('should reset counter to initial value', () => {
    const { result } = renderHook(() => <%= hookName %>(0));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(0);
  });

  test('should update counter with setValue', () => {
    const { result } = renderHook(() => <%= hookName %>(0));

    act(() => {
      result.current.setValue(42);
    });

    expect(result.current.count).toBe(42);
  });
});
