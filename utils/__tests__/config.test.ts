import { describe, expect, test } from '@jest/globals';
import {
  validateConfig,
  extendConfig,
  DEFAULT_CONFIG,
  DATABASE_OPTIONS,
  FRONTEND_OPTIONS,
  BUILD_TOOL_OPTIONS,
  ADDITIONAL_FEATURES,
} from '../config.js';

describe('Configuration Utils', () => {
  describe('validateConfig', () => {
    test('devrait retourner la configuration par défaut pour un objet vide', () => {
      const validatedConfig = validateConfig({});
      expect(validatedConfig).toEqual(DEFAULT_CONFIG);
    });

    test('devrait conserver les valeurs valides', () => {
      const userConfig = {
        appName: 'my-app',
        packageName: 'com.mycompany.app',
        buildTool: BUILD_TOOL_OPTIONS.GRADLE,
        database: DATABASE_OPTIONS.MYSQL,
      };

      const validatedConfig = validateConfig(userConfig);

      expect(validatedConfig.appName).toBe('my-app');
      expect(validatedConfig.packageName).toBe('com.mycompany.app');
      expect(validatedConfig.buildTool).toBe(BUILD_TOOL_OPTIONS.GRADLE);
      expect(validatedConfig.database).toBe(DATABASE_OPTIONS.MYSQL);
    });

    test('devrait remplacer les valeurs invalides par les valeurs par défaut', () => {
      const userConfig = {
        buildTool: 'invalidBuildTool',
        frontendFramework: 'invalidFramework',
        database: 'invalidDB',
        additionalFeatures: ['invalidFeature', ADDITIONAL_FEATURES.DOCKER],
      } as any;

      const validatedConfig = validateConfig(userConfig);

      expect(validatedConfig.buildTool).toBe(DEFAULT_CONFIG.buildTool);
      expect(validatedConfig.frontendFramework).toBe(DEFAULT_CONFIG.frontendFramework);
      expect(validatedConfig.database).toBe(DEFAULT_CONFIG.database);
      expect(validatedConfig.additionalFeatures).toContain(ADDITIONAL_FEATURES.DOCKER);
      expect(validatedConfig.additionalFeatures).not.toContain('invalidFeature');
    });
  });

  describe('extendConfig', () => {
    test('devrait fusionner la configuration de base avec les options avancées', () => {
      const baseConfig = {
        ...DEFAULT_CONFIG,
        appName: 'test-app',
      };

      const advancedOptions = {
        dockerOptions: {
          baseImage: 'custom-image',
          exposePort: 3000,
        },
        testOptions: {
          useTestcontainers: true,
        },
      };

      const extendedConfig = extendConfig(baseConfig, advancedOptions);

      expect(extendedConfig.appName).toBe('test-app');
      expect(extendedConfig.advancedConfig!.dockerOptions.baseImage).toBe('custom-image');
      expect(extendedConfig.advancedConfig!.dockerOptions.exposePort).toBe(3000);
      expect(extendedConfig.advancedConfig!.testOptions.useTestcontainers).toBe(true);

      // Vérifier que les autres options avancées par défaut sont préservées
      expect(extendedConfig.advancedConfig!.testOptions.useJUnit5).toBe(true);
    });
  });

  describe('Configuration constants', () => {
    test('DATABASE_OPTIONS devrait contenir les options de base de données supportées', () => {
      expect(DATABASE_OPTIONS).toHaveProperty('MYSQL');
      expect(DATABASE_OPTIONS).toHaveProperty('POSTGRESQL');
      expect(DATABASE_OPTIONS).toHaveProperty('MONGODB');
      expect(DATABASE_OPTIONS).toHaveProperty('H2');
    });

    test('FRONTEND_OPTIONS devrait contenir les options de frameworks frontend supportés', () => {
      expect(FRONTEND_OPTIONS).toHaveProperty('REACT_INERTIA');
      expect(FRONTEND_OPTIONS).toHaveProperty('VUE_INERTIA');
      expect(FRONTEND_OPTIONS).toHaveProperty('ANGULAR');
      expect(FRONTEND_OPTIONS).toHaveProperty('THYMELEAF');
      expect(FRONTEND_OPTIONS).toHaveProperty('JTE');
      expect(FRONTEND_OPTIONS).toHaveProperty('NONE');
    });

    test('BUILD_TOOL_OPTIONS devrait contenir les options d\'outils de build supportés', () => {
      expect(BUILD_TOOL_OPTIONS).toHaveProperty('MAVEN');
      expect(BUILD_TOOL_OPTIONS).toHaveProperty('GRADLE');
    });

    test('ADDITIONAL_FEATURES devrait contenir les fonctionnalités additionnelles disponibles', () => {
      expect(ADDITIONAL_FEATURES).toHaveProperty('OPENAPI');
      expect(ADDITIONAL_FEATURES).toHaveProperty('DOCKER');
      expect(ADDITIONAL_FEATURES).toHaveProperty('TESTS');
      expect(ADDITIONAL_FEATURES).toHaveProperty('WEBSOCKET');
      expect(ADDITIONAL_FEATURES).toHaveProperty('REDIS');
    });
  });
});
