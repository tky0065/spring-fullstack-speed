/**
 * Générateur pour la commande 'sfs plugins'
 * Permet de gérer les plugins et extensions pour Spring-Fullstack-Speed
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createSpinner, displaySectionTitle, displaySectionEnd } from "../../utils/cli-ui.js";
import { withKeyboardInput, showNavigableMenu } from "../../utils/cli-navigation.js";
import boxen from "boxen";

// Interface pour les options du générateur
interface PluginsOptions {
  list?: boolean;
  add?: string;
  remove?: string;
  update?: string;
  info?: string;
}

/**
 * Structure d'un plugin Spring-Fullstack
 */
interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  commands: string[];
  templates?: string[];
  dependencies?: Record<string, string>;
  installed?: boolean;
  official?: boolean;
}

/**
 * Générateur pour gérer les plugins et extensions
 */
export default class PluginsGenerator extends BaseGenerator {
  // Déclaration des options avec les types corrects
  declare options: any;

  // Propriétés internes
  private pluginsDir: string;
  private configFile: string;
  private plugins: Plugin[] = [];
  private officialPlugins: Plugin[] = [
    {
      name: "sfs-cloud-aws",
      version: "1.0.0",
      description: "Ajoute le support pour AWS (S3, Lambda, etc)",
      author: "Spring-Fullstack Team",
      repository: "https://github.com/spring-fullstack/sfs-cloud-aws",
      commands: ["aws"],
      templates: ["aws"],
      dependencies: {
        "aws-sdk": "^2.1000.0"
      },
      official: true
    },
    {
      name: "sfs-security-audit",
      version: "1.0.0",
      description: "Ajoute des outils d'audit de sécurité pour votre application",
      author: "Spring-Fullstack Team",
      repository: "https://github.com/spring-fullstack/sfs-security-audit",
      commands: ["audit"],
      templates: ["security-audit"],
      dependencies: {
        "snyk": "^1.1000.0"
      },
      official: true
    },
    {
      name: "sfs-graphql",
      version: "1.0.0",
      description: "Ajoute le support GraphQL à votre projet Spring Boot",
      author: "Spring-Fullstack Team",
      repository: "https://github.com/spring-fullstack/sfs-graphql",
      commands: ["graphql"],
      templates: ["graphql"],
      dependencies: {
        "graphql": "^16.6.0"
      },
      official: true
    }
  ];

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
    this.option("list", {
      type: Boolean,
      description: "Liste tous les plugins disponibles",
      default: false,
      alias: "l"
    });

    this.option("add", {
      type: String,
      description: "Ajoute un plugin",
      alias: "a"
    });

    this.option("remove", {
      type: String,
      description: "Supprime un plugin",
      alias: "r"
    });

    this.option("update", {
      type: String,
      description: "Met à jour un plugin",
      alias: "u"
    });

    this.option("info", {
      type: String,
      description: "Affiche des informations sur un plugin",
      alias: "i"
    });

