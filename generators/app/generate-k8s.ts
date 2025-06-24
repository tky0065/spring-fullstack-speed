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
    name: http
  type: ClusterIP
`;

    // Créer un fichier configmap.yaml dans base/
    const configmapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${templateData.appName.toLowerCase()}-config
data:
  spring.profiles.active: "prod"
  db.url: "jdbc:h2:mem:proddb"
  application.properties: |
    server.port=8080
    management.endpoints.web.exposure.include=health,info,metrics
`;

    // Créer un fichier secrets.yaml dans base/
    const secretsYaml = `apiVersion: v1
kind: Secret
metadata:
  name: ${templateData.appName.toLowerCase()}-secrets
type: Opaque
data:
  db.username: YWRtaW4= # admin
  db.password: cGFzc3dvcmQ= # password
`;

    // Créer un fichier kustomization.yaml dans base/
    const baseKustomizationYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
- configmap.yaml
- secrets.yaml
commonLabels:
  app: ${templateData.appName.toLowerCase()}
  env: base
`;

    // Créer un fichier kustomization.yaml dans overlays/dev/
    const devKustomizationYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: dev-
commonLabels:
  env: dev
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 1
  target:
    kind: Deployment
configMapGenerator:
- name: ${templateData.appName.toLowerCase()}-config
  behavior: merge
  literals:
  - spring.profiles.active=dev
  - db.url=jdbc:h2:mem:devdb
`;

    // Créer un fichier kustomization.yaml dans overlays/prod/
    const prodKustomizationYaml = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: prod-
commonLabels:
  env: prod
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 3
  target:
    kind: Deployment
configMapGenerator:
- name: ${templateData.appName.toLowerCase()}-config
  behavior: merge
  literals:
  - spring.profiles.active=prod
  - db.url=jdbc:h2:mem:proddb
`;

    // Créer un README.md pour Kubernetes
    const readmeContent = `# Configuration Kubernetes pour ${templateData.appName}

## Structure

Ce dossier contient la configuration Kubernetes organisée avec Kustomize:

- \`base/\`: Contient les configurations de base partagées
- \`overlays/dev/\`: Contient les configurations spécifiques à l'environnement de développement
- \`overlays/prod/\`: Contient les configurations spécifiques à l'environnement de production

## Utilisation

### Déployer en environnement de développement

\`\`\`bash
kubectl apply -k kubernetes/overlays/dev
\`\`\`

### Déployer en environnement de production

\`\`\`bash
kubectl apply -k kubernetes/overlays/prod
\`\`\`

## Personnalisation

Vous pouvez modifier les fichiers dans \`base/\` pour changer la configuration de base,
ou les fichiers dans \`overlays/\` pour personnaliser les différents environnements.
`;

    // Écrire tous les fichiers
    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/base/deployment.yaml`),
      deploymentYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/base/service.yaml`),
      serviceYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/base/configmap.yaml`),
      configmapYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/base/secrets.yaml`),
      secretsYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/base/kustomization.yaml`),
      baseKustomizationYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/overlays/dev/kustomization.yaml`),
      devKustomizationYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/overlays/prod/kustomization.yaml`),
      prodKustomizationYaml
    );

    generator.fs.write(
      generator.destinationPath(`${k8sBaseDir}/README.md`),
      readmeContent
    );

    // Vérifier que les fichiers ont été correctement générés
    const requiredFiles = [
      `${k8sBaseDir}/base/deployment.yaml`,
      `${k8sBaseDir}/base/service.yaml`,
      `${k8sBaseDir}/base/configmap.yaml`,
      `${k8sBaseDir}/base/secrets.yaml`,
      `${k8sBaseDir}/base/kustomization.yaml`,
      `${k8sBaseDir}/overlays/dev/kustomization.yaml`,
      `${k8sBaseDir}/overlays/prod/kustomization.yaml`
    ];

    let allFilesGenerated = true;
    for (const file of requiredFiles) {
      if (!fs.existsSync(generator.destinationPath(file))) {
        generator.log(chalk.red(`❌ Fichier ${file} non généré`));
        allFilesGenerated = false;
      }
    }

    if (allFilesGenerated) {
      generator.log(chalk.green("✅ Configuration Kubernetes générée avec succès!"));
    } else {
      throw new Error("Certains fichiers Kubernetes n'ont pas été générés");
    }
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Kubernetes: ${error}`));

    // Ne pas utiliser la logique de secours qui place les fichiers à la racine
    // Au lieu de cela, essayons de corriger le problème en régénérant les fichiers essentiels
    try {
      const k8sBaseDir = 'kubernetes';
      ensureDirectoryExists(generator, k8sBaseDir);
      ensureDirectoryExists(generator, `${k8sBaseDir}/base`);
      ensureDirectoryExists(generator, `${k8sBaseDir}/overlays`);
      ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/dev`);
      ensureDirectoryExists(generator, `${k8sBaseDir}/overlays/prod`);

      // Recréer au moins les fichiers de base
      const minimalDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${templateData.appName.toLowerCase()}-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${templateData.appName.toLowerCase()}
  template:
    metadata:
      labels:
        app: ${templateData.appName.toLowerCase()}
    spec:
      containers:
      - name: ${templateData.appName.toLowerCase()}
        image: ${templateData.appName.toLowerCase()}:latest
        ports:
        - containerPort: 8080
`;

      const minimalService = `apiVersion: v1
kind: Service
metadata:
  name: ${templateData.appName.toLowerCase()}-service
spec:
  selector:
    app: ${templateData.appName.toLowerCase()}
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
`;

      const minimalKustomization = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
`;

      // Écrire les fichiers minimaux dans la structure correcte
      generator.fs.write(
        generator.destinationPath(`${k8sBaseDir}/base/deployment.yaml`),
        minimalDeployment
      );
      generator.fs.write(
        generator.destinationPath(`${k8sBaseDir}/base/service.yaml`),
        minimalService
      );
      generator.fs.write(
        generator.destinationPath(`${k8sBaseDir}/base/kustomization.yaml`),
        minimalKustomization
      );
      generator.fs.write(
        generator.destinationPath(`${k8sBaseDir}/overlays/dev/kustomization.yaml`),
        `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: dev-
`
      );
      generator.fs.write(
        generator.destinationPath(`${k8sBaseDir}/overlays/prod/kustomization.yaml`),
        `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: prod-
`
      );

      generator.log(chalk.yellow("⚠️ Fichiers Kubernetes minimaux créés dans la structure correcte"));
    } catch (fallbackError) {
      generator.log(chalk.red(`❌ Échec complet de la génération Kubernetes: ${fallbackError}`));
    }
  }
}
