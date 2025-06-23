import Generator from "yeoman-generator";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import {
  renderTemplate,
  renderTemplateFile, // Correction du nom de la fonction (renderTemplateToFile -> renderTemplateFile)
  validateTemplate,
  buildTemplateContext,
  getOutputFilename,
} from "../utils/template-engine.js";
import {
  GlobalConfig,
  DEFAULT_CONFIG,
  validateConfig,
  extendConfig,
  DATABASE_OPTIONS,
  FRONTEND_OPTIONS,
  BUILD_TOOL_OPTIONS,
  ADDITIONAL_FEATURES,
} from "../utils/config.js";


/**
 * Classe de base pour tous les générateurs SFS (Spring-Fullstack-Speed)
 * Contient des méthodes utilitaires communes à tous les générateurs
 */
export class BaseGenerator extends Generator {
  // Propriétés communes à tous les générateurs
  declare answers: any;
  // Contexte global pour les templates
  templateContext: Record<string, any> = {};
  // Configuration globale (renommée pour éviter le conflit avec config de Generator)
  appConfig: GlobalConfig = {
    ...DEFAULT_CONFIG,
    authType: 'JWT' // Ajout de la propriété authType requise
  };
  // Indicateur de mode test
  isTestMode: boolean = false;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Vérifier si nous sommes en environnement de test
    this.isTestMode = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

