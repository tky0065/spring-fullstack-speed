import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import <%= componentName %> from '../components/<%= componentName %>';

describe('<%= componentName %> Component', () => {
  test('should render correctly', () => {
    render(<<%= componentName %> label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const mockOnClick = jest.fn();
    render(<<%= componentName %> label="Click me" onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: /Click me/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('should apply custom class when provided', () => {
    render(<<%= componentName %> label="Click me" className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('should be disabled when disabled prop is true', () => {
    render(<<%= componentName %> label="Click me" disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
