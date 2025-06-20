import { <%= pipeName %>Pipe } from './<%= pipeName.toLowerCase() %>.pipe';

describe('<%= pipeName %>Pipe', () => {
  let pipe: <%= pipeName %>Pipe;

  beforeEach(() => {
    pipe = new <%= pipeName %>Pipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format date correctly with default format', () => {
    const date = new Date('2023-06-20T12:00:00Z');
    expect(pipe.transform(date)).toBe('20/06/2023');
  });

  it('should format date with custom format', () => {
    const date = new Date('2023-06-20T12:00:00Z');
    expect(pipe.transform(date, 'yyyy-MM-dd')).toBe('2023-06-20');
  });

  it('should handle null or undefined values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should handle invalid date values', () => {
    expect(pipe.transform('not-a-date')).toBe('Invalid date');
  });

  it('should format date with time when showTime is true', () => {
    const date = new Date('2023-06-20T12:34:56Z');
    expect(pipe.transform(date, 'dd/MM/yyyy', true)).toContain('12:34');
  });

  it('should respect locale settings', () => {
    const date = new Date('2023-06-20T12:00:00Z');
    expect(pipe.transform(date, 'dd/MM/yyyy', false, 'fr-FR')).toBe('20/06/2023');
    expect(pipe.transform(date, 'MM/dd/yyyy', false, 'en-US')).toBe('06/20/2023');
  });
});
