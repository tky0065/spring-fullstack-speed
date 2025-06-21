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
 * Nombre d'éléments par page dans les menus CLI
 */
export const COMMAND_PAGE_SIZE = 10;

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
  authType: 'JWT',
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
 * Configuration globale pour les templates et la génération
 */
export interface GlobalConfig {
  frontendFramework: string;
  database: string;
  buildTool: string;
  includeAuth: boolean;
  authType: string;
  additionalFeatures: string[];
  [key: string]: any;
}

/**
 * Configuration par défaut pour la génération
 */
const defaultGlobalConfig: GlobalConfig = {
  frontendFramework: FRONTEND_OPTIONS.REACT_INERTIA,
  database: DATABASE_OPTIONS.H2,
  buildTool: BUILD_TOOL_OPTIONS.MAVEN,
  includeAuth: true,
  authType: 'JWT',
  additionalFeatures: ['openapi', 'tests'],
};

// Stocke la configuration courante
let currentConfig: GlobalConfig = { ...defaultGlobalConfig };

/**
 * Définit la configuration globale
 * @param config La configuration à utiliser
 */
export function setGlobalConfig(config: Partial<GlobalConfig>): void {
  currentConfig = { ...defaultGlobalConfig, ...config };
}

/**
 * Récupère la configuration globale
 * @returns La configuration globale courante
 */
export function getGlobalConfig(): GlobalConfig {
  return currentConfig;
}

/**
 * Réinitialise la configuration globale aux valeurs par défaut
 */
export function resetGlobalConfig(): void {
  currentConfig = { ...defaultGlobalConfig };
}

/**
 * Valide la configuration fournie
 * @param config Configuration à valider
 * @returns Configuration validée (avec valeurs par défaut pour les propriétés manquantes)
 */
export function validateConfig(config: Partial<GlobalConfig>): GlobalConfig {
  // Obtenir toutes les valeurs valides pour les fonctionnalités additionnelles
  const validAdditionalFeatures = Object.values(ADDITIONAL_FEATURES);

  // Filtrer les fonctionnalités invalides si elles existent
  const filteredAdditionalFeatures = config.additionalFeatures
    ? config.additionalFeatures.filter(feature => validAdditionalFeatures.includes(feature))
    : [...DEFAULT_CONFIG.additionalFeatures]; // Utiliser les valeurs par défaut si aucune n'est fournie

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
    authType: config.authType || 'JWT', // Assure que authType est toujours défini
    // Remplacer le tableau de fonctionnalités additionnelles par la version filtrée
    additionalFeatures: filteredAdditionalFeatures,
    // Autres validations si nécessaire
  };
}

/**
 * Fusionne récursivement deux objets
 * @param target Objet cible
 * @param source Objet source
 * @returns Objet fusionné
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
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
    advancedConfig: deepMerge(ADVANCED_CONFIG, advancedConfig),
  };
}
