import { BaseGenerator } from "../base-generator.js";
import Generator from "yeoman-generator";
import chalk from "chalk";

export default class EntityGenerator extends BaseGenerator {
  // Initialisation de entityName pour éviter l'erreur "has no initializer"
  entityName: string = "";
  // Utilisation de declare pour indiquer qu'il s'agit d'une redéfinition intentionnelle
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur d'entités
    this.option("name", {
      description: "Nom de l'entité",
      type: String,
    });

    this.argument("name", {
      type: String,
      required: false,
      description: "Nom de l'entité à générer",
    });
  }

  initializing() {
    this.log(chalk.blue("Initialisation du générateur d'entités..."));
    this.entityName = (this.options as any).name || "";
  }

  async prompting() {
    // Définition des questions avec le type any pour éviter l'erreur de typage
    const prompts: any = [
      {
        type: "input",
        name: "entityName",
        message: "Quel est le nom de votre entité?",
        default: this.entityName || "Entity",
        validate: (input) => {
          if (/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return true;
          }
          return "Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres et des chiffres.";
        },
        when: () => !this.entityName,
      },
      {
        type: "confirm",
        name: "createRepository",
        message: "Voulez-vous créer un repository pour cette entité?",
        default: true,
      },
      {
        type: "confirm",
        name: "createService",
        message: "Voulez-vous créer un service pour cette entité?",
        default: true,
      },
      {
        type: "confirm",
        name: "createController",
        message: "Voulez-vous créer un contrôleur REST pour cette entité?",
        default: true,
      },
    ];

    if (!this.entityName) {
      const answers = await this.prompt(prompts.filter((p) => !p.when || p.when()));
      this.answers = {
        ...answers,
        entityName: answers.entityName || this.entityName,
      };
    } else {
      this.answers = {
        entityName: this.entityName,
        createRepository: true,
        createService: true,
        createController: true,
      };

      // Si le nom est fourni, demander les autres questions
      const filteredPrompts = prompts.filter((p) => p.name !== "entityName");
      const otherAnswers = await this.prompt(filteredPrompts);
      this.answers = { ...this.answers, ...otherAnswers };
    }
  }

  writing() {
    const { entityName, createRepository, createService, createController } =
      this.answers;

    this.log(chalk.green(`Génération de l'entité ${entityName}...`));

    // À développer ultérieurement avec la génération de fichiers réels
    this.log(chalk.yellow("Cette fonctionnalité n'est pas encore entièrement implémentée."));
  }

  end() {
    this.log(chalk.green(`✅ Entité ${this.answers.entityName} générée avec succès!`));
  }
}
