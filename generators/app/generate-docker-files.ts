import { TemplateData } from './generator-methods.js';
import { ensureDirectoryExists } from './ensure-dir-exists.js';
import chalk from 'chalk';
import fs from 'fs';

/**
 * Génère les fichiers Docker si demandé
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateDockerFiles(generator: any, templateData: TemplateData) {
  // Vérifier si l'option Docker est explicitement activée
  const dockerEnabled = templateData.additionalFeatures?.includes('docker');

  if (!dockerEnabled) {
    generator.log(chalk.yellow("Docker n'est pas activé, ignorant la génération des fichiers Docker."));
    return; // Sortir de la fonction si Docker n'est pas activé
  }

  generator.log(chalk.blue("Génération des fichiers Docker..."));

  // Création des répertoires nécessaires pour Docker
  const dockerDirs = [
    "docker",
    "docker/dev",
    "nginx",
    "nginx/conf",
    "nginx/certs",
    "nginx/logs"
  ];

  dockerDirs.forEach(dir => {
    ensureDirectoryExists(generator, dir);
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  try {
    // Générer le contenu du Dockerfile en fonction de l'outil de build (Maven ou Gradle)
    const dockerfileBackendContent = templateData.buildTool.toLowerCase() === 'maven'
      ? generateMavenDockerfile(templateData)
      : generateGradleDockerfile(templateData);

    // Générer le contenu du docker-compose.yml en fonction des choix de l'utilisateur
    const dockerComposeContent = generateDockerComposeContent(templateData);

    // Création du Dockerfile
    generator.fs.write(
      generator.destinationPath(`Dockerfile`),
      dockerfileBackendContent
    );

    // Création du docker-compose.yml
    generator.fs.write(
      generator.destinationPath(`docker-compose.yml`),
      dockerComposeContent
    );

    // Ajouter un dockerfile pour le frontend si nécessaire
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      const dockerfileFrontendContent = getFrontendDockerfile(templateData.frontendFramework);

      // Créer le répertoire frontend s'il n'existe pas
      ensureDirectoryExists(generator, 'frontend');

      generator.fs.write(
        generator.destinationPath(`frontend/Dockerfile`),
        dockerfileFrontendContent
      );

      // Générer une configuration Nginx adaptée au framework frontend
      generateNginxConfig(generator, templateData);
    }

    // Création d'un fichier .dockerignore
    const dockerignoreContent = `
# Fichiers et répertoires à ignorer lors de la création d'une image Docker

# Répertoires de build et dépendances
target/
node_modules/
dist/
build/
.gradle/
gradle/
gradlew
gradlew.bat

# Fichiers d'environnement et secrets
.env
*.env
.env.*
*.key
*.pem

# Fichiers de log et caches
*.log
logs/
.gradle/
.idea/
.vscode/
.mvn/wrapper/maven-wrapper.jar

# Autres fichiers système
.DS_Store
Thumbs.db
`;

    generator.fs.write(
      generator.destinationPath(`.dockerignore`),
      dockerignoreContent
    );

    // Générer les fichiers docker-compose spécifiques pour les environnements
    generateEnvSpecificDockerComposeFiles(generator, templateData);

    generator.log(chalk.green("✅ Fichiers Docker générés avec succès"));

  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Docker: ${error}`));
  }
}

/**
 * Génère les fichiers docker-compose spécifiques pour les environnements (dev, prod)
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
function generateEnvSpecificDockerComposeFiles(generator: any, templateData: TemplateData) {
  try {
    // Vérifier si les templates existent
    const dockerComposeTemplate = generator.templatePath('docker/docker-compose.yml.ejs');
    const dockerComposeDevTemplate = generator.templatePath('docker/docker-compose.dev.yml.ejs');
    const dockerComposeProdTemplate = generator.templatePath('docker/docker-compose.prod.yml.ejs');

    // Copier les fichiers s'ils existent
    if (fs.existsSync(dockerComposeTemplate)) {
      generator.fs.copyTpl(
        dockerComposeTemplate,
        generator.destinationPath('docker-compose.yml'),
        templateData
      );
      generator.log(chalk.green("✅ Fichier docker-compose.yml généré depuis le template"));
    }

    if (fs.existsSync(dockerComposeDevTemplate)) {
      generator.fs.copyTpl(
        dockerComposeDevTemplate,
        generator.destinationPath('docker-compose.dev.yml'),
        templateData
      );
      generator.log(chalk.green("✅ Fichier docker-compose.dev.yml généré depuis le template"));
    }

    if (fs.existsSync(dockerComposeProdTemplate)) {
      generator.fs.copyTpl(
        dockerComposeProdTemplate,
        generator.destinationPath('docker-compose.prod.yml'),
        templateData
      );
      generator.log(chalk.green("✅ Fichier docker-compose.prod.yml généré depuis le template"));
    }
  } catch (error) {
    generator.log(chalk.yellow(`⚠️ Erreur lors de la génération des fichiers docker-compose spécifiques: ${error}`));
  }
}

/**
 * Génère le contenu du Dockerfile pour une application Maven
 * @param templateData Les données pour la génération
 * @returns Le contenu du Dockerfile
 */
