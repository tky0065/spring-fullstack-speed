import { validateJavaPackageName, validateJavaClassName, validateAppName } from '../validation.js';

describe('Validation Utils', () => {
  describe('validateJavaPackageName', () => {
    test('should accept valid Java package names', () => {
      expect(validateJavaPackageName('com.example.app')).toBe(true);
      expect(validateJavaPackageName('org.springframework')).toBe(true);
      expect(validateJavaPackageName('io.github.user.project')).toBe(true);
    });

    test('should reject invalid Java package names', () => {
      expect(validateJavaPackageName('Com.example.app')).not.toBe(true);
      expect(validateJavaPackageName('com.example.')).not.toBe(true);
      expect(validateJavaPackageName('com..example')).not.toBe(true);
      expect(validateJavaPackageName('1com.example')).not.toBe(true);
      expect(validateJavaPackageName('com.example-app')).not.toBe(true);
      expect(validateJavaPackageName('')).not.toBe(true);
    });
  });

  describe('validateJavaClassName', () => {
    test('should accept valid Java class names', () => {
      expect(validateJavaClassName('User')).toBe(true);
      expect(validateJavaClassName('UserService')).toBe(true);
      expect(validateJavaClassName('User123')).toBe(true);
      expect(validateJavaClassName('User_Service')).toBe(true);
    });

    test('should reject invalid Java class names', () => {
      expect(validateJavaClassName('user')).not.toBe(true);
      expect(validateJavaClassName('123User')).not.toBe(true);
      expect(validateJavaClassName('User-Service')).not.toBe(true);
      expect(validateJavaClassName('')).not.toBe(true);
    });
  });

  describe('validateAppName', () => {
    test('should accept valid application names', () => {
      expect(validateAppName('my-app')).toBe(true);
      expect(validateAppName('app123')).toBe(true);
      expect(validateAppName('a')).toBe(true);
    });

    test('should reject invalid application names', () => {
      expect(validateAppName('My-app')).not.toBe(true);
      expect(validateAppName('app_123')).not.toBe(true);
      expect(validateAppName('-app')).not.toBe(true);
      expect(validateAppName('123app')).not.toBe(true);
      expect(validateAppName('')).not.toBe(true);
    });
  });
});
