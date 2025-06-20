import { <%= utilName %> } from '../<%= utilName %>';

describe('<%= utilName %> utility', () => {
  test('should format date correctly', () => {
    // Assuming formatDate is a function in the utility
    const date = new Date('2023-06-20T12:00:00Z');
    expect(<%= utilName %>.formatDate(date)).toBe('20/06/2023');
  });

  test('should format currency correctly', () => {
    // Assuming formatCurrency is a function in the utility
    expect(<%= utilName %>.formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('should truncate long text', () => {
    // Assuming truncateText is a function in the utility
    const longText = 'This is a very long text that should be truncated';
    expect(<%= utilName %>.truncateText(longText, 20)).toBe('This is a very long...');
  });

  test('should validate email address', () => {
    // Assuming validateEmail is a function in the utility
    expect(<%= utilName %>.validateEmail('test@example.com')).toBe(true);
    expect(<%= utilName %>.validateEmail('invalid-email')).toBe(false);
  });

  test('should handle empty values gracefully', () => {
    expect(<%= utilName %>.formatDate(null)).toBe('');
    expect(<%= utilName %>.formatCurrency(null)).toBe('$0.00');
    expect(<%= utilName %>.truncateText('', 10)).toBe('');
    expect(<%= utilName %>.validateEmail('')).toBe(false);
  });
});
