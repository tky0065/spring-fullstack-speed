# Guide de dépannage (Troubleshooting)

Ce guide vous aide à résoudre les problèmes courants que vous pourriez rencontrer lors de l'utilisation de Spring-Fullstack-Speed (SFS).

## Table des matières

1. [Problèmes d'installation](#problèmes-dinstallation)
2. [Problèmes de génération](#problèmes-de-génération)
3. [Problèmes de compilation](#problèmes-de-compilation)
4. [Problèmes de base de données](#problèmes-de-base-de-données)
5. [Problèmes frontend](#problèmes-frontend)
6. [Problèmes de sécurité](#problèmes-de-sécurité)
7. [Problèmes de déploiement](#problèmes-de-déploiement)
8. [Utilisation de l'outil de diagnostic](#utilisation-de-loutil-de-diagnostic)

## Problèmes d'installation

### npm ERR! code EACCES: Permission denied

**Problème**: Permissions insuffisantes lors de l'installation globale.

**Solution**:
```bash
# Option 1: Utiliser sudo (non recommandé)
sudo npm install -g @enokdev/spring-fullstack-speed

# Option 2: Corriger les permissions npm (recommandé)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g @enokdev/spring-fullstack-speed
```

### npm ERR! code ENOENT: No such file or directory

**Problème**: Répertoire corrompu ou inexistant.

**Solution**:
```bash
# Nettoyer le cache npm
npm cache clean --force

# Réinstaller
npm install -g @enokdev/spring-fullstack-speed
```

### Commande 'sfs' non reconnue

**Problème**: Le chemin de l'exécutable n'est pas dans le PATH.

**Solution**:
```bash
# Vérifier l'installation
npm list -g @enokdev/spring-fullstack-speed

# Ajouter le répertoire bin de npm global au PATH
# Pour bash/zsh:
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc

# Pour Windows:
# Ajouter le chemin affiché par 'npm bin -g' aux variables d'environnement PATH
```

## Problèmes de génération

### Erreur: Le générateur n'a pas pu être trouvé

**Problème**: Le générateur spécifié n'existe pas ou n'est pas correctement installé.

**Solution**:
```bash
# Réinstaller SFS
npm uninstall -g @enokdev/spring-fullstack-speed
npm install -g @enokdev/spring-fullstack-speed

# Vérifier si le générateur existe
sfs --generators
```

### Erreur pendant la génération du projet

**Problème**: Conflits de fichiers ou problèmes de permissions.

**Solution**:
```bash
# Vérifier que le répertoire est vide ou ne contient pas de fichiers en conflit
mkdir fresh-project && cd fresh-project

# Exécuter avec l'option verbose pour voir les erreurs détaillées
sfs --verbose
```

### Erreur: Maximum call stack size exceeded

**Problème**: Boucle infinie dans le générateur ou templates corrompus.

**Solution**:
```bash
# Augmenter la taille de la pile Node.js
NODE_OPTIONS=--max-old-space-size=4096 sfs

# Si le problème persiste, réinstallez une version spécifique stable
npm install -g @enokdev/spring-fullstack-speed@1.2.3
```

### Erreur: Cannot read property 'X' of undefined

**Problème**: Problème de configuration ou valeur manquante.

**Solution**:
```bash
# Réinitialiser la configuration
rm -rf .yo-rc.json
sfs --reset-config

# Générer avec des options explicites
sfs --name=my-app --package=com.example.app --database=h2
```

## Problèmes de compilation

### Erreur: Could not find or load main class

**Problème**: Classe principale introuvable après la génération.

**Solution**:
```bash
# Reconstruire l'application
./mvnw clean install

# Vérifier le package et la classe principale
./mvnw spring-boot:run
```

### Erreur: Unsupported class file major version

**Problème**: Incompatibilité de version Java.

**Solution**:
```bash
# Vérifier la version Java utilisée
java -version

# Assurez-vous d'utiliser JDK 17+
# Sur macOS/Linux:
export JAVA_HOME=/path/to/jdk17
# Sur Windows:
# Définir la variable d'environnement JAVA_HOME

# Reconstruire avec la version correcte
./mvnw clean install -Djava.version=17
```

### Erreur: Failed to compile TypeScript

**Problème**: Erreurs TypeScript dans le frontend.

**Solution**:
```bash
# Aller dans le répertoire frontend
cd frontend

# Installer les dépendances manquantes
npm install

# Vérifier les erreurs TypeScript
npm run type-check

# Corriger les erreurs automatiquement si possible
npm run lint -- --fix
```

## Problèmes de base de données

### Erreur: Connection refused

**Problème**: La base de données n'est pas accessible.

**Solution**:
```bash
# Vérifier que la base de données est en cours d'exécution
# Pour MySQL
mysql -u root -p

# Vérifier les paramètres de connexion dans application.yml
cat src/main/resources/application.yml

# Démarrer la base de données si nécessaire 
# Par exemple avec Docker:
docker-compose up -d db
```

### Erreur: Table already exists

**Problème**: Conflit avec les migrations de base de données.

**Solution**:
```bash
# Pour Liquibase
./mvnw liquibase:dropAll
./mvnw liquibase:update

# Pour Flyway
./mvnw flyway:clean
./mvnw flyway:migrate
```

### Erreur: Schema validation failed

**Problème**: Le schéma JPA ne correspond pas au schéma de la base de données.

**Solution**:
```bash
# Option 1: Mettre à jour le schéma automatiquement (développement uniquement)
# Modifier application.yml:
# spring:
#   jpa:
#     hibernate:
#       ddl-auto: update

# Option 2: Générer un script de migration
./mvnw liquibase:diff
```

## Problèmes frontend

### Erreur: Module not found

**Problème**: Module npm manquant ou non installé.

**Solution**:
```bash
cd frontend
npm install
npm install missing-module-name --save
```

### Erreur: CORS policy: No 'Access-Control-Allow-Origin'

**Problème**: Configuration CORS incorrecte.

**Solution**:
```bash
# Vérifier la configuration CORS dans WebConfig.java
# Ajouter ou modifier:
@Bean
public CorsFilter corsFilter() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    config.addAllowedOrigin("http://localhost:3000");  // Origine frontend
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");
    source.registerCorsConfiguration("/api/**", config);
    return new CorsFilter(source);
}
```

### Erreur: JavaScript heap out of memory

**Problème**: Mémoire insuffisante pour la compilation frontend.

**Solution**:
```bash
# Augmenter la mémoire disponible pour Node.js
export NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### Les composants ne s'actualisent pas après modifications

**Problème**: Hot reload ne fonctionne pas correctement.

**Solution**:
```bash
# Pour React
touch src/index.tsx

# Redémarrer le serveur de développement
npm run dev

# Vérifier que la configuration de webpack est correcte
```

## Problèmes de sécurité

### Erreur: Invalid token

**Problème**: JWT mal configuré ou expiré.

**Solution**:
```bash
# Vérifier la configuration JWT dans application.yml
# spring:
#   security:
#     jwt:
#       secret: your-secret-key
#       expiration: 86400000  # 24 heures en millisecondes

# Assurez-vous que l'heure du serveur est correcte
date
```

### Erreur 403: Access Denied

**Problème**: Problèmes d'autorisation.

**Solution**:
```bash
# Vérifier les annotations de sécurité sur les contrôleurs
# Par exemple:
@PreAuthorize("hasRole('ADMIN')")

# Vérifier si l'utilisateur a les rôles appropriés
# Dans H2 console ou votre base de données:
SELECT * FROM user;
SELECT * FROM user_authority;
```

### Erreur: CSRF Token missing

**Problème**: Protection CSRF activée mais token manquant dans les requêtes.

**Solution**:
```bash
# Option 1: Inclure le token CSRF dans les requêtes frontend
# React:
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN'))
  .split('=')[1];

fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-XSRF-TOKEN': csrfToken
  }
});

# Option 2: Désactiver CSRF pour les API REST (si JWT est utilisé)
http.csrf(csrf -> csrf.disable())
```

## Problèmes de déploiement

### Erreur Docker: image not found

**Problème**: Image Docker non trouvée lors du déploiement.

**Solution**:
```bash
# Reconstruire l'image Docker
docker build -t my-app .

# Vérifier que l'image existe
docker images
```

### Erreur Kubernetes: ImagePullBackOff

**Problème**: Impossible de récupérer l'image Docker.

**Solution**:
```bash
# Vérifier que l'image est poussée vers le registre
docker push your-registry/my-app:latest

# Vérifier les secrets Kubernetes pour l'accès au registre
kubectl create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=user \
  --docker-password=pass
  
# Ajouter le secret au deployment
# Dans le fichier deployment.yml:
# imagePullSecrets:
# - name: regcred
```

### Erreur: Connection timed out pendant le déploiement

**Problème**: Problèmes réseau lors du déploiement.

**Solution**:
```bash
# Vérifier la connectivité réseau
ping your-server-ip

# Vérifier les règles de pare-feu
# Sur AWS:
aws ec2 describe-security-groups

# Sur GCP:
gcloud compute firewall-rules list
```

## Utilisation de l'outil de diagnostic

SFS inclut un outil de diagnostic puissant, `sfs doctor`, qui peut détecter et résoudre automatiquement de nombreux problèmes courants.

### Comment exécuter l'outil de diagnostic

```bash
# Exécuter le diagnostic
sfs doctor

# Corriger automatiquement les problèmes détectés
sfs doctor --fix

# Diagnostic détaillé
sfs doctor --verbose
```

### Problèmes détectés par l'outil de diagnostic

L'outil de diagnostic peut détecter et résoudre des problèmes tels que :

1. **Versions incompatibles** : Java, Node.js, npm, Maven ou Gradle
2. **Configurations incorrectes** : application.yml, pom.xml ou package.json
3. **Dépendances manquantes** : Spring Boot, React, Angular ou Vue
4. **Problèmes de structure de projet** : fichiers manquants ou mal placés
5. **Problèmes de compilation** : erreurs Java ou TypeScript
6. **Problèmes de base de données** : configuration de connexion ou migrations
7. **Problèmes Docker** : Dockerfile invalide ou docker-compose incorrect

### Exemple de sortie de diagnostic

```
🔍 Spring-Fullstack-Speed Doctor - v1.2.3

✓ Versions: Java 17, Node.js 18.12.0, npm 8.19.2
✓ Configuration du projet: Valide
✓ Structure des fichiers: OK
⚠ Base de données: MySQL n'est pas en cours d'exécution
  → Solution: Démarrer MySQL ou utiliser docker-compose up -d db
✗ Frontend: Dépendances Node.js manquantes
  → Solution: Exécuter 'npm install' dans le répertoire frontend
✓ Sécurité: Configuration correcte
✓ Docker: Configuration valide

3 problèmes détectés, 1 avertissement, 2 erreurs
Exécutez 'sfs doctor --fix' pour résoudre automatiquement ces problèmes
```

### Résolution automatique des problèmes

```bash
sfs doctor --fix
```

Résultat :
```
🔧 Application des correctifs...

✓ Installation des dépendances Node.js manquantes
✓ Configuration de la base de données mise à jour pour utiliser H2 en mode développement
✓ Fichiers manquants recréés

Tous les problèmes ont été résolus !
```

---

Si vous rencontrez un problème qui n'est pas couvert dans ce guide, n'hésitez pas à :
1. Consulter notre [documentation complète](https://spring-fullstack-speed.io/docs)
2. Rejoindre notre [communauté Discord](https://discord.gg/spring-fullstack-speed)
3. Créer une issue sur notre [dépôt GitHub](https://github.com/spring-fullstack-speed/sfs/issues)