function generateMavenDockerfile(templateData: TemplateData): string {
  return `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine as build

WORKDIR /workspace/app

# Copie des fichiers Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

# Nettoyage des fichiers de script
RUN chmod +x ./mvnw
RUN dos2unix ./mvnw || true

# Construction de l'application
RUN ./mvnw install -DskipTests

# Image finale avec moins de couches
FROM eclipse-temurin:${templateData.javaVersion || '21'}-jre-alpine

VOLUME /tmp
WORKDIR /app

# Copie de l'application à partir de l'image de build
COPY --from=build /workspace/app/target/*.jar app.jar

# Configuration de l'application
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]`;
}

/**
 * Génère le contenu du Dockerfile pour une application Gradle
 * @param templateData Les données pour la génération
 * @returns Le contenu du Dockerfile
 */
function generateGradleDockerfile(templateData: TemplateData): string {
  return `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine as build

WORKDIR /workspace/app

# Copie des fichiers Gradle
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY src src

# Nettoyage des fichiers de script
RUN chmod +x ./gradlew
RUN dos2unix ./gradlew || true

# Construction de l'application
RUN ./gradlew bootJar --no-daemon

# Image finale avec moins de couches
FROM eclipse-temurin:${templateData.javaVersion || '21'}-jre-alpine

VOLUME /tmp
WORKDIR /app

# Copie de l'application à partir de l'image de build
COPY --from=build /workspace/app/build/libs/*.jar app.jar

# Configuration de l'application
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]`;
}

/**
 * Génère le contenu du docker-compose.yml en fonction des choix de l'utilisateur
 * @param templateData Les données pour la génération
 * @returns Le contenu du docker-compose.yml
 */
function generateDockerComposeContent(templateData: TemplateData): string {
  let content = `version: '3.8'

services:
  app:
    build: .
    container_name: ${templateData.appName}-api
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod\n`;

  // Ajouter la configuration de la base de données
  if (templateData.database && templateData.database !== 'H2') {
    content += generateDatabaseEnvironment(templateData);
  }

  // Ajouter les dépendances
  content += `    depends_on:`;

  if (templateData.database && templateData.database !== 'H2') {
    content += `\n      - db`;
  }

  if (templateData.additionalFeatures?.includes('redis')) {
    content += `\n      - redis`;
  }

  if (templateData.additionalFeatures?.includes('elasticsearch')) {
    content += `\n      - elasticsearch`;
  }

  if (templateData.additionalFeatures?.includes('kafka')) {
    content += `\n      - kafka`;
    content += `\n      - zookeeper`;
  }

  if (templateData.additionalFeatures?.includes('rabbitmq')) {
    content += `\n      - rabbitmq`;
  }

  content += `\n\n`;

  // Ajouter la configuration de la base de données
  if (templateData.database === 'PostgreSQL') {
    content += generatePostgreSQLService(templateData);
  } else if (templateData.database === 'MySQL') {
    content += generateMySQLService(templateData);
  } else if (templateData.database === 'MongoDB') {
    content += generateMongoDBService(templateData);
  }

  // Ajouter les services additionnels
  if (templateData.additionalFeatures?.includes('redis')) {
    content += generateRedisService(templateData);
  }

  if (templateData.additionalFeatures?.includes('elasticsearch')) {
    content += generateElasticsearchService(templateData);
  }

  if (templateData.additionalFeatures?.includes('kafka')) {
    content += generateKafkaService(templateData);
  }

  if (templateData.additionalFeatures?.includes('rabbitmq')) {
    content += generateRabbitMQService(templateData);
  }

  // Ajouter la configuration du frontend
  if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
    content += generateFrontendService(templateData);
  }

  // Ajouter les volumes à la fin
  content += generateVolumes(templateData);

  return content;
}

