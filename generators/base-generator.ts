import Generator from "yeoman-generator";
import chalk from "chalk";
import path from "path";
import fs from "fs";

/**
 * Classe de base pour tous les générateurs SFS (Spring-Fullstack-Speed)
 * Contient des méthodes utilitaires communes à tous les générateurs
 */
export class BaseGenerator extends Generator {
  // Propriétés communes à tous les générateurs
  answers: any = {};
  destinationRoot(): string;
  destinationRoot(rootPath?: string): this;
  destinationRoot(rootPath?: string): string | this {
    return super.destinationRoot(rootPath);
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
   */
  copyTemplate(
    source: string,
    destination: string,
    context: any = this.answers
  ): void {
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
}
