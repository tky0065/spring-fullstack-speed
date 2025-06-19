/**
 * Configuration globale pour le générateur Spring-Fullstack-Speed
 * Contient les variables par défaut et les options disponibles
 */

/**
 * Options de base de données supportées
 */
export const DATABASE_OPTIONS = {
  MYSQL: 'MySQL',
  POSTGRESQL: 'PostgreSQL',
  MONGODB: 'MongoDB',
  H2: 'H2',
};

/**
 * Options de frameworks frontend supportés
 */
export const FRONTEND_OPTIONS = {
  REACT_INERTIA: 'React avec Inertia.js',
  VUE_INERTIA: 'Vue.js avec Inertia.js',
  ANGULAR: 'Angular',
  THYMELEAF: 'Thymeleaf',
  JTE: 'JTE',
  NONE: 'Aucun (API seulement)',
};

/**
 * Options d'outils de build supportés
 */
export const BUILD_TOOL_OPTIONS = {
  MAVEN: 'Maven',
  GRADLE: 'Gradle',
};

/**
 * Fonctionnalités additionnelles disponibles
 */
export const ADDITIONAL_FEATURES = {
  OPENAPI: 'openapi',
  DOCKER: 'docker',
  TESTS: 'tests',
  WEBSOCKET: 'websocket',
  REDIS: 'redis',
  ELASTICSEARCH: 'elasticsearch',
  KAFKA: 'kafka',
  RABBITMQ: 'rabbitmq',
  GRAPHQL: 'graphql',
  PROMETHEUS: 'prometheus',
  AUTH_SOCIAL: 'auth-social',
  PWA: 'pwa',
};

/**
 * Configuration par défaut
 */
export const DEFAULT_CONFIG = {
  appName: 'sfs-app',
  packageName: 'com.example.app',
  buildTool: BUILD_TOOL_OPTIONS.MAVEN,
  frontendFramework: FRONTEND_OPTIONS.REACT_INERTIA,
  database: DATABASE_OPTIONS.POSTGRESQL,
  includeAuth: true,
  additionalFeatures: [
    ADDITIONAL_FEATURES.OPENAPI,
    ADDITIONAL_FEATURES.DOCKER,
    ADDITIONAL_FEATURES.TESTS,
  ],
  serverPort: 8080,
  javaVersion: '17',
  springBootVersion: '3.2.0',
  nodeVersion: '20.10.0',
  npmVersion: '10.2.3',
};

/**
 * Options de configuration avancées
 */
export const ADVANCED_CONFIG = {
  // Options de packaging
  packaging: {
    JAR: 'jar',
    WAR: 'war',
  },

  // Options JPA
  jpaOptions: {
    showSql: true,
    formatSql: true,
    ddlAuto: 'update',
  },

  // Options de sécurité
  securityOptions: {
    jwtExpirationMs: 86400000, // 24 heures
    rememberMeExpirationMs: 2592000000, // 30 jours
    passwordEncoder: 'bcrypt',
    allowRegistration: true,
  },

  // Options de cache
  cacheOptions: {
    type: 'caffeine', // Options: caffeine, redis, none
    timeToLiveSeconds: 3600,
    maximumSize: 1000,
  },

  // Options de tests
  testOptions: {
    useJUnit5: true,
    useMockito: true,
    useTestcontainers: false,
    useCucumber: false,
  },

  // Options Docker
  dockerOptions: {
    baseImage: 'eclipse-temurin:17-jre-focal',
    exposePort: 8080,
  },

  // Options du générateur
  generatorOptions: {
    overwriteFiles: false,
    createGitRepository: true,
    installDependencies: true,
  },
};

/**
 * Structure des options de configuration globale
 */
export interface GlobalConfig {
  appName: string;
  packageName: string;
  buildTool: string;
  frontendFramework: string;
  database: string;
  includeAuth: boolean;
  additionalFeatures: string[];
  serverPort: number;
  javaVersion: string;
  springBootVersion: string;
  nodeVersion: string;
  npmVersion: string;
  advancedConfig?: Record<string, any>;
}

/**
 * Valide la configuration fournie
 * @param config Configuration à valider
 * @returns Configuration validée (avec valeurs par défaut pour les propriétés manquantes)
 */
export function validateConfig(config: Partial<GlobalConfig>): GlobalConfig {
  // Valeurs par défaut pour les propriétés manquantes
  return {
    ...DEFAULT_CONFIG,
    ...config,
    // Vérification des valeurs valides
    buildTool: Object.values(BUILD_TOOL_OPTIONS).includes(config.buildTool || '')
      ? config.buildTool!
      : DEFAULT_CONFIG.buildTool,
    frontendFramework: Object.values(FRONTEND_OPTIONS).includes(config.frontendFramework || '')
      ? config.frontendFramework!
      : DEFAULT_CONFIG.frontendFramework,
    database: Object.values(DATABASE_OPTIONS).includes(config.database || '')
      ? config.database!
      : DEFAULT_CONFIG.database,
    additionalFeatures: config.additionalFeatures?.filter(feature =>
      Object.values(ADDITIONAL_FEATURES).includes(feature)
    ) || DEFAULT_CONFIG.additionalFeatures,
  };
}

/**
 * Étend la configuration avec des options avancées personnalisées
 * @param config Configuration de base
 * @param advancedConfig Configuration avancée (optionnelle)
 * @returns Configuration complète
 */
export function extendConfig(
  config: GlobalConfig,
  advancedConfig: Record<string, any> = {}
): GlobalConfig {
  return {
    ...config,
    advancedConfig: {
      ...ADVANCED_CONFIG,
      ...advancedConfig,
    },
  };
}
