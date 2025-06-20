/**
 * Générateur pour la commande 'sfs deploy'
 * Permet de déployer une application Spring Boot vers différents environnements
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync, spawn } from "child_process";
import { createSpinner, displaySectionTitle, displaySectionEnd, success, error, info } from "../../utils/cli-ui.js";

/**
 * Interface pour les options du générateur
 */
interface DeployOptions {
  target?: string;
  profile?: string;
  skipBuild?: boolean;
  verbose?: boolean;
}

/**
 * Générateur pour déployer l'application
 */
export default class DeployGenerator extends BaseGenerator {
  // Déclaration des options avec types
  declare options: any;

  // Propriétés internes
  private projectType: 'maven' | 'gradle' | 'unknown' = 'unknown';
  private hasFrontend: boolean = false;
  private hasDocker: boolean = false;
  private hasKubernetes: boolean = false;
  private deployTarget: string = 'local';
  private deployStats: any = {
    success: false,
    duration: 0,
    targetUrl: '',
    logs: []
  };

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
    this.option("target", {
      type: String,
      description: "Cible de déploiement (local, docker, kubernetes, aws, azure, heroku)",
      default: "local"
    });

    this.option("profile", {
      type: String,
      description: "Profil de déploiement (dev, test, prod)",
      default: "prod"
    });

    this.option("skip-build", {
      type: Boolean,
      description: "Ne pas reconstruire l'application avant le déploiement",
      default: false
    });

