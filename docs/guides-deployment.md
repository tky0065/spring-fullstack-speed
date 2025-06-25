# Guide de déploiement Spring-Fullstack-Speed

Ce guide fournit des instructions détaillées pour déployer des applications générées avec Spring-Fullstack-Speed dans différents environnements.

## Table des matières

1. [Déploiement traditionnel](#déploiement-traditionnel)
2. [Déploiement Docker](#déploiement-docker)
3. [Déploiement Kubernetes](#déploiement-kubernetes)
4. [Déploiement Cloud](#déploiement-cloud)
5. [Intégration continue](#intégration-continue)
6. [Bonnes pratiques](#bonnes-pratiques)

## Déploiement traditionnel

### Prérequis

- JDK 11+ installé
- Base de données configurée (MySQL, PostgreSQL, etc.)
- Serveur de production avec accès SSH

### Construction du JAR

```bash
# À partir du dossier racine du projet
./mvnw clean package -Pprod -DskipTests
```

Ce qui produit un fichier JAR dans le dossier `target/`

### Configuration de l'environnement de production

Créez un fichier `application-prod.yml` contenant:

```yaml
spring:
  profiles: prod
  datasource:
    url: jdbc:mysql://production-db-host:3306/dbname
    username: dbuser
    password: dbpassword
  jpa:
    hibernate:
      ddl-auto: none

server:
  port: 8080
  servlet:
    context-path: /api

# Configuration sécurité
security:
  jwt:
    token-validity-seconds: 86400
    base64-secret: YOUR_SECURE_SECRET_KEY
```

### Déploiement sur serveur

1. **Transférez le JAR et la configuration**

```bash
scp target/myapp-0.0.1-SNAPSHOT.jar user@server:/path/to/app/
scp src/main/resources/application-prod.yml user@server:/path/to/app/
```

2. **Lancez l'application**

```bash
ssh user@server
cd /path/to/app/
java -jar myapp-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

3. **Configuration avec systemd (pour démarrage automatique)**

Créez un fichier service `/etc/systemd/system/myapp.service`:

```
[Unit]
Description=My Spring Boot Application
After=syslog.target network.target

[Service]
User=appuser
WorkingDirectory=/path/to/app
ExecStart=/usr/bin/java -jar myapp-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Puis activez et démarrez le service:

```bash
sudo systemctl enable myapp.service
sudo systemctl start myapp.service
```

## Déploiement Docker

### Prérequis

- Docker installé
- Docker Compose (optionnel)
- Accès à un registry Docker (Docker Hub, GitLab, etc.)

### Construction de l'image Docker

Le projet généré inclut un `Dockerfile` à la racine:

```bash
# Construire l'image
docker build -t myorg/myapp:latest .

# Vérifier l'image créée
docker images
```

### Déploiement avec Docker Compose

Le projet inclut également un fichier `docker-compose.yml`:

```bash
# Démarrer les conteneurs (application + base de données)
docker-compose up -d

# Vérifier les logs
docker-compose logs -f app
```

### Publier l'image sur un registry

```bash
# Se connecter au registry
docker login

# Tagger l'image
docker tag myorg/myapp:latest registry.example.com/myorg/myapp:latest

# Pousser l'image
docker push registry.example.com/myorg/myapp:latest
```

## Déploiement Kubernetes

### Prérequis

- Cluster Kubernetes configuré
- `kubectl` installé et configuré
- Accès à un registry Docker

### Déploiement avec Kustomize

Le projet généré inclut une configuration Kubernetes dans le dossier `/kubernetes`:

```
kubernetes/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

Pour déployer:

```bash
# Vérifier la configuration
kubectl kustomize kubernetes/overlays/prod

# Appliquer la configuration
kubectl apply -k kubernetes/overlays/prod

# Vérifier le déploiement
kubectl get pods
kubectl get services
```

### Configurer les secrets

```bash
# Créer un secret pour les informations sensibles
kubectl create secret generic myapp-secrets \
  --from-literal=DB_PASSWORD=mypwd \
  --from-literal=JWT_SECRET=mysecret

# Référencer ce secret dans le déploiement
kubectl edit deployment myapp
```

### Mettre à jour l'application

```bash
# Mettre à jour l'image
kubectl set image deployment/myapp myapp=registry.example.com/myorg/myapp:v2

# Vérifier le rollout
kubectl rollout status deployment/myapp
```

## Déploiement Cloud

### AWS

#### Elastic Beanstalk

1. **Préparez votre application**:
   - Ajoutez un fichier `Procfile` à la racine:
     ```
     web: java -jar target/myapp-0.0.1-SNAPSHOT.jar --server.port=$PORT
     ```

2. **Utilisez l'interface AWS ou l'EB CLI**:
   ```bash
   eb init
   eb create myapp-env
   eb deploy
   ```

#### ECS (Elastic Container Service)

1. **Créez un Task Definition** avec votre image Docker
2. **Créez un Service** dans un Cluster ECS
3. **Configurez un Load Balancer** pour exposer votre service

### Google Cloud Platform

#### GCP App Engine

1. **Créez un fichier `app.yaml`**:
   ```yaml
   runtime: java11
   instance_class: F2
   
   env_variables:
     SPRING_PROFILES_ACTIVE: 'prod'
   ```

2. **Déployez avec gcloud**:
   ```bash
   gcloud app deploy
   ```

#### Google Kubernetes Engine (GKE)

1. **Créez un cluster GKE** dans la console ou avec gcloud
2. **Configurez kubectl** pour votre cluster GKE
3. **Déployez avec kubectl** comme pour un cluster Kubernetes standard

### Azure

#### Azure Spring Apps

1. **Créez une instance Azure Spring Apps** dans le portail Azure
2. **Configurez votre application**:
   ```bash
   az spring-cloud app create -n myapp
   az spring-cloud app deploy -n myapp --jar-path target/myapp-0.0.1-SNAPSHOT.jar
   ```

#### Azure Kubernetes Service (AKS)

1. **Créez un cluster AKS** dans le portail Azure
2. **Configurez kubectl** pour votre cluster AKS
3. **Déployez avec kubectl** comme pour un cluster Kubernetes standard

## Intégration continue

### GitHub Actions

Le projet généré inclut un workflow GitHub Actions dans `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
        
    - name: Build with Maven
      run: ./mvnw clean package -Pprod -DskipTests
      
    - name: Build Docker image
      run: docker build -t myorg/myapp:${GITHUB_SHA} .
      
    - name: Push to registry
      if: github.event_name == 'push'
      run: |
        echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
        docker push myorg/myapp:${GITHUB_SHA}
        
    - name: Deploy to K8s
      if: github.event_name == 'push'
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" > kubeconfig
        export KUBECONFIG=./kubeconfig
        sed -i "s|image: myorg/myapp:.*|image: myorg/myapp:${GITHUB_SHA}|" kubernetes/overlays/prod/kustomization.yaml
        kubectl apply -k kubernetes/overlays/prod
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - docker
  - deploy

build:
  stage: build
  script:
    - ./mvnw clean package -DskipTests

test:
  stage: test
  script:
    - ./mvnw test

docker:
  stage: docker
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh './mvnw clean package -DskipTests'
            }
        }
        
        stage('Test') {
            steps {
                sh './mvnw test'
            }
        }
        
        stage('Docker') {
            steps {
                sh 'docker build -t myorg/myapp:${BUILD_NUMBER} .'
                sh 'docker push myorg/myapp:${BUILD_NUMBER}'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'kubectl set image deployment/myapp myapp=myorg/myapp:${BUILD_NUMBER}'
            }
        }
    }
}
```

## Bonnes pratiques

### Sécurité

1. **Ne jamais stocker les secrets dans le code source**
   - Utilisez des variables d'environnement
   - Utilisez des services de gestion de secrets (Vault, AWS Secrets Manager)

2. **Configurez HTTPS**
   ```yaml
   server:
     ssl:
       key-store: classpath:keystore.p12
       key-store-password: password
       key-store-type: PKCS12
       key-alias: tomcat
   ```

3. **Activez les en-têtes de sécurité**
   ```java
   @Configuration
   public class SecurityConfig extends WebSecurityConfigurerAdapter {
       @Override
       protected void configure(HttpSecurity http) throws Exception {
           http
               .headers()
               .xssProtection()
               .and()
               .contentSecurityPolicy("script-src 'self'");
       }
   }
   ```

### Performances

1. **Configurez les pools de connexions**
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 10
   ```

2. **Activez le cache**
   ```java
   @EnableCaching
   @Configuration
   public class CacheConfig {
       @Bean
       public CacheManager cacheManager() {
           return new ConcurrentMapCacheManager("products", "customers");
       }
   }
   ```

3. **Optimisez les ressources JVM**
   ```
   java -Xms1g -Xmx2g -jar app.jar
   ```

### Monitoring

1. **Intégrez Spring Boot Actuator**
   ```yaml
   management:
     endpoints:
       web:
         exposure:
           include: health,metrics,prometheus
   ```

2. **Configurez la journalisation**
   ```yaml
   logging:
     file:
       name: /path/to/logs/application.log
     level:
       root: INFO
       com.example: DEBUG
   ```

3. **Intégrez avec Prometheus et Grafana**
   ```yaml
   # docker-compose-monitoring.yml
   services:
     prometheus:
       image: prom/prometheus
       volumes:
         - ./prometheus.yml:/etc/prometheus/prometheus.yml
     
     grafana:
       image: grafana/grafana
       ports:
         - "3000:3000"
   ```

### Scaling

1. **Configuration pour plusieurs instances**
   ```yaml
   spring:
     session:
       store-type: redis
   ```

2. **Scaling horizontal avec Kubernetes**
   ```yaml
   # kubernetes/base/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: myapp
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: myapp
   ```

3. **Autoscaling**
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: myapp-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: myapp
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 80
   ```

### Backup et Restauration

1. **Backup de la base de données**
   ```bash
   # Pour PostgreSQL
   pg_dump -h hostname -U username -d dbname > backup.sql
   
   # Pour MySQL
   mysqldump -h hostname -u username -p dbname > backup.sql
   ```

2. **Backup du système de fichiers**
   ```bash
   rsync -av --delete /path/to/app/files/ /path/to/backup/
   ```

3. **Restauration**
   ```bash
   # Pour PostgreSQL
   psql -h hostname -U username -d dbname < backup.sql
   
   # Pour MySQL
   mysql -h hostname -u username -p dbname < backup.sql
   ```

## Conclusion

Ce guide vous a présenté les différentes options de déploiement pour les applications générées avec Spring-Fullstack-Speed. Chaque environnement a ses propres avantages et défis, mais la configuration de base reste similaire grâce à l'architecture standardisée de Spring Boot.

Pour plus d'informations, consultez:
- La [documentation officielle de Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html)
- La [documentation Kubernetes](https://kubernetes.io/docs/home/)
- La documentation spécifique à votre cloud provider