/**
 * Génère les variables d'environnement pour la connexion à la base de données
 * @param templateData Les données pour la génération
 * @returns Les variables d'environnement pour la base de données
 */
function generateDatabaseEnvironment(templateData: TemplateData): string {
  if (templateData.database === 'PostgreSQL') {
    return `      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${templateData.appName}
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres\n`;
  } else if (templateData.database === 'MySQL') {
    return `      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/${templateData.appName}?useSSL=false
      - SPRING_DATASOURCE_USERNAME=mysql
      - SPRING_DATASOURCE_PASSWORD=mysql\n`;
  } else if (templateData.database === 'MongoDB') {
    return `      - SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/${templateData.appName}\n`;
  }
  return '';
}

/**
 * Génère la configuration du service PostgreSQL
 * @param templateData Les données pour la génération
 * @returns La configuration du service PostgreSQL
 */
function generatePostgreSQLService(templateData: TemplateData): string {
  return `  db:
    image: postgres:16-alpine
    container_name: ${templateData.appName}-postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=${templateData.appName}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
\n`;
}

/**
 * Génère la configuration du service MySQL
 * @param templateData Les données pour la génération
 * @returns La configuration du service MySQL
 */
function generateMySQLService(templateData: TemplateData): string {
  return `  db:
    image: mysql:8.0
    container_name: ${templateData.appName}-mysql
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_DATABASE=${templateData.appName}
      - MYSQL_ROOT_PASSWORD=mysql
      - MYSQL_USER=mysql
      - MYSQL_PASSWORD=mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
\n`;
}

/**
 * Génère la configuration du service MongoDB
 * @param templateData Les données pour la génération
 * @returns La configuration du service MongoDB
 */
function generateMongoDBService(templateData: TemplateData): string {
  return `  db:
    image: mongo:6.0
    container_name: ${templateData.appName}-mongodb
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=${templateData.appName}
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
\n`;
}

/**
 * Génère la configuration du service Redis
 * @param templateData Les données pour la génération
 * @returns La configuration du service Redis
 */
function generateRedisService(templateData: TemplateData): string {
  return `  redis:
    image: redis:7-alpine
    container_name: ${templateData.appName}-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
\n`;
}

/**
 * Génère la configuration du service Elasticsearch
 * @param templateData Les données pour la génération
 * @returns La configuration du service Elasticsearch
 */
function generateElasticsearchService(templateData: TemplateData): string {
  return `  elasticsearch:
    image: elasticsearch:8.11.1
    container_name: ${templateData.appName}-elasticsearch
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200"]
      interval: 30s
      timeout: 10s
      retries: 3
\n`;
}

/**
 * Génère la configuration du service Kafka
 * @param templateData Les données pour la génération
 * @returns La configuration du service Kafka et Zookeeper
 */
function generateKafkaService(templateData: TemplateData): string {
  return `  zookeeper:
    image: bitnami/zookeeper:latest
    container_name: ${templateData.appName}-zookeeper
    ports:
      - "2181:2181"
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
    volumes:
      - zookeeper_data:/bitnami/zookeeper

  kafka:
    image: bitnami/kafka:latest
    container_name: ${templateData.appName}-kafka
    ports:
      - "9092:9092"
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      - ALLOW_PLAINTEXT_LISTENER=yes
    volumes:
      - kafka_data:/bitnami/kafka
    depends_on:
      - zookeeper
\n`;
}

/**
 * Génère la configuration du service RabbitMQ
 * @param templateData Les données pour la génération
 * @returns La configuration du service RabbitMQ
 */