    // En mode test, augmenter la limite d'écouteurs d'événements pour éviter les avertissements
    if (this.isTestMode) {
      // Accéder au module events pour augmenter la limite maximale d'écouteurs
      try {
        const events = require('events');
        events.EventEmitter.defaultMaxListeners = 25;
        this.log(chalk.yellow("[TEST MODE] Increased event listeners limit to 25"));
      } catch (error) {
        this.log(chalk.red("Failed to increase event listeners limit"));
      }
    }
  }

  // Constants exportées pour tous les générateurs
  readonly DATABASE_OPTIONS = DATABASE_OPTIONS;
  readonly FRONTEND_OPTIONS = FRONTEND_OPTIONS;
  readonly BUILD_TOOL_OPTIONS = BUILD_TOOL_OPTIONS;
  readonly ADDITIONAL_FEATURES = ADDITIONAL_FEATURES;

  destinationRoot(): string;
  destinationRoot(rootPath?: string): this;
  destinationRoot(rootPath?: string): string | this {
    return super.destinationRoot(rootPath);
  }

  /**
   * Initialisation de la configuration avec les réponses de l'utilisateur
   */
  initConfig(): void {
    // Valider et intégrer les réponses de l'utilisateur dans la configuration
    this.appConfig = validateConfig(this.answers);
  }

  /**
   * Étend la configuration avec des options avancées
   * @param advancedConfig Configuration avancée à fusionner
   */
  extendConfig(advancedConfig: Record<string, any> = {}): void {
    this.appConfig = extendConfig(this.appConfig, advancedConfig);
  }

  /**
   * Initialisation du contexte de template avec les fonctions helper
   * et la configuration globale
   */
  initTemplateContext(): void {
    // S'assurer que la configuration est initialisée
    if (Object.keys(this.appConfig).length === 0 && Object.keys(this.answers).length > 0) {
      this.initConfig();
    }

    // Fusionner les données des réponses, la configuration et les helpers
    const baseContext = {
      ...this.answers,
      config: this.appConfig,
      // Ajouter des raccourcis pour les vérifications fréquentes
      isMaven: this.appConfig.buildTool === BUILD_TOOL_OPTIONS.MAVEN,
      isGradle: this.appConfig.buildTool === BUILD_TOOL_OPTIONS.GRADLE,
      isReactInertia: this.appConfig.frontendFramework === FRONTEND_OPTIONS.REACT,
      isVueInertia: this.appConfig.frontendFramework === FRONTEND_OPTIONS.VUE,
      isAngular: this.appConfig.frontendFramework === FRONTEND_OPTIONS.ANGULAR,
      isThymeleaf: this.appConfig.frontendFramework === FRONTEND_OPTIONS.THYMELEAF,
      isJTE: this.appConfig.frontendFramework === FRONTEND_OPTIONS.JTE,
      isApiOnly: this.appConfig.frontendFramework === FRONTEND_OPTIONS.NONE,
      isMySQL: this.appConfig.database === DATABASE_OPTIONS.MYSQL,
      isPostgreSQL: this.appConfig.database === DATABASE_OPTIONS.POSTGRESQL,
      isMongoDB: this.appConfig.database === DATABASE_OPTIONS.MONGODB,
      isH2: this.appConfig.database === DATABASE_OPTIONS.H2,
      hasFeature: (feature: string) => this.appConfig.additionalFeatures.includes(feature),
    };

    // Construire le contexte avec les données de base et les helpers
    this.templateContext = buildTemplateContext(baseContext);
  }

  /**
   * Récupère le chemin de base des templates
   */
  getTemplatePath(subpath: string): string {
    return path.join(this.templatePath(), subpath);
  }

  /**
   * Vérifie si un fichier existe
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Affiche un message d'erreur
   */
  error(message: string): void {
    this.log(chalk.red(`🚫 Erreur: ${message}`));
  }

  /**
   * Affiche un message de succès
   */
  success(message: string): void {
    this.log(chalk.green(`✅ ${message}`));
  }

  /**
   * Affiche un message d'information
   */
  info(message: string): void {
    this.log(chalk.blue(`ℹ️ ${message}`));
  }

  /**
   * Affiche un message d'avertissement
   */
  warning(message: string): void {
    this.log(chalk.yellow(`⚠️ ${message}`));
  }

  /**
   * Copie un template en remplaçant les variables
   * Utilise le contexte global ou un contexte fourni
   */
  copyTemplate(
    source: string,
    destination: string,
    context: any = this.templateContext
  ): void {
    // Vérifie si le contexte a été initialisé
    if (Object.keys(this.templateContext).length === 0) {
      this.initTemplateContext();
    }

    this.fs.copyTpl(
      this.templatePath(source),
      this.destinationPath(destination),
      context
    );
  }

  /**
   * Copie un fichier sans remplacer les variables
   */
  copyFile(source: string, destination: string): void {
    this.fs.copy(this.templatePath(source), this.destinationPath(destination));
  }

  /**
   * Crée un dossier s'il n'existe pas
   */
  createDirectory(dir: string): void {
    const destinationPath = this.destinationPath(dir);
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
  }

  /**
   * Valide un template EJS
   * @param templatePath Chemin relatif du template
   */
  async validateTemplate(templatePath: string): Promise<boolean> {
    const fullPath = this.templatePath(templatePath);
    return await validateTemplate(fullPath);
  }

  /**
   * Rendu d'un template avec le moteur EJS
   * Renommé pour éviter les conflits avec la méthode native de Yeoman
   * @param templatePath Chemin relatif du template
   * @param outputPath Chemin relatif du fichier à générer
   * @param context Contexte pour le rendu (utilise le contexte global par défaut)
   */
  async renderEjsTemplate(
    templatePath: string,
    outputPath: string,
    context: Record<string, any> = this.templateContext
  ): Promise<void> {
    // Vérifie si le contexte a été initialisé
    if (Object.keys(this.templateContext).length === 0) {
      this.initTemplateContext();
    }

    const fullTemplatePath = this.templatePath(templatePath);
    const fullOutputPath = this.destinationPath(outputPath);

    // Assurer que le contexte est un objet de type Record<string, any>
    const templateContext: Record<string, any> = typeof context === 'string'
      ? { content: context }
      : context;

    // Récupérer le contenu rendu du template
    const content = await renderTemplateFile(fullTemplatePath, templateContext);

    // S'assurer que le répertoire parent existe
    const dirPath = path.dirname(fullOutputPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Écrire le contenu rendu dans le fichier de destination
    fs.writeFileSync(fullOutputPath, content);
  }

  /**
   * Génère un fichier à partir d'un template,
   * conditionnellement selon une condition fournie
   */
  async renderTemplateIf(
    condition: boolean,
    templatePath: string,
    outputPath: string,
    context: Record<string, any> = this.templateContext
  ): Promise<void> {
    if (condition) {
      await this.renderEjsTemplate(templatePath, outputPath, context);
    }
  }

  /**
   * Génère tous les templates d'un dossier récursivement
   * @param sourceDir Dossier source contenant les templates (relatif au dossier templates)
   * @param outputDir Dossier de destination (relatif au dossier de l'application générée)
   * @param context Contexte pour le rendu (utilise le contexte global par défaut)
   * @param ignore Liste des fichiers/dossiers à ignorer
   */
  async renderTemplateDirectory(
    sourceDir: string,
    outputDir: string,
    context: Record<string, any> = this.templateContext,
    ignore: string[] = []
  ): Promise<void> {
    // Chemin complet du dossier source
    const fullSourceDir = this.templatePath(sourceDir);

    // Vérifier si le dossier source existe
    if (!fs.existsSync(fullSourceDir)) {
      this.error(`Dossier source non trouvé: ${sourceDir}`);
      return;
    }

    // Lire tous les fichiers du dossier source
    await this._processDirectory(fullSourceDir, sourceDir, outputDir, context, ignore);
  }

  /**
   * Méthode interne pour traiter récursivement un dossier de templates
   */
  private async _processDirectory(
    fullSourcePath: string,
    relativePath: string,
    outputDir: string,
    context: Record<string, any>,
    ignore: string[]
  ): Promise<void> {
    const files = fs.readdirSync(fullSourcePath);

    for (const file of files) {
      // Chemin relatif pour les comparaisons avec ignore
      const relativeFilePath = path.join(relativePath, file);

      // Vérifier si le fichier doit être ignoré
      if (ignore.some((pattern) => relativeFilePath.includes(pattern))) {
        continue;
      }

      // Chemin complet pour les opérations
      const fullFilePath = path.join(fullSourcePath, file);
      const stats = fs.statSync(fullFilePath);

      if (stats.isDirectory()) {
        // Créer le dossier de destination
        const newOutputDir = path.join(outputDir, file);
        this.createDirectory(newOutputDir);

        // Traiter récursivement le sous-dossier
        await this._processDirectory(
          fullFilePath,
          relativeFilePath,
          newOutputDir,
          context,
          ignore
        );
      } else if (file.endsWith(".ejs")) {
        // Pour les fichiers .ejs, appliquer le rendu et générer le fichier
        const outputFileName = getOutputFilename(file);
        const outputPath = path.join(outputDir, outputFileName);

        await this.renderEjsTemplate(relativeFilePath, outputPath, context);
      } else {
        // Pour les autres fichiers, simplement les copier
        const outputPath = path.join(outputDir, file);
        this.copyFile(relativeFilePath, outputPath);
      }
    }
  }
}