    this.option("verbose", {
      type: Boolean,
      description: "Afficher plus de détails pendant le déploiement",
      default: false
    });
  }

  /**
   * Initialisation : détection du type de projet et environnement
   */
  async initializing() {
    displaySectionTitle(`Déploiement vers ${this.options.target}`);

    // Vérifier le type de projet (Maven ou Gradle)
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectType = "maven";
      this.log(chalk.gray("Projet Maven détecté"));
    } else if (
      fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
      fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
    ) {
      this.projectType = "gradle";
      this.log(chalk.gray("Projet Gradle détecté"));
    } else {
      this.log(chalk.red("Aucun projet Maven ou Gradle n'a été détecté dans ce répertoire."));
      process.exit(1);
    }

    // Détection de frontend
    this.detectFrontend();

    // Détection de Docker
    this.hasDocker = fs.existsSync(path.join(process.cwd(), "Dockerfile")) ||
                    fs.existsSync(path.join(process.cwd(), "docker-compose.yml")) ||
                    fs.existsSync(path.join(process.cwd(), "docker-compose.yaml"));
    if (this.hasDocker) {
      this.log(chalk.gray("Configuration Docker détectée"));
    }

    // Détection de Kubernetes
    this.hasKubernetes = fs.existsSync(path.join(process.cwd(), "kubernetes")) ||
                        fs.existsSync(path.join(process.cwd(), "k8s"));
    if (this.hasKubernetes) {
      this.log(chalk.gray("Configuration Kubernetes détectée"));
    }

    // Valider la cible de déploiement
    this.deployTarget = this.options.target.toLowerCase();
    const validTargets = ['local', 'docker', 'kubernetes', 'aws', 'azure', 'heroku'];

    if (!validTargets.includes(this.deployTarget)) {
      this.log(chalk.red(`Cible de déploiement '${this.deployTarget}' non valide.`));
      this.log(chalk.yellow(`Cibles valides: ${validTargets.join(', ')}`));
      process.exit(1);
    }

    // Vérification supplémentaire pour les cibles spécifiques
    if (this.deployTarget === 'docker' && !this.hasDocker) {
      this.log(chalk.yellow("⚠️ Aucune configuration Docker n'a été trouvée. Le déploiement pourrait échouer."));
    }

    if (this.deployTarget === 'kubernetes' && !this.hasKubernetes) {
      this.log(chalk.yellow("⚠️ Aucune configuration Kubernetes n'a été trouvée. Le déploiement pourrait échouer."));
    }

    // Afficher les options sélectionnées
    this.log(chalk.gray("Options de déploiement:"));
    this.log(chalk.gray(`- Cible: ${this.deployTarget}`));
    this.log(chalk.gray(`- Profil: ${this.options.profile}`));
    if (this.options.skipBuild) {
      this.log(chalk.gray("- Construction ignorée"));
    }
  }

  /**
   * Détection du frontend
   */
  private detectFrontend() {
    // Chercher un fichier package.json à la racine ou dans un dossier frontend
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const frontendDir = path.join(process.cwd(), "frontend");

    this.hasFrontend = fs.existsSync(packageJsonPath) ||
                      (fs.existsSync(frontendDir) && fs.existsSync(path.join(frontendDir, "package.json")));

    if (this.hasFrontend) {
      this.log(chalk.gray("Frontend détecté"));
    }
  }

  /**
   * Construction de l'application si nécessaire
   */
  async prompting() {
    if (!this.options.skipBuild) {
      this.log(chalk.blue("Construction de l'application avant déploiement..."));

      try {
        // Utiliser le générateur de build existant
        const buildGeneratorOptions: any = {};

        // Ajouter les options avec les noms exacts attendus par le générateur build
        if (this.options.profile) {
          buildGeneratorOptions.profile = this.options.profile;
        }

        // Utiliser les noms exacts des options (avec tirets)
        buildGeneratorOptions['skip-tests'] = true;
        buildGeneratorOptions.optimized = true;
        buildGeneratorOptions.verbose = this.options.verbose;

        // Appel au générateur de build avec les options préparées
        await this.composeWith(require.resolve('../build'), buildGeneratorOptions);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        this.log(chalk.red(`❌ La construction a échoué: ${errorMessage}`));
        return;
      }
    } else {
      this.log(chalk.gray("Construction ignorée. Utilisation de l'artefact existant."));

      // Vérifier que l'artefact existe
      if (!this.findBuildArtifact()) {
        this.log(chalk.red("❌ Aucun artefact de build n'a été trouvé. Veuillez construire l'application d'abord."));
        return;
      }
    }
  }

  /**
   * Trouve l'artefact de build existant
   */
  private findBuildArtifact(): boolean {
    let artifactFound = false;

    if (this.projectType === "maven") {
      const targetDir = path.join(process.cwd(), "target");
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir).filter(file =>
          (file.endsWith(".jar") || file.endsWith(".war")) &&
          !file.endsWith("-sources.jar") &&
          !file.endsWith("-javadoc.jar"));

        artifactFound = files.length > 0;
      }
    } else if (this.projectType === "gradle") {
      const buildLibsDir = path.join(process.cwd(), "build", "libs");
      if (fs.existsSync(buildLibsDir)) {
        const files = fs.readdirSync(buildLibsDir).filter(file =>
          (file.endsWith(".jar") || file.endsWith(".war")) &&
          !file.endsWith("-sources.jar") &&
          !file.endsWith("-javadoc.jar"));

        artifactFound = files.length > 0;
      }
    }

    return artifactFound;
  }

  /**
   * Déploiement de l'application
   */
  async writing() {
    const startTime = Date.now();
    const spinner = createSpinner({
      text: `Déploiement vers ${this.deployTarget}...`,
      color: "primary"
    });

    spinner.start();

    try {
      // Sélectionner la stratégie de déploiement en fonction de la cible
      switch (this.deployTarget) {
        case 'local':
          await this.deployLocal();
          break;
        case 'docker':
          await this.deployDocker();
          break;
        case 'kubernetes':
          await this.deployKubernetes();
          break;
        case 'aws':
          await this.deployAWS();
          break;
        case 'azure':
          await this.deployAzure();
          break;
        case 'heroku':
          await this.deployHeroku();
          break;
      }

      // Calculer la durée
      this.deployStats.duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.deployStats.success = true;

      spinner.succeed(`Déploiement vers ${this.deployTarget} terminé en ${this.deployStats.duration} secondes`);
    } catch (err: any) {
      spinner.fail(`Erreur lors du déploiement: ${err.message}`);
      this.deployStats.success = false;
      if (this.options.verbose) {
        console.error(err);
      }
    }
  }

  /**
   * Déploiement local (par défaut)
   */
  private async deployLocal(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement en local..."));

      // Trouver le JAR/WAR à exécuter
      let artifactPath = "";

      if (this.projectType === "maven") {
        const targetDir = path.join(global.process.cwd(), "target");
        if (fs.existsSync(targetDir)) {
          const files = fs.readdirSync(targetDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(targetDir, files[0]);
          }
        }
      } else if (this.projectType === "gradle") {
        const buildLibsDir = path.join(global.process.cwd(), "build", "libs");
        if (fs.existsSync(buildLibsDir)) {
          const files = fs.readdirSync(buildLibsDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(buildLibsDir, files[0]);
          }
        }
      }

      if (!artifactPath) {
        reject(new Error("Impossible de trouver l'artefact à déployer"));
        return;
      }

      // Exécuter l'application avec le profil spécifié
      const command = "java";
      const args = [
        `-Dspring.profiles.active=${this.options.profile}`,
        "-jar",
        artifactPath
      ];

      this.log(chalk.gray(`Exécution de: ${command} ${args.join(" ")}`));

      const process = spawn(command, args, {
        stdio: "inherit",
        detached: true,
        shell: true
      });

      // Gérer le détachement du processus pour qu'il continue à s'exécuter après le générateur
      process.unref();

      // Attendre un peu pour s'assurer que l'application démarre sans erreur
      setTimeout(() => {
        if (process.exitCode === null) {
          this.deployStats.targetUrl = "http://localhost:8080";
          this.log(chalk.green(`✓ Application démarrée avec succès sur ${this.deployStats.targetUrl}`));
          resolve();
        } else {
          reject(new Error(`L'application s'est arrêtée avec le code de sortie ${process.exitCode}`));
        }
      }, 3000);
    });
  }

  /**
   * Déploiement Docker
   */
  private async deployDocker(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement avec Docker..."));

      // Vérifier si Docker est installé
      try {
        execSync("docker --version", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("Docker n'est pas installé ou n'est pas accessible"));
        return;
      }

      // Déterminer si on utilise docker-compose
      const useCompose = fs.existsSync(path.join(process.cwd(), "docker-compose.yml")) ||
                        fs.existsSync(path.join(process.cwd(), "docker-compose.yaml"));

      // Construire l'image Docker
      if (!useCompose) {
        try {
          const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
          const tag = `${appName}:${this.options.profile}`;

          this.log(chalk.gray(`Construction de l'image Docker: ${tag}`));
          execSync(`docker build -t ${tag} .`, { stdio: this.options.verbose ? "inherit" : "pipe" });

          // Exécuter le conteneur
          const containerName = `${appName}-${this.options.profile}`;
          execSync(`docker rm -f ${containerName} 2>/dev/null || true`, { stdio: "ignore" });

          this.log(chalk.gray(`Démarrage du conteneur: ${containerName}`));
          const cmd = `docker run -d --name ${containerName} -p 8080:8080 -e "SPRING_PROFILES_ACTIVE=${this.options.profile}" ${tag}`;
          execSync(cmd, { stdio: this.options.verbose ? "inherit" : "pipe" });

          // Vérifier que le conteneur est en cours d'exécution
          const containerId = execSync(`docker ps -q -f name=${containerName}`).toString().trim();
          if (!containerId) {
            reject(new Error("Le conteneur Docker n'a pas démarré correctement"));
            return;
          }

          this.deployStats.targetUrl = "http://localhost:8080";
          resolve();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);

          reject(new Error(`Erreur lors du déploiement Docker: ${errorMessage}`));
        }
      } else {
        // Utiliser docker-compose
        try {
          this.log(chalk.gray("Utilisation de docker-compose..."));

          // Définir la variable d'environnement pour le profil Spring
          process.env.SPRING_PROFILES_ACTIVE = this.options.profile;

          // Exécuter docker-compose
          execSync("docker-compose down", { stdio: this.options.verbose ? "inherit" : "pipe" });
          execSync("docker-compose up -d", { stdio: this.options.verbose ? "inherit" : "pipe" });

          this.deployStats.targetUrl = "http://localhost:8080";
          resolve();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);

          reject(new Error(`Erreur lors du déploiement avec docker-compose: ${errorMessage}`));
        }
      }
    });
  }

  /**
   * Déploiement Kubernetes
   */
  private async deployKubernetes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement sur Kubernetes..."));

      // Vérifier si kubectl est installé
      try {
        execSync("kubectl version --client", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("kubectl n'est pas installé ou n'est pas accessible"));
        return;
      }

      // Vérifier si le répertoire kubernetes existe
      let k8sDir = "";
      if (fs.existsSync(path.join(process.cwd(), "kubernetes"))) {
        k8sDir = path.join(process.cwd(), "kubernetes");
      } else if (fs.existsSync(path.join(process.cwd(), "k8s"))) {
        k8sDir = path.join(process.cwd(), "k8s");
      } else {
        reject(new Error("Aucun répertoire kubernetes ou k8s n'a été trouvé"));
        return;
      }

      try {
        // Trouver les fichiers Kubernetes pour le profil spécifié
        const profileDir = path.join(k8sDir, this.options.profile);
        const defaultDir = k8sDir;

        let manifestsDir = fs.existsSync(profileDir) ? profileDir : defaultDir;

        // Appliquer les manifests Kubernetes
        this.log(chalk.gray(`Application des manifests Kubernetes depuis ${manifestsDir}`));
        execSync(`kubectl apply -f ${manifestsDir}`, { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Attendre que les pods soient prêts
        this.log(chalk.gray("Attente du déploiement..."));

        // Tenter de trouver le service pour obtenir l'URL
        try {
          const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
          const serviceInfo = execSync(`kubectl get service ${appName} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`).toString().trim();

          if (serviceInfo) {
            this.deployStats.targetUrl = `http://${serviceInfo}`;
          } else {
            this.deployStats.targetUrl = "Voir kubectl get services pour l'URL";
          }
        } catch (e) {
          this.log(chalk.yellow("⚠️ Impossible de déterminer l'URL du service"));
          this.deployStats.targetUrl = "Voir kubectl get services pour l'URL";
        }

        resolve();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        reject(new Error(`Erreur lors du déploiement Kubernetes: ${errorMessage}`));
      }
    });
  }

  /**
   * Déploiement AWS
   */
  private async deployAWS(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement sur AWS..."));

      // Vérifier si AWS CLI est installé
      try {
        execSync("aws --version", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("AWS CLI n'est pas installé ou n'est pas accessible"));
        return;
      }

      // Trouver l'artefact JAR/WAR
      let artifactPath = "";

      if (this.projectType === "maven") {
        const targetDir = path.join(process.cwd(), "target");
        if (fs.existsSync(targetDir)) {
          const files = fs.readdirSync(targetDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(targetDir, files[0]);
          }
        }
      } else if (this.projectType === "gradle") {
        const buildLibsDir = path.join(process.cwd(), "build", "libs");
        if (fs.existsSync(buildLibsDir)) {
          const files = fs.readdirSync(buildLibsDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(buildLibsDir, files[0]);
          }
        }
      }

      if (!artifactPath) {
        reject(new Error("Impossible de trouver l'artefact à déployer"));
        return;
      }

      try {
        // Nom de l'application pour Elastic Beanstalk
        const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
        const version = new Date().toISOString().replace(/[^0-9]/g, "").substring(0, 14);
        const bucketName = `${appName}-deployments`;
        const s3Key = `${appName}/${version}/${path.basename(artifactPath)}`;

        // Créer le bucket S3 s'il n'existe pas
        this.log(chalk.gray(`Vérification du bucket S3: ${bucketName}`));
        try {
          execSync(`aws s3api head-bucket --bucket ${bucketName}`, { stdio: "ignore" });
        } catch (e) {
          this.log(chalk.gray(`Création du bucket S3: ${bucketName}`));
          execSync(`aws s3 mb s3://${bucketName}`, { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Téléchargement de l'artefact sur S3
        this.log(chalk.gray(`Téléchargement de l'artefact sur S3: ${s3Key}`));
        execSync(`aws s3 cp ${artifactPath} s3://${bucketName}/${s3Key}`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Vérifier si l'application Elastic Beanstalk existe
        try {
          execSync(`aws elasticbeanstalk describe-applications --application-names ${appName}`,
                  { stdio: "ignore" });
        } catch (e) {
          // Créer l'application Elastic Beanstalk
          this.log(chalk.gray(`Création de l'application Elastic Beanstalk: ${appName}`));
          execSync(`aws elasticbeanstalk create-application --application-name ${appName}`,
                  { stdio: this.options.verbose ? "inherit" : "pipe" });

          // Créer l'environnement Elastic Beanstalk
          const envName = `${appName}-${this.options.profile}`;
          this.log(chalk.gray(`Création de l'environnement Elastic Beanstalk: ${envName}`));

          execSync(`aws elasticbeanstalk create-environment --application-name ${appName} --environment-name ${envName} --solution-stack-name "64bit Amazon Linux 2 v3.2.8 running Corretto 11" --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_PROFILES_ACTIVE,Value=${this.options.profile}`,
                  { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Créer une version de l'application
        this.log(chalk.gray(`Création d'une nouvelle version de l'application: ${version}`));
        execSync(`aws elasticbeanstalk create-application-version --application-name ${appName} --version-label ${version} --source-bundle S3Bucket=${bucketName},S3Key=${s3Key}`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Déployer la version
        const envName = `${appName}-${this.options.profile}`;
        this.log(chalk.gray(`Déploiement de la version ${version} vers l'environnement ${envName}`));
        execSync(`aws elasticbeanstalk update-environment --application-name ${appName} --environment-name ${envName} --version-label ${version}`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Obtenir l'URL de l'environnement
        this.log(chalk.gray("Récupération de l'URL de l'environnement..."));
        const envUrl = execSync(`aws elasticbeanstalk describe-environments --application-name ${appName} --environment-names ${envName} --query "Environments[0].CNAME" --output text`).toString().trim();

        if (envUrl) {
          this.deployStats.targetUrl = `http://${envUrl}`;
        }

        resolve();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        reject(new Error(`Erreur lors du déploiement AWS: ${errorMessage}`));
      }
    });
  }

  /**
   * Déploiement Azure
   */
  private async deployAzure(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement sur Azure..."));

      // Vérifier si Azure CLI est installé
      try {
        execSync("az --version", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("Azure CLI n'est pas installé ou n'est pas accessible"));
        return;
      }

      // Vérifier si l'utilisateur est connecté à Azure
      try {
        execSync("az account show", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("Vous n'êtes pas connecté à Azure. Exécutez 'az login' d'abord."));
        return;
      }

      // Trouver l'artefact JAR/WAR
      let artifactPath = "";

      if (this.projectType === "maven") {
        const targetDir = path.join(process.cwd(), "target");
        if (fs.existsSync(targetDir)) {
          const files = fs.readdirSync(targetDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(targetDir, files[0]);
          }
        }
      } else if (this.projectType === "gradle") {
        const buildLibsDir = path.join(process.cwd(), "build", "libs");
        if (fs.existsSync(buildLibsDir)) {
          const files = fs.readdirSync(buildLibsDir).filter(file =>
            (file.endsWith(".jar") || file.endsWith(".war")) &&
            !file.endsWith("-sources.jar") &&
            !file.endsWith("-javadoc.jar"));

          if (files.length > 0) {
            artifactPath = path.join(buildLibsDir, files[0]);
          }
        }
      }

      if (!artifactPath) {
        reject(new Error("Impossible de trouver l'artefact à déployer"));
        return;
      }

      try {
        // Nom de l'application pour Azure App Service
        const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
        const resourceGroup = `${appName}-rg`;
        const appServicePlan = `${appName}-plan`;

        // Créer le groupe de ressources s'il n'existe pas
        this.log(chalk.gray(`Vérification du groupe de ressources: ${resourceGroup}`));
        try {
          execSync(`az group show --name ${resourceGroup}`, { stdio: "ignore" });
        } catch (e) {
          this.log(chalk.gray(`Création du groupe de ressources: ${resourceGroup}`));
          execSync(`az group create --name ${resourceGroup} --location westeurope`,
                  { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Créer le plan App Service s'il n'existe pas
        this.log(chalk.gray(`Vérification du plan App Service: ${appServicePlan}`));
        try {
          execSync(`az appservice plan show --name ${appServicePlan} --resource-group ${resourceGroup}`, { stdio: "ignore" });
        } catch (e) {
          this.log(chalk.gray(`Création du plan App Service: ${appServicePlan}`));
          execSync(`az appservice plan create --name ${appServicePlan} --resource-group ${resourceGroup} --sku B1 --is-linux`,
                  { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Créer ou mettre à jour l'application web
        this.log(chalk.gray(`Vérification de l'application web: ${appName}`));
        try {
          execSync(`az webapp show --name ${appName} --resource-group ${resourceGroup}`, { stdio: "ignore" });
        } catch (e) {
          this.log(chalk.gray(`Création de l'application web: ${appName}`));
          execSync(`az webapp create --name ${appName} --resource-group ${resourceGroup} --plan ${appServicePlan} --runtime "JAVA|11-java11"`,
                  { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Définir les paramètres d'exécution
        this.log(chalk.gray("Configuration des paramètres d'application..."));
        execSync(`az webapp config set --name ${appName} --resource-group ${resourceGroup} --java-version 11 --java-container Tomcat --java-container-version 9.0`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Définir les variables d'environnement
        this.log(chalk.gray(`Définition du profil Spring: ${this.options.profile}`));
        execSync(`az webapp config appsettings set --name ${appName} --resource-group ${resourceGroup} --settings SPRING_PROFILES_ACTIVE=${this.options.profile}`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Déployer l'application
        this.log(chalk.gray("Déploiement de l'application..."));
        execSync(`az webapp deploy --name ${appName} --resource-group ${resourceGroup} --src-path ${artifactPath} --type jar`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Obtenir l'URL de l'application
        this.log(chalk.gray("Récupération de l'URL de l'application..."));
        const appUrl = execSync(`az webapp show --name ${appName} --resource-group ${resourceGroup} --query "defaultHostName" --output tsv`).toString().trim();

        if (appUrl) {
          this.deployStats.targetUrl = `https://${appUrl}`;
        }

        resolve();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        reject(new Error(`Erreur lors du déploiement Azure: ${errorMessage}`));
      }
    });
  }

  /**
   * Déploiement Heroku
   */
  private async deployHeroku(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(chalk.gray("Déploiement sur Heroku..."));

      // Vérifier si Heroku CLI est installé
      try {
        execSync("heroku --version", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("Heroku CLI n'est pas installé ou n'est pas accessible"));
        return;
      }

      // Vérifier si l'utilisateur est connecté à Heroku
      try {
        execSync("heroku auth:whoami", { stdio: "ignore" });
      } catch (err) {
        reject(new Error("Vous n'êtes pas connecté à Heroku. Exécutez 'heroku login' d'abord."));
        return;
      }

      try {
        // Nom de l'application Heroku
        const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");

        // Vérifier si l'application existe
        let appExists = false;
        try {
          execSync(`heroku apps:info --app ${appName}`, { stdio: "ignore" });
          appExists = true;
        } catch (e) {
          // L'application n'existe pas
        }

        if (!appExists) {
          // Créer l'application
          this.log(chalk.gray(`Création de l'application Heroku: ${appName}`));
          execSync(`heroku apps:create ${appName}`, { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Définir les variables d'environnement
        this.log(chalk.gray(`Définition du profil Spring: ${this.options.profile}`));
        execSync(`heroku config:set SPRING_PROFILES_ACTIVE=${this.options.profile} --app ${appName}`,
                { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Vérifier si Git est initialisé
        let isGitRepo = false;
        try {
          execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
          isGitRepo = true;
        } catch (e) {
          // Ce n'est pas un dépôt Git
        }

        if (!isGitRepo) {
          // Initialiser Git
          this.log(chalk.gray("Initialisation du dépôt Git..."));
          execSync("git init", { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Vérifier si Heroku est défini comme remote
        let hasHerokuRemote = false;
        try {
          const remotes = execSync("git remote").toString().trim().split("\n");
          hasHerokuRemote = remotes.includes("heroku");
        } catch (e) {
          // Pas de remote ou erreur
        }

        if (!hasHerokuRemote) {
          // Ajouter le remote Heroku
          this.log(chalk.gray("Ajout du remote Heroku..."));
          execSync(`heroku git:remote --app ${appName}`, { stdio: this.options.verbose ? "inherit" : "pipe" });
        }

        // Ajouter tous les fichiers
        this.log(chalk.gray("Préparation des fichiers pour le déploiement..."));
        execSync("git add .", { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Créer un commit si nécessaire
        try {
          execSync("git commit -m \"Deploy to Heroku\"", { stdio: this.options.verbose ? "inherit" : "pipe" });
        } catch (e) {
          // Pas de modifications ou autre erreur
        }

        // Pousser vers Heroku
        this.log(chalk.gray("Déploiement vers Heroku..."));
        execSync("git push heroku master --force", { stdio: this.options.verbose ? "inherit" : "pipe" });

        // Obtenir l'URL de l'application
        this.log(chalk.gray("Récupération de l'URL de l'application..."));
        const appUrl = execSync(`heroku apps:info --app ${appName} --json`).toString();
        const appInfo = JSON.parse(appUrl);

        if (appInfo && appInfo.app && appInfo.app.web_url) {
          this.deployStats.targetUrl = appInfo.app.web_url;
        }

        resolve();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        reject(new Error(`Erreur lors du déploiement Heroku: ${errorMessage}`));
      }
    });
  }

  /**
   * Méthode finale : affichage des résultats
   */
  async end() {
    if (!this.deployStats.success) {
      this.log(chalk.red("\n❌ Le déploiement a échoué. Veuillez consulter les logs pour plus d'informations."));
      return;
    }

    // Afficher un résumé du déploiement
    this.log("\n" + chalk.bold.underline("📋 Résumé du Déploiement"));
    this.log(chalk.green(`✓ Déploiement terminé avec succès vers ${this.deployTarget}`));
    this.log(chalk.gray(`⏱️ Durée totale: ${this.deployStats.duration} secondes`));

    if (this.deployStats.targetUrl) {
      this.log(chalk.cyan(`🌐 Application accessible à: ${this.deployStats.targetUrl}`));
    }

    // Afficher des conseils spécifiques à la cible
    switch (this.deployTarget) {
      case 'local':
        this.log(chalk.gray("\nPour arrêter l'application, utilisez Ctrl+C ou trouvez le processus Java avec:"));
        this.log(chalk.white("  ps aux | grep java"));
        break;

      case 'docker':
        const appName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
        const containerName = `${appName}-${this.options.profile}`;
        this.log(chalk.gray("\nPour voir les logs du conteneur:"));
        this.log(chalk.white(`  docker logs ${containerName}`));
        this.log(chalk.gray("Pour arrêter le conteneur:"));
        this.log(chalk.white(`  docker stop ${containerName}`));
        break;

      case 'kubernetes':
        this.log(chalk.gray("\nPour voir les pods déployés:"));
        this.log(chalk.white("  kubectl get pods"));
        this.log(chalk.gray("Pour voir les logs d'un pod:"));
        this.log(chalk.white("  kubectl logs <nom-du-pod>"));
        break;

      case 'aws':
        this.log(chalk.gray("\nPour voir les logs de l'application:"));
        this.log(chalk.white("  aws elasticbeanstalk request-environment-info --info-type tail --environment-name <nom-env>"));
        break;

      case 'azure':
        const azureAppName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
        const azureResourceGroup = `${azureAppName}-rg`;
        this.log(chalk.gray("\nPour voir les logs de l'application:"));
        this.log(chalk.white(`  az webapp log tail --name ${azureAppName} --resource-group ${azureResourceGroup}`));
        break;

      case 'heroku':
        const herokuAppName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9]/g, "-");
        this.log(chalk.gray("\nPour voir les logs de l'application:"));
        this.log(chalk.white(`  heroku logs --tail --app ${herokuAppName}`));
        break;
    }

    // Afficher des conseils généraux
    this.log("\n" + chalk.bold.underline("🔍 Surveillance de l'Application"));
    this.log(chalk.gray("Assurez-vous de configurer la surveillance de votre application en production."));
    this.log(chalk.gray("Vous pouvez utiliser:"));
    this.log(chalk.gray("- Spring Boot Actuator pour les endpoints de monitoring"));
    this.log(chalk.gray("- Prometheus pour la collecte de métriques"));
    this.log(chalk.gray("- Grafana pour la visualisation des métriques"));

    // Afficher la section de fin
    displaySectionEnd();
  }
}
