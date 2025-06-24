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
  // Toujours générer les fichiers Docker de base, même si l'option n'est pas explicitement sélectionnée
  const dockerEnabled = templateData.additionalFeatures && templateData.additionalFeatures.includes('docker');

  if (!dockerEnabled) {
    generator.log(chalk.yellow("Docker n'est pas explicitement activé, mais les fichiers de base seront quand même générés."));
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
    // Contenu du Dockerfile principal (multi-étages optimisé)
    const dockerfileBackendContent = `FROM eclipse-temurin:${templateData.javaVersion || '21'}-jdk-alpine as build

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

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
`;

    // Contenu du docker-compose.yml
    const dockerComposeContent = `version: '3.8'

services:
  app:
    build: .
    container_name: ${templateData.appName}-api
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod${templateData.database === 'PostgreSQL' ? `
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${templateData.appName}
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=postgres` : templateData.database === 'MySQL' ? `
      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/${templateData.appName}?useSSL=false
      - SPRING_DATASOURCE_USERNAME=mysql
      - SPRING_DATASOURCE_PASSWORD=mysql` : ''}
    depends_on:${templateData.database !== 'H2' ? `
      - db` : ''}${templateData.additionalFeatures?.includes('redis') ? `
      - redis` : ''}

${templateData.database === 'PostgreSQL' ? `  db:
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
` : templateData.database === 'MySQL' ? `  db:
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
` : ''}${templateData.additionalFeatures?.includes('redis') ? `  redis:
    image: redis:alpine
    container_name: ${templateData.appName}-redis
    ports:
      - "6379:6379"
` : ''}${templateData.frontendFramework && templateData.frontendFramework !== 'Aucun (API seulement)' ? `
  frontend:
    build: ./frontend
    container_name: ${templateData.appName}-frontend
    ports:
      - "80:80" 
    depends_on:
      - app
` : ''}
${(templateData.database === 'PostgreSQL' || templateData.database === 'MySQL') ? 'volumes:' : ''}${templateData.database === 'PostgreSQL' ? `
  postgres_data:` : templateData.database === 'MySQL' ? `
  mysql_data:` : ''}`;

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
      generator.fs.write(
        generator.destinationPath(`frontend/Dockerfile`),
        dockerfileFrontendContent
      );
    }

    // Création d'un fichier .dockerignore
    const dockerignoreContent = `
# Fichiers et répertoires à ignorer lors de la création d'une image Docker

# Répertoires de build et dépendances
target/
node_modules/
dist/
build/

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

    generator.log(chalk.green("✅ Fichiers Docker générés avec succès"));

    // Copier les fichiers docker-compose spécifiques depuis les templates
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
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Docker: ${error}`));
  }
}

/**
 * Renvoie le contenu d'un Dockerfile pour le frontend en fonction du framework utilisé
 * @param frontendFramework Le framework frontend utilisé (React, Vue, Angular)
 * @returns Le contenu du Dockerfile
 */
function getFrontendDockerfile(frontendFramework: string): string {
  const framework = frontendFramework.toLowerCase();

  if (framework === 'angular') {
    return `# Étape 1: Build de l'application Angular
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist/* /usr/share/nginx/html/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else if (framework === 'react') {
    return `# Étape 1: Build de l'application React
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else if (framework === 'vue.js' || framework === 'vue') {
    return `# Étape 1: Build de l'application Vue
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
  else {
    // Framework générique
    return `# Étape 1: Build de l'application frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2: Image de production avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
  }
}