function generateRabbitMQService(templateData: TemplateData): string {
  return `  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: ${templateData.appName}-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    environment:
      - RABBITMQ_DEFAULT_USER=guest
      - RABBITMQ_DEFAULT_PASS=guest
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5
\n`;
}

/**
 * Génère la configuration du service frontend
 * @param templateData Les données pour la génération
 * @returns La configuration du service frontend
 */
function generateFrontendService(templateData: TemplateData): string {
  return `  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ${templateData.appName}-frontend
    ports:
      - "80:80"
    depends_on:
      - app
\n`;
}

/**
 * Génère les volumes pour le docker-compose
 * @param templateData Les données pour la génération
 * @returns Les définitions de volumes
 */
function generateVolumes(templateData: TemplateData): string {
  const volumes:any = [];

  // Ajouter les volumes des bases de données
  if (templateData.database === 'PostgreSQL') {
    volumes.push('postgres_data');
  } else if (templateData.database === 'MySQL') {
    volumes.push('mysql_data');
  } else if (templateData.database === 'MongoDB') {
    volumes.push('mongodb_data');
  }

  // Ajouter les volumes des services additionnels
  if (templateData.additionalFeatures?.includes('redis')) {
    volumes.push('redis_data');
  }

  if (templateData.additionalFeatures?.includes('elasticsearch')) {
    volumes.push('elasticsearch_data');
  }

  if (templateData.additionalFeatures?.includes('kafka')) {
    volumes.push('kafka_data');
    volumes.push('zookeeper_data');
  }

  if (templateData.additionalFeatures?.includes('rabbitmq')) {
    volumes.push('rabbitmq_data');
  }

  if (volumes.length === 0) {
    return '';
  }

  let result = 'volumes:\n';
  volumes.forEach(volume => {
    result += `  ${volume}:\n`;
  });

  return result;
}

/**
 * Génère une configuration Nginx adaptée au framework frontend
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
function generateNginxConfig(generator: any, templateData: TemplateData): void {
  const framework = templateData.frontendFramework.toLowerCase();
  let nginxConfig;

  if (framework.includes('react') || framework.includes('vue')) {
    nginxConfig = `server {
    listen 80;
    server_name localhost;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to the backend
    location /api/ {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  } else if (framework.includes('angular')) {
    nginxConfig = `server {
    listen 80;
    server_name localhost;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to the backend
    location /api/ {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  } else {
    // Configuration générique pour d'autres frameworks
    nginxConfig = `server {
    listen 80;
    server_name localhost;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to the backend
    location /api/ {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  }

  ensureDirectoryExists(generator, 'frontend/nginx');
  generator.fs.write(
    generator.destinationPath('frontend/nginx/default.conf'),
    nginxConfig
  );
  generator.log(chalk.green("✅ Configuration Nginx générée pour le frontend"));
}

/**
 * Renvoie le contenu d'un Dockerfile pour le frontend en fonction du framework utilisé
 * @param frontendFramework Le framework frontend utilisé
 * @returns Le contenu du Dockerfile
 */
function getFrontendDockerfile(frontendFramework: string): string {
  const framework = frontendFramework.toLowerCase();

  if (framework === 'angular') {
    return `# Étape 1: Build de l'application Angular
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/* /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else if (framework.includes('react')) {
    return `# Étape 1: Build de l'application React
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else if (framework.includes('vue')) {
    return `# Étape 1: Build de l'application Vue
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else if (framework.includes('thymeleaf') || framework.includes('jte')) {
    // Pour Thymeleaf et JTE, pas besoin de frontend séparé car ils sont rendus côté serveur
    return `# Pas de Dockerfile séparé nécessaire pour ${frontendFramework}
# Thymeleaf/JTE est rendu côté serveur dans le conteneur Spring Boot principal

# Ce fichier est présent uniquement pour maintenir la structure de répertoire cohérente
FROM nginx:alpine
RUN echo "Ce conteneur n'est pas nécessaire pour ${frontendFramework} car il est rendu côté serveur." > /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else {
    // Framework générique
    return `# Étape 1: Build de l'application frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
}
