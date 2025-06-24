import { TemplateData } from './generator-methods.js';
import chalk from 'chalk';
import { ensureDirectoryExists } from './ensure-dir-exists.js';
import fs from 'fs';

/**
 * Génère les fichiers Kubernetes
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateKubernetes(generator: any, templateData: TemplateData) {
  if (!templateData.additionalFeatures || !templateData.additionalFeatures.includes('kubernetes')) {
    return; // Ne rien faire si Kubernetes n'est pas demandé
  }

  generator.log(chalk.blue("Génération des fichiers Kubernetes..."));

  try {
    // Créer les répertoires Kubernetes
    const k8sBaseDir = 'kubernetes';
    ensureDirectoryExists(generator, k8sBaseDir);
    ensureDirectoryExists(generator, `${k8sBaseDir}/base`);
    ensureDirectoryExists(generator, `${k8sBaseDir}/overlays`);
    ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/dev`);
    ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/prod`);

    // Créer un fichier deployment.yaml complet dans base/
    const deploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${templateData.appName.toLowerCase()}-app
  labels:
    app: ${templateData.appName.toLowerCase()}
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${templateData.appName.toLowerCase()}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: ${templateData.appName.toLowerCase()}
    spec:
      containers:
      - name: ${templateData.appName.toLowerCase()}
        image: ${templateData.appName.toLowerCase()}:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          valueFrom:
            configMapKeyRef:
              name: ${templateData.appName.toLowerCase()}-config
              key: spring.profiles.active
        - name: DB_URL
          valueFrom:
            configMapKeyRef:
              name: ${templateData.appName.toLowerCase()}-config
              key: db.url
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: ${templateData.appName.toLowerCase()}-secrets
              key: db.username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ${templateData.appName.toLowerCase()}-secrets
              key: db.password
        resources:
          limits:
            cpu: "1000m"
            memory: "1024Mi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
`;

    // Créer un fichier service.yaml complet dans base/
    const serviceYaml = `apiVersion: v1
kind: Service
metadata:
  name: ${templateData.appName.toLowerCase()}-service
  labels:
    app: ${templateData.appName.toLowerCase()}
spec:
  selector:
    app: ${templateData.appName.toLowerCase()}
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP
`;

    // Créer un fichier configmap.yaml
    const configmapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${templateData.appName.toLowerCase()}-config
data:
  spring.profiles.active: prod
  db.url: jdbc:${templateData.database === 'mysql' ? 'mysql://mysql:3306/' + templateData.appName.toLowerCase() : templateData.database === 'postgresql' ? 'postgresql://postgres:5432/' + templateData.appName.toLowerCase() : 'h2:mem:' + templateData.appName.toLowerCase()}
  application.properties: |
    # Spring application properties
    server.port=8080
    spring.application.name=${templateData.appName}
    management.endpoints.web.exposure.include=health,info,metrics
`;

    // Créer un fichier secrets.yaml
    const secretsYaml = `apiVersion: v1
kind: Secret
metadata:
  name: ${templateData.appName.toLowerCase()}-secrets
type: Opaque
data:
  db.username: YWRtaW4= # admin (base64)
  db.password: cGFzc3dvcmQ= # password (base64)
  jwt.secret: ${Buffer.from('your-jwt-secret-key-here-' + Math.random().toString(36).slice(2)).toString('base64')}
`;

    // Créer un fichier kustomization.yaml dans base/
    const kustomizationBaseYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - secrets.yaml
`;

    // Créer un fichier kustomization.yaml pour dev
    const kustomizationDevYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namePrefix: dev-
resources:
  - ../../base
patchesStrategicMerge:
  - patches/deployment-patch.yaml
configMapGenerator:
  - name: ${templateData.appName.toLowerCase()}-config
    behavior: merge
    literals:
      - spring.profiles.active=dev
`;

    // Créer un fichier kustomization.yaml pour prod
    const kustomizationProdYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namePrefix: prod-
resources:
  - ../../base
patchesStrategicMerge:
  - patches/deployment-patch.yaml
configMapGenerator:
  - name: ${templateData.appName.toLowerCase()}-config
    behavior: merge
    literals:
      - spring.profiles.active=prod
`;

    // Créer un patch pour le déploiement en dev
    const deploymentDevPatchYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${templateData.appName.toLowerCase()}-app
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ${templateData.appName.toLowerCase()}
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
`;

    // Créer un patch pour le déploiement en prod
    const deploymentProdPatchYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${templateData.appName.toLowerCase()}-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: ${templateData.appName.toLowerCase()}
        resources:
          limits:
            cpu: "2000m"
            memory: "2048Mi"
          requests:
            cpu: "1000m"
            memory: "1024Mi"
`;

    // Créer les répertoires pour les patches
    ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/dev/patches`);
    ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/prod/patches`);

    // Écrire les fichiers yaml
    fs.writeFileSync(`${k8sBaseDir}/base/deployment.yaml`, deploymentYaml);
    fs.writeFileSync(`${k8sBaseDir}/base/service.yaml`, serviceYaml);
    fs.writeFileSync(`${k8sBaseDir}/base/configmap.yaml`, configmapYaml);
    fs.writeFileSync(`${k8sBaseDir}/base/secrets.yaml`, secretsYaml);
    fs.writeFileSync(`${k8sBaseDir}/base/kustomization.yaml`, kustomizationBaseYaml);
    fs.writeFileSync(`${k8sBaseDir}/overlays/dev/kustomization.yaml`, kustomizationDevYaml);
    fs.writeFileSync(`${k8sBaseDir}/overlays/prod/kustomization.yaml`, kustomizationProdYaml);
    fs.writeFileSync(`${k8sBaseDir}/overlays/dev/patches/deployment-patch.yaml`, deploymentDevPatchYaml);
    fs.writeFileSync(`${k8sBaseDir}/overlays/prod/patches/deployment-patch.yaml`, deploymentProdPatchYaml);

    generator.log(chalk.green("✅ Fichiers Kubernetes générés avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Kubernetes: ${error}`));
  }
}
