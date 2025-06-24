import { TemplateData } from './generator-methods.js';
import { ensureDirectoryExists } from './ensure-dir-exists.js';
import chalk from 'chalk';

/**
 * Génère les fichiers Docker si demandé
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateDockerFiles(generator: any, templateData: TemplateData) {
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
    // Contenu du Dockerfile principal (multi-étapes optimisé)
    const dockerfileBackendContent = `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine as build

WORKDIR /workspace/app

# Copie des fichiers Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Correction des permissions pour mvnw
RUN chmod +x ./mvnw

# Téléchargement des dépendances (mise en cache des couches)
RUN ./mvnw dependency:go-offline -B

# Copie du code source
COPY src src

# Construction du projet
RUN ./mvnw package -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

# Étape d'exécution avec JRE uniquement
FROM eclipse-temurin:${templateData.javaVersion || '21'}-jre-alpine

# Variables d'environnement
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""

# Ajout d'un utilisateur non-root pour la sécurité
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Configuration des volumes pour la persistence des données
VOLUME /tmp

# Copie des fichiers de l'étape de build
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build \${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build \${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build \${DEPENDENCY}/BOOT-INF/classes /app

# Configuration des healthchecks
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Exposition du port de l'application
EXPOSE 8080

# Point d'entrée pour l'application avec configuration de la mémoire
ENTRYPOINT ["java", "-cp", "app:app/lib/*", "${templateData.packageName}.${templateData.appNameFormatted || 'App'}Application"]`;

    generator.fs.write(
      generator.destinationPath("Dockerfile"),
      dockerfileBackendContent
    );

    // Génération du Dockerfile pour le frontend (si un frontend est inclus)
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      const frontendType = templateData.frontendFramework.toLowerCase();
      let frontendDockerfile = '';

      if (frontendType === 'react' || frontendType === 'vue' || frontendType === 'vue.js') {
        frontendDockerfile = `# Étape de build
FROM node:18-alpine AS build

WORKDIR /app

# Copie des fichiers package.json et installation des dépendances
COPY frontend/package*.json ./
RUN npm ci

# Copie des sources et build
COPY frontend/ .
RUN npm run build

# Étape de production avec Nginx
FROM nginx:stable-alpine

# Copie de la configuration Nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques du build
COPY --from=build /app/dist /usr/share/nginx/html

# Exposition du port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]`;
      } else if (frontendType === 'angular') {
        frontendDockerfile = `# Étape de build
FROM node:18-alpine AS build

WORKDIR /app

# Copie des fichiers package.json et installation des dépendances
COPY frontend/package*.json ./
RUN npm ci

# Copie des sources et build
COPY frontend/ .
RUN npm run build -- --configuration production

# Étape de production avec Nginx
FROM nginx:stable-alpine

# Copie de la configuration Nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques du build
COPY --from=build /app/dist/${templateData.appName}/browser /usr/share/nginx/html

# Exposition du port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]`;
      }

      if (frontendDockerfile) {
        generator.fs.write(
          generator.destinationPath("frontend/Dockerfile"),
          frontendDockerfile
        );
      }

      // Génération d'une configuration Nginx pour le frontend
      const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip configuration
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # Cache static assets
    location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|css|js|html)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Application routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://app:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}`;

      generator.fs.write(
        generator.destinationPath("frontend/nginx.conf"),
        nginxConf
      );
    }

    // Génération des Dockerfiles de développement
    // Backend dev Dockerfile
    const backendDevDockerfile = `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine

WORKDIR /app

# Installation des outils de développement
RUN apk add --no-cache curl jq bash

# Variables d'environnement
ENV SPRING_PROFILES_ACTIVE=dev
ENV JAVA_OPTS="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=*:5005"

# Expo du port de debug et de l'application
EXPOSE 8080 5005

# Copie de l'application
COPY target/*.jar app.jar

# Commande pour le hot-reload
CMD ["java", "-jar", "app.jar"]`;

    generator.fs.write(
      generator.destinationPath("docker/dev/Dockerfile.backend.dev"),
      backendDevDockerfile
    );

    // Frontend dev Dockerfile (si un frontend est inclus)
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      const frontendDevDockerfile = `FROM node:18-alpine

WORKDIR /app

# Installation des dépendances
COPY frontend/package*.json ./
RUN npm install

# Exposition du port de développement
EXPOSE 3000 5173

# Commande pour le serveur de développement avec hot-reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]`;

      generator.fs.write(
        generator.destinationPath("docker/dev/Dockerfile.frontend.dev"),
        frontendDevDockerfile
      );
    }

    // Génération des fichiers docker-compose

    // docker-compose.yml (principal)
    let dockerComposeYml = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:${templateData.database === 'PostgreSQL' ? 'postgresql' : templateData.database === 'MySQL' ? 'mysql' : 'h2:mem'}://${templateData.database === 'H2' ? '' : 'db/'}${templateData.appName.toLowerCase()}${templateData.database === 'H2' ? '' : '?useSSL=false'}
      - SPRING_DATASOURCE_USERNAME=user
      - SPRING_DATASOURCE_PASSWORD=password
    volumes:
      - app-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
`;

    // Ajouter le service de base de données selon le type de DB
    if (templateData.database === 'PostgreSQL') {
      dockerComposeYml += `
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${templateData.appName.toLowerCase()}
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user", "-d", "${templateData.appName.toLowerCase()}"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
    } else if (templateData.database === 'MySQL') {
      dockerComposeYml += `
  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=${templateData.appName.toLowerCase()}
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
      - MYSQL_ROOT_PASSWORD=rootpassword
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "user", "--password=password"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
    } else if (templateData.database !== 'H2') {
      dockerComposeYml += `
  db:
    image: mongo:5.0
    environment:
      - MONGO_INITDB_DATABASE=${templateData.appName.toLowerCase()}
      - MONGO_INITDB_ROOT_USERNAME=user
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - db-data:/data/db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
    }

    // Ajouter le service frontend si un framework frontend est inclus
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      dockerComposeYml += `
  frontend:
    build:
      context: ./frontend
    ports:
      - "80:80"
    depends_on:
      - app
    restart: unless-stopped
`;
    }

    // Définir les volumes
    dockerComposeYml += `
volumes:
  app-data:
    driver: local`;

    // Ajouter le volume pour la base de données si ce n'est pas H2
    if (templateData.database !== 'H2') {
      dockerComposeYml += `
  db-data:
    driver: local`;
    }

    generator.fs.write(
      generator.destinationPath("docker-compose.yml"),
      dockerComposeYml
    );

    // docker-compose.dev.yml (pour le développement)
    let dockerComposeDevYml = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/dev/Dockerfile.backend.dev
    ports:
      - "8080:8080"
      - "5005:5005"  # Expose debug port
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - JAVA_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=*:5005
    volumes:
      - ./:/app  # Mount project root for live reload
      - ~/.m2:/root/.m2  # Share Maven cache
    restart: unless-stopped
`;

    // Ajouter le service frontend dev si un framework frontend est inclus
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      const frontendDevPort = templateData.frontendFramework.toLowerCase() === 'react' || templateData.frontendFramework.toLowerCase() === 'vue' ? 5173 : 3000;
      dockerComposeDevYml += `
  frontend-dev:
    build:
      context: .
      dockerfile: docker/dev/Dockerfile.frontend.dev
    ports:
      - "${frontendDevPort}:${frontendDevPort}"
    volumes:
      - ./frontend:/app  # Mount frontend code for live reload
      - /app/node_modules  # Preserve node_modules
    environment:
      - NODE_ENV=development
    restart: unless-stopped
`;
    }

    generator.fs.write(
      generator.destinationPath("docker-compose.dev.yml"),
      dockerComposeDevYml
    );

    // docker-compose.prod.yml (pour la production)
    let dockerComposeProdYml = `version: '3.8'

services:
  app:
    image: ${templateData.appName.toLowerCase()}/backend:latest
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    deploy:
      replicas: 2
      restart_policy:
        condition: any
        max_attempts: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
`;

    // Ajouter le service frontend prod si un framework frontend est inclus
    if (templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)') {
      dockerComposeProdYml += `
  frontend:
    image: ${templateData.appName.toLowerCase()}/frontend:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: any
        max_attempts: 3
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
`;
    }

    generator.fs.write(
      generator.destinationPath("docker-compose.prod.yml"),
      dockerComposeProdYml
    );

    // Fichier .env pour les variables d'environnement Docker
    const envContent = `# Variables d'environnement pour Docker
# Base de données
DB_USERNAME=user
DB_PASSWORD=password
DB_ROOT_PASSWORD=rootpassword

# Ports de l'application
APP_PORT=80
APP_BACKEND_PORT=8080
APP_SSL_PORT=443

# Profil Spring
SPRING_PROFILES_ACTIVE=prod

# Options JVM
JAVA_OPTS=-Xmx512m -Xms256m
`;

    generator.fs.write(
      generator.destinationPath(".env"),
      envContent
    );

    generator.log(chalk.green("✅ Configuration Docker générée avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Docker: ${error}`));
    generator.log(chalk.yellow("⚠️ Tentative de récupération..."));

    // Génération de fichiers Docker minimaux en cas d'erreur
    try {
      const minimalDockerfile = `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

      generator.fs.write(
        generator.destinationPath("Dockerfile"),
        minimalDockerfile
      );

      const minimalDockerCompose = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
`;

      generator.fs.write(
        generator.destinationPath("docker-compose.yml"),
        minimalDockerCompose
      );

      generator.log(chalk.yellow("⚠️ Configuration Docker minimale générée après erreur."));
    } catch (fallbackError) {
      generator.log(chalk.red(`❌ Échec complet de la génération Docker: ${fallbackError}`));
    }
  }
}
