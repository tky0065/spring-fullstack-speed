import { describe, expect, test, jest } from '@jest/globals';
import {
  isFrontend,
  isDatabase,
  isBuildTool,
  hasFeature,
  hasAuth,
  not,
  and,
  or,
  evaluateCondition,
  addConditionalHelpersToContext
} from '../conditional-rendering.js';
import { FRONTEND_OPTIONS, DATABASE_OPTIONS, BUILD_TOOL_OPTIONS, ADDITIONAL_FEATURES } from '../config.js';

describe('Conditional Rendering Utils', () => {
  const mockConfig = {
    appName: 'test-app',
    packageName: 'com.example.test',
    buildTool: BUILD_TOOL_OPTIONS.MAVEN,
    frontendFramework: FRONTEND_OPTIONS.REACT_INERTIA,
    database: DATABASE_OPTIONS.POSTGRESQL,
    includeAuth: true,
    additionalFeatures: [
      ADDITIONAL_FEATURES.OPENAPI,
      ADDITIONAL_FEATURES.DOCKER
    ],
    serverPort: 8080,
    javaVersion: '17',
    springBootVersion: '3.2.0',
    nodeVersion: '20.10.0',
    npmVersion: '10.2.3',
  };

  describe('Basic conditions', () => {
    test('isFrontend devrait retourner true quand le framework frontend correspond', () => {
      expect(evaluateCondition(isFrontend(FRONTEND_OPTIONS.REACT_INERTIA), mockConfig)).toBe(true);
      expect(evaluateCondition(isFrontend(FRONTEND_OPTIONS.ANGULAR), mockConfig)).toBe(false);
    });

    test('isDatabase devrait retourner true quand la base de données correspond', () => {
      expect(evaluateCondition(isDatabase(DATABASE_OPTIONS.POSTGRESQL), mockConfig)).toBe(true);
      expect(evaluateCondition(isDatabase(DATABASE_OPTIONS.MYSQL), mockConfig)).toBe(false);
    });

    test('isBuildTool devrait retourner true quand l\'outil de build correspond', () => {
      expect(evaluateCondition(isBuildTool(BUILD_TOOL_OPTIONS.MAVEN), mockConfig)).toBe(true);
      expect(evaluateCondition(isBuildTool(BUILD_TOOL_OPTIONS.GRADLE), mockConfig)).toBe(false);
    });

    test('hasFeature devrait retourner true quand la fonctionnalité est présente', () => {
      expect(evaluateCondition(hasFeature(ADDITIONAL_FEATURES.OPENAPI), mockConfig)).toBe(true);
      expect(evaluateCondition(hasFeature(ADDITIONAL_FEATURES.WEBSOCKET), mockConfig)).toBe(false);
    });

    test('hasAuth devrait retourner true quand l\'authentification est activée', () => {
      expect(evaluateCondition(hasAuth(), mockConfig)).toBe(true);
      expect(evaluateCondition(hasAuth(), { ...mockConfig, includeAuth: false })).toBe(false);
    });
  });

  describe('Logical operators', () => {
    test('not devrait inverser le résultat d\'une condition', () => {
      expect(evaluateCondition(not(isFrontend(FRONTEND_OPTIONS.REACT_INERTIA)), mockConfig)).toBe(false);
      expect(evaluateCondition(not(isFrontend(FRONTEND_OPTIONS.ANGULAR)), mockConfig)).toBe(true);
    });

    test('and devrait retourner true uniquement si toutes les conditions sont vraies', () => {
      expect(evaluateCondition(
        and(
          isFrontend(FRONTEND_OPTIONS.REACT_INERTIA),
          isDatabase(DATABASE_OPTIONS.POSTGRESQL)
        ),
        mockConfig
      )).toBe(true);

      expect(evaluateCondition(
        and(
          isFrontend(FRONTEND_OPTIONS.REACT_INERTIA),
          isDatabase(DATABASE_OPTIONS.MYSQL)
        ),
        mockConfig
      )).toBe(false);
    });

    test('or devrait retourner true si au moins une condition est vraie', () => {
      expect(evaluateCondition(
        or(
          isFrontend(FRONTEND_OPTIONS.REACT_INERTIA),
          isDatabase(DATABASE_OPTIONS.MYSQL)
        ),
        mockConfig
      )).toBe(true);

      expect(evaluateCondition(
        or(
          isFrontend(FRONTEND_OPTIONS.ANGULAR),
          isDatabase(DATABASE_OPTIONS.MYSQL)
        ),
        mockConfig
      )).toBe(false);
    });
  });

  describe('Template helpers', () => {
    test('addConditionalHelpersToContext devrait ajouter des helpers conditionnels au contexte', () => {
      const baseContext = {};
      const enrichedContext = addConditionalHelpersToContext(baseContext, mockConfig);

      expect(typeof enrichedContext.if_frontend).toBe('function');
      expect(typeof enrichedContext.if_database).toBe('function');
      expect(typeof enrichedContext.if_build_tool).toBe('function');
      expect(typeof enrichedContext.if_has_feature).toBe('function');
      expect(typeof enrichedContext.if_has_auth).toBe('function');
    });

    test('if_frontend devrait renvoyer le contenu correct selon le frontend', () => {
      const baseContext = {};
      const enrichedContext = addConditionalHelpersToContext(baseContext, mockConfig);

      expect(enrichedContext.if_frontend(FRONTEND_OPTIONS.REACT_INERTIA, 'match', 'no match')).toBe('match');
      expect(enrichedContext.if_frontend(FRONTEND_OPTIONS.ANGULAR, 'match', 'no match')).toBe('no match');
    });

    test('if_database devrait renvoyer le contenu correct selon la base de données', () => {
      const baseContext = {};
      const enrichedContext = addConditionalHelpersToContext(baseContext, mockConfig);

      expect(enrichedContext.if_database(DATABASE_OPTIONS.POSTGRESQL, 'match', 'no match')).toBe('match');
      expect(enrichedContext.if_database(DATABASE_OPTIONS.MYSQL, 'match', 'no match')).toBe('no match');
    });
  });
});