    // Initialiser les chemins des fichiers
    this.pluginsDir = path.join(this.destinationPath(), ".sfs", "plugins");
    this.configFile = path.join(this.destinationPath(), ".sfs", "plugins.json");
  }

  /**
   * Initialisation du générateur
   */
  async initializing() {
    displaySectionTitle("Gestionnaire de plugins Spring-Fullstack");

    // Créer les dossiers s'ils n'existent pas
    await this.ensurePluginsStructure();

    // Charger les plugins installés
    await this.loadPlugins();

    // Marquer les plugins officiels qui sont installés
    this.markInstalledPlugins();

    // Si aucune option n'est spécifiée, afficher le menu interactif
    if (!this.options.list && !this.options.add && !this.options.remove &&
        !this.options.update && !this.options.info) {
      await this.showInteractiveMenu();
    }
  }

  /**
   * Créer la structure des dossiers pour les plugins
   */
  async ensurePluginsStructure() {
    const baseDir = path.join(this.destinationPath(), ".sfs");

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }

    // Créer le fichier de configuration s'il n'existe pas
    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify({ plugins: [] }, null, 2));
    }
  }

  /**
   * Charger les plugins installés depuis le fichier de configuration
   */
  async loadPlugins() {
    try {
      const configData = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      this.plugins = configData.plugins || [];
    } catch (error) {
      this.log(chalk.yellow("⚠️ Erreur lors du chargement des plugins. Réinitialisation de la configuration."));
      this.plugins = [];
      await this.savePlugins();
    }
  }

  /**
   * Marquer les plugins officiels qui sont déjà installés
   */
  markInstalledPlugins() {
    const installedNames = this.plugins.map(p => p.name);

    this.officialPlugins = this.officialPlugins.map(plugin => ({
      ...plugin,
      installed: installedNames.includes(plugin.name)
    }));
  }

  /**
   * Sauvegarder les plugins dans le fichier de configuration
   */
  async savePlugins() {
    fs.writeFileSync(this.configFile, JSON.stringify({ plugins: this.plugins }, null, 2));
  }

  /**
   * Afficher le menu interactif
   */
  async showInteractiveMenu() {
    const choices = [
      { name: "📋 Lister les plugins disponibles et installés", value: "list" },
      { name: "➕ Installer un plugin", value: "add" },
      { name: "🔄 Mettre à jour un plugin", value: "update" },
      { name: "➖ Supprimer un plugin", value: "remove" },
      { name: "ℹ️ Afficher des informations sur un plugin", value: "info" },
      { name: "❌ Quitter", value: "quit" }
    ];

    const { action } = await this.prompt({
      type: "list",
      name: "action",
      message: "Que souhaitez-vous faire?",
      choices
    });

    switch (action) {
      case "list":
        await this.listPlugins();
        break;
      case "add":
        await this.showAddPluginMenu();
        break;
      case "update":
        await this.showUpdatePluginMenu();
        break;
      case "remove":
        await this.showRemovePluginMenu();
        break;
      case "info":
        await this.showPluginInfoMenu();
        break;
      case "quit":
        this.log(chalk.gray("Au revoir!"));
        process.exit(0);
        break;
    }
  }

  /**
   * Lister tous les plugins
   */
  async listPlugins() {
    if (this.plugins.length === 0 && this.officialPlugins.filter(p => !p.installed).length === 0) {
      this.log(chalk.yellow("\n⚠️ Aucun plugin disponible ou installé."));
      return;
    }

    // Afficher les plugins installés
    if (this.plugins.length > 0) {
      this.log(chalk.bold("\n📦 Plugins installés:"));
      this.plugins.forEach(plugin => {
        const isOfficial = this.officialPlugins.some(p => p.name === plugin.name);
        const badge = isOfficial ? chalk.blue("[Officiel] ") : chalk.gray("[Communauté] ");

        this.log(`${chalk.green("✓")} ${badge}${chalk.bold(plugin.name)} ${chalk.gray(`v${plugin.version}`)}`);
        this.log(`   ${chalk.gray(plugin.description)}`);
      });
    } else {
      this.log(chalk.yellow("\n⚠️ Aucun plugin n'est actuellement installé."));
    }

    // Afficher les plugins officiels non installés
    const availablePlugins = this.officialPlugins.filter(p => !p.installed);
    if (availablePlugins.length > 0) {
      this.log(chalk.bold("\n🛍️ Plugins officiels disponibles:"));
      availablePlugins.forEach(plugin => {
        this.log(`${chalk.yellow("○")} ${chalk.blue("[Officiel] ")}${chalk.bold(plugin.name)} ${chalk.gray(`v${plugin.version}`)}`);
        this.log(`   ${chalk.gray(plugin.description)}`);
      });
    }

    // Si appelé via la ligne de commande, on s'arrête ici
    if (this.options.list) {
      return;
    }

    // Sinon, afficher un menu pour revenir au menu principal
    await this.prompt({
      type: "confirm",
      name: "back",
      message: "Retour au menu principal?",
      default: true
    });

    await this.showInteractiveMenu();
  }

  /**
   * Afficher le menu pour ajouter un plugin
   */
  async showAddPluginMenu() {
    // Récupérer les plugins disponibles (non installés)
    const availablePlugins = this.officialPlugins.filter(p => !p.installed);

    if (availablePlugins.length === 0) {
      this.log(chalk.yellow("\n⚠️ Tous les plugins officiels sont déjà installés."));
      this.log(chalk.gray("Vous pouvez également ajouter un plugin personnalisé depuis un dépôt Git."));

      const { customPlugin } = await this.prompt({
        type: "confirm",
        name: "customPlugin",
        message: "Voulez-vous installer un plugin depuis un dépôt Git?",
        default: false
      });

      if (customPlugin) {
        await this.addCustomPlugin();
      } else {
        await this.showInteractiveMenu();
      }

      return;
    }

    // Préparer les choix pour le menu
    const choices = availablePlugins.map(plugin => ({
      name: `${plugin.name} - ${plugin.description} ${chalk.gray(`(v${plugin.version})`)}`,
      value: plugin.name
    }));

    choices.push({ name: "📂 Installer depuis un dépôt Git", value: "custom" });
    choices.push({ name: "⬅️ Retour au menu principal", value: "back" });

    const { pluginToAdd } = await this.prompt({
      type: "list",
      name: "pluginToAdd",
      message: "Quel plugin souhaitez-vous installer?",
      choices
    });

    if (pluginToAdd === "back") {
      await this.showInteractiveMenu();
      return;
    }

    if (pluginToAdd === "custom") {
      await this.addCustomPlugin();
      return;
    }

    // Ajouter le plugin sélectionné
    await this.addPlugin(pluginToAdd);
  }

  /**
   * Ajouter un plugin personnalisé depuis un dépôt Git
   */
  async addCustomPlugin() {
    const { repoUrl } = await this.prompt({
      type: "input",
      name: "repoUrl",
      message: "URL du dépôt Git du plugin:",
      validate: (input: string) => {
        if (!input) return "L'URL du dépôt est requise";
        if (!input.match(/^(https?:\/\/|git@)/)) return "Format de l'URL non valide";
        return true;
      }
    });

    const spinner = createSpinner({
      text: `Installation du plugin depuis ${repoUrl}...`,
      color: "primary"
    });

    try {
      // Extraire le nom du plugin depuis l'URL
      const pluginName = repoUrl.split('/').pop()?.replace('.git', '') || `plugin-${Date.now()}`;
      const pluginDir = path.join(this.pluginsDir, pluginName);

      // Cloner le dépôt dans le dossier des plugins
      execSync(`git clone ${repoUrl} "${pluginDir}"`, {
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      // Vérifier que le plugin a une structure valide
      const pluginJsonPath = path.join(pluginDir, "plugin.json");
      if (!fs.existsSync(pluginJsonPath)) {
        throw new Error("Le dépôt ne contient pas un fichier plugin.json valide");
      }

      // Charger les informations du plugin
      const pluginInfo = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

      // Installer les dépendances du plugin
      if (fs.existsSync(path.join(pluginDir, "package.json"))) {
        execSync("npm install", {
          cwd: pluginDir,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
      }

      // Ajouter le plugin à la liste des plugins installés
      this.plugins.push({
        name: pluginInfo.name || pluginName,
        version: pluginInfo.version || "1.0.0",
        description: pluginInfo.description || "Plugin personnalisé",
        author: pluginInfo.author || "Inconnu",
        repository: repoUrl,
        commands: pluginInfo.commands || [],
        templates: pluginInfo.templates || [],
        dependencies: pluginInfo.dependencies || {}
      });

      await this.savePlugins();

      spinner.succeed(`Plugin ${chalk.bold(pluginInfo.name || pluginName)} installé avec succès!`);

      // Revenir au menu principal
      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    } catch (error: any) {
      spinner.fail(`Erreur lors de l'installation du plugin: ${error.message}`);

      // Revenir au menu principal
      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    }
  }

  /**
   * Ajouter un plugin officiel
   */
  async addPlugin(pluginName: string) {
    const plugin = this.officialPlugins.find(p => p.name === pluginName);

    if (!plugin) {
      this.log(chalk.red(`❌ Plugin "${pluginName}" introuvable.`));
      return;
    }

    const spinner = createSpinner({
      text: `Installation du plugin ${pluginName}...`,
      color: "primary"
    });

    try {
      // Créer le dossier du plugin
      const pluginDir = path.join(this.pluginsDir, pluginName);
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
      }

      // Simuler le téléchargement (dans une vraie implémentation, on clonerait depuis le dépôt)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simuler l'installation des dépendances
      if (plugin.dependencies && Object.keys(plugin.dependencies).length > 0) {
        spinner.text = "Installation des dépendances...";
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Créer un fichier de configuration factice pour le plugin
      fs.writeFileSync(
        path.join(pluginDir, "plugin.json"),
        JSON.stringify(plugin, null, 2)
      );

      // Ajouter le plugin à la liste des plugins installés
      this.plugins.push({
        ...plugin,
        installed: true
      });

      // Mettre à jour la liste des plugins officiels
      this.markInstalledPlugins();

      // Sauvegarder les changements
      await this.savePlugins();

      spinner.succeed(`Plugin ${chalk.bold(pluginName)} installé avec succès!`);

      // Revenir au menu principal
      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    } catch (error: any) {
      spinner.fail(`Erreur lors de l'installation du plugin: ${error.message}`);

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    }
  }

  /**
   * Afficher le menu pour mettre à jour un plugin
   */
  async showUpdatePluginMenu() {
    if (this.plugins.length === 0) {
      this.log(chalk.yellow("\n⚠️ Aucun plugin n'est installé."));

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
      return;
    }

    // Préparer les choix pour le menu
    const choices = this.plugins.map(plugin => ({
      name: `${plugin.name} ${chalk.gray(`(v${plugin.version})`)}`,
      value: plugin.name
    }));

    choices.push({ name: "⬅️ Retour au menu principal", value: "back" });

    const { pluginToUpdate } = await this.prompt({
      type: "list",
      name: "pluginToUpdate",
      message: "Quel plugin souhaitez-vous mettre à jour?",
      choices
    });

    if (pluginToUpdate === "back") {
      await this.showInteractiveMenu();
      return;
    }

    // Mettre à jour le plugin sélectionné
    await this.updatePlugin(pluginToUpdate);
  }

  /**
   * Mettre à jour un plugin
   */
  async updatePlugin(pluginName: string) {
    const plugin = this.plugins.find(p => p.name === pluginName);

    if (!plugin) {
      this.log(chalk.red(`❌ Plugin "${pluginName}" introuvable.`));
      return;
    }

    const spinner = createSpinner({
      text: `Mise à jour du plugin ${pluginName}...`,
      color: "primary"
    });

    try {
      // Simuler la mise à jour du plugin
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mettre à jour la version du plugin
      const oldVersion = plugin.version;
      const versionParts = oldVersion.split('.').map(Number);
      versionParts[2] += 1; // Incrémenter la version patch
      plugin.version = versionParts.join('.');

      // Sauvegarder les changements
      await this.savePlugins();

      spinner.succeed(`Plugin ${chalk.bold(pluginName)} mis à jour avec succès (${oldVersion} → ${plugin.version})!`);

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    } catch (error: any) {
      spinner.fail(`Erreur lors de la mise à jour du plugin: ${error.message}`);

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    }
  }

  /**
   * Afficher le menu pour supprimer un plugin
   */
  async showRemovePluginMenu() {
    if (this.plugins.length === 0) {
      this.log(chalk.yellow("\n⚠️ Aucun plugin n'est installé."));

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
      return;
    }

    // Préparer les choix pour le menu
    const choices = this.plugins.map(plugin => ({
      name: `${plugin.name} ${chalk.gray(`(v${plugin.version})`)}`,
      value: plugin.name
    }));

    choices.push({ name: "⬅️ Retour au menu principal", value: "back" });

    const { pluginToRemove } = await this.prompt({
      type: "list",
      name: "pluginToRemove",
      message: "Quel plugin souhaitez-vous supprimer?",
      choices
    });

    if (pluginToRemove === "back") {
      await this.showInteractiveMenu();
      return;
    }

    const { confirmRemove } = await this.prompt({
      type: "confirm",
      name: "confirmRemove",
      message: `Êtes-vous sûr de vouloir supprimer le plugin ${pluginToRemove}?`,
      default: false
    });

    if (confirmRemove) {
      await this.removePlugin(pluginToRemove);
    } else {
      await this.showRemovePluginMenu();
    }
  }

  /**
   * Supprimer un plugin
   */
  async removePlugin(pluginName: string) {
    const plugin = this.plugins.find(p => p.name === pluginName);

    if (!plugin) {
      this.log(chalk.red(`❌ Plugin "${pluginName}" introuvable.`));
      return;
    }

    const spinner = createSpinner({
      text: `Suppression du plugin ${pluginName}...`,
      color: "primary"
    });

    try {
      // Supprimer le dossier du plugin
      const pluginDir = path.join(this.pluginsDir, pluginName);
      if (fs.existsSync(pluginDir)) {
        fs.rmSync(pluginDir, { recursive: true, force: true });
      }

      // Supprimer le plugin de la liste des plugins installés
      this.plugins = this.plugins.filter(p => p.name !== pluginName);

      // Mettre à jour les plugins officiels
      this.markInstalledPlugins();

      // Sauvegarder les changements
      await this.savePlugins();

      spinner.succeed(`Plugin ${chalk.bold(pluginName)} supprimé avec succès!`);

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    } catch (error: any) {
      spinner.fail(`Erreur lors de la suppression du plugin: ${error.message}`);

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
    }
  }

  /**
   * Afficher le menu pour obtenir des informations sur un plugin
   */
  async showPluginInfoMenu() {
    // Préparer les choix pour le menu (plugins installés et officiels)
    const allPlugins = [
      ...this.plugins,
      ...this.officialPlugins.filter(p => !p.installed)
    ];

    if (allPlugins.length === 0) {
      this.log(chalk.yellow("\n⚠️ Aucun plugin disponible."));

      await this.prompt({
        type: "confirm",
        name: "back",
        message: "Retour au menu principal?",
        default: true
      });

      await this.showInteractiveMenu();
      return;
    }

    const choices = allPlugins.map(plugin => {
      const installed = this.plugins.some(p => p.name === plugin.name);
      return {
        name: `${installed ? chalk.green("✓") : chalk.yellow("○")} ${plugin.name} ${chalk.gray(`(v${plugin.version})`)}`,
        value: plugin.name
      };
    });

    choices.push({ name: "⬅️ Retour au menu principal", value: "back" });

    const { pluginName } = await this.prompt({
      type: "list",
      name: "pluginName",
      message: "Sur quel plugin souhaitez-vous des informations?",
      choices
    });

    if (pluginName === "back") {
      await this.showInteractiveMenu();
      return;
    }

    await this.showPluginInfo(pluginName);
  }

  /**
   * Afficher les informations sur un plugin
   */
  async showPluginInfo(pluginName: string) {
    const plugin = [...this.plugins, ...this.officialPlugins.filter(p => !p.installed)]
      .find(p => p.name === pluginName);

    if (!plugin) {
      this.log(chalk.red(`❌ Plugin "${pluginName}" introuvable.`));
      return;
    }

    const isInstalled = this.plugins.some(p => p.name === pluginName);
    const isOfficial = this.officialPlugins.some(p => p.name === pluginName);

    // Formatter les informations du plugin
    const info = [
      `${chalk.bold('Nom')}: ${plugin.name}`,
      `${chalk.bold('Version')}: ${plugin.version}`,
      `${chalk.bold('Description')}: ${plugin.description}`,
      `${chalk.bold('Auteur')}: ${plugin.author}`,
      plugin.repository ? `${chalk.bold('Dépôt')}: ${plugin.repository}` : '',
      `${chalk.bold('Commandes')}: ${plugin.commands?.join(', ') || 'Aucune'}`,
      `${chalk.bold('Templates')}: ${plugin.templates?.join(', ') || 'Aucun'}`,
      `${chalk.bold('Statut')}: ${isInstalled ? chalk.green('Installé') : chalk.yellow('Non installé')}`,
      `${chalk.bold('Type')}: ${isOfficial ? chalk.blue('Officiel') : chalk.gray('Communauté')}`
    ].filter(Boolean).join('\n');

    const pluginInfoBox = boxen(info, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: isInstalled ? 'green' : 'yellow',
      title: `Plugin: ${plugin.name}`,
      titleAlignment: 'center'
    });

    this.log(pluginInfoBox);

    // Si le plugin n'est pas installé, proposer de l'installer
    if (!isInstalled) {
      const { installNow } = await this.prompt({
        type: "confirm",
        name: "installNow",
        message: "Voulez-vous installer ce plugin?",
        default: false
      });

      if (installNow) {
        await this.addPlugin(pluginName);
        return;
      }
    }

    await this.prompt({
      type: "confirm",
      name: "back",
      message: "Retour au menu principal?",
      default: true
    });

    await this.showInteractiveMenu();
  }

  /**
   * Méthode principale d'exécution
   */
  async prompting() {
    // Si des options sont spécifiées, exécuter les actions correspondantes
    if (this.options.list) {
      await this.listPlugins();
    }
    else if (this.options.add) {
      await this.addPlugin(this.options.add);
    }
    else if (this.options.remove) {
      // Demander confirmation pour la suppression
      const { confirmRemove } = await this.prompt({
        type: "confirm",
        name: "confirmRemove",
        message: `Êtes-vous sûr de vouloir supprimer le plugin ${this.options.remove}?`,
        default: false
      });

      if (confirmRemove) {
        await this.removePlugin(this.options.remove);
      }
    }
    else if (this.options.update) {
      await this.updatePlugin(this.options.update);
    }
    else if (this.options.info) {
      await this.showPluginInfo(this.options.info);
    }
  }

  /**
   * Phase de fin d'exécution
   */
  end() {
    displaySectionEnd();

    // N'afficher le message de fin que si nous n'utilisons pas le menu interactif
    if (this.options.list || this.options.add || this.options.remove ||
        this.options.update || this.options.info) {
      this.log(chalk.green("✓ Opération terminée avec succès!"));
    }
  }
}
