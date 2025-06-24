import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';

/**
 * Options spécifiques au générateur de notification
 */
export interface NotificationGeneratorOptions extends SFSOptions {
  notificationTypes?: string[];
  emailProvider?: string;
  [key: string]: any;
}

/**
 * Générateur pour l'intégration des fonctionnalités de notification et communication (Email, WebSocket, Push)
 */
export default class NotificationGenerator extends BaseGenerator {
  // Déclarer les méthodes et propriétés héritées
  declare answers: any;
  declare prompt: (questions: any) => Promise<any>;
  declare fs: any;
  declare destinationPath: (destPath?: string) => string;
  declare templatePath: (tempPath?: string) => string;
  declare packageFolder: string;
  declare packageName: string;

  constructor(args: string | string[], options: NotificationGeneratorOptions) {
    super(args, options);
    
    this.desc('Générateur pour l\'intégration des fonctionnalités de notification et communication');
  }

  initializing() {
    this.log('Initialisation du générateur de notifications...');
  }

  async prompting() {
    const prompts = [
      {
        type: 'checkbox',
        name: 'notificationTypes',
        message: 'Quels types de notifications souhaitez-vous intégrer?',
        choices: [
          { name: 'Email (SMTP)', value: 'email', checked: true },
          { name: 'WebSocket pour temps réel', value: 'websocket' },
          { name: 'Notifications Push', value: 'push' },
          { name: 'Webhooks', value: 'webhooks' },
        ],
        validate: (input: string[]) => {
          return input.length > 0 ? true : 'Veuillez sélectionner au moins un type de notification';
        }
      },
      {
        when: (answers: any) => answers.notificationTypes.includes('email'),
        type: 'list',
        name: 'emailProvider',
        message: 'Quel provider email souhaitez-vous utiliser?',
        choices: [
          { name: 'SMTP standard (JavaMail)', value: 'smtp' },
          { name: 'SendGrid', value: 'sendgrid' },
          { name: 'Mailgun', value: 'mailgun' },
          { name: 'Amazon SES', value: 'ses' },
        ],
        default: 'smtp'
      },
      {
        when: (answers: any) => answers.notificationTypes.includes('email'),
        type: 'input',
        name: 'emailFrom',
        message: 'Adresse email d\'envoi par défaut:',
        default: 'noreply@example.com',
        validate: (input: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) ? true : 'Veuillez entrer une adresse email valide';
        }
      },
      {
        when: (answers: any) => answers.notificationTypes.includes('push'),
        type: 'checkbox',
        name: 'pushProviders',
        message: 'Quels providers de notifications push souhaitez-vous intégrer?',
        choices: [
          { name: 'Firebase Cloud Messaging (FCM)', value: 'fcm', checked: true },
          { name: 'OneSignal', value: 'onesignal' },
        ]
      },
      {
        type: 'confirm',
        name: 'useTemplating',
        message: 'Souhaitez-vous utiliser un système de templates pour les emails/notifications?',
        default: true
      },
      {
        when: (answers: any) => answers.useTemplating,
        type: 'list',
        name: 'templateEngine',
        message: 'Quel moteur de template souhaitez-vous utiliser?',
        choices: [
          { name: 'Thymeleaf', value: 'thymeleaf' },
          { name: 'FreeMarker', value: 'freemarker' },
          { name: 'Handlebars', value: 'handlebars' }
        ],
        default: 'thymeleaf'
      },
      {
        type: 'confirm',
        name: 'asyncNotifications',
        message: 'Souhaitez-vous envoyer les notifications de manière asynchrone?',
        default: true
      },
      {
        type: 'confirm',
        name: 'trackingEnabled',
        message: 'Souhaitez-vous activer le tracking des notifications/emails?',
        default: true
      }
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log('Configuration du système de notification...');

    // Déterminer le package de base du projet
    this.packageName = this.findPackageName() || 'com.example.app';
    this.packageFolder = this.packageName.replace(/\./g, '/');
  }

  async writing() {
    this.log('Génération des fichiers de notification...');

    const { notificationTypes, emailProvider, useTemplating, templateEngine } = this.answers;

    // Création des répertoires
    const mainJavaDir = 'src/main/java';
    const packageDir = `${mainJavaDir}/${this.packageFolder}`;
    const notificationDir = `${packageDir}/notification`;

    this.fs.mkdirp(notificationDir);
    this.fs.mkdirp(`${notificationDir}/controller`);
    this.fs.mkdirp(`${notificationDir}/service`);
    this.fs.mkdirp(`${notificationDir}/dto`);
    this.fs.mkdirp(`${notificationDir}/config`);

    // Configuration générale
    this.fs.copyTpl(
      this.templatePath('NotificationConfig.java.ejs'),
      this.destinationPath(`${notificationDir}/config/NotificationConfig.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // Email
    if (notificationTypes.includes('email')) {
      this._generateEmailService();
    }

    // WebSocket
    if (notificationTypes.includes('websocket')) {
      this._generateWebSocketService();
    }

    // Push Notifications
    if (notificationTypes.includes('push')) {
      this._generatePushNotificationService();
    }

    // Webhooks
    if (notificationTypes.includes('webhooks')) {
      this._generateWebhooksService();
    }

    // Templates pour emails si nécessaire
    if (notificationTypes.includes('email') && useTemplating) {
      this._generateEmailTemplates();
    }

    this.log('✅ Fichiers de notification générés avec succès!');
  }

  install() {
    this.log('Mise à jour des dépendances...');

    const { notificationTypes, emailProvider, pushProviders } = this.answers;
    const isMaven = this.fs.exists(this.destinationPath('pom.xml'));

    if (isMaven) {
      this._updateMavenDependencies();
    } else {
      this._updateGradleDependencies();
    }
  }

  end() {
    this.log('🚀 Configuration du système de notification terminée!');

    const { notificationTypes } = this.answers;

    this.log('\nExemple d\'utilisation:');

    if (notificationTypes.includes('email')) {
      this.log(`
// Exemple d'envoi d'email
@Autowired
private EmailService emailService;

public void sendWelcomeEmail(User user) {
    emailService.sendEmail(
        user.getEmail(),
        "Bienvenue",
        "Bienvenue sur notre plateforme!",
        true
    );
}
`);
    }

    if (notificationTypes.includes('websocket')) {
      this.log(`
// Exemple d'envoi de message WebSocket
@Autowired
private WebSocketService webSocketService;

public void sendNotification(String userId, String message) {
    webSocketService.sendToUser(userId, new WebSocketMessageDTO("notification", message));
}
`);
    }
  }

  // Méthodes privées

  findPackageName(): string | null {
    // Chercher dans Application.java ou un autre fichier Java principal
    const files = this.fs.glob.sync('src/main/java/**/*Application.java');

    if (files.length > 0) {
      const content = this.fs.read(files[0]);
      const match = content.match(/package\s+([\w.]+)/);
      return match ? match[1] : null;
    }

    return null;
  }

  _generateEmailService() {
    const { emailProvider, emailFrom } = this.answers;
    const notificationDir = `src/main/java/${this.packageFolder}/notification`;

    // DTO pour les emails
    this.fs.copyTpl(
      this.templatePath('EmailDTO.java.ejs'),
      this.destinationPath(`${notificationDir}/dto/EmailDTO.java`),
      { ...this.answers, packageName: this.packageName }
    );
    
    // Service d'email
    this.fs.copyTpl(
      this.templatePath('EmailService.java.ejs'),
      this.destinationPath(`${notificationDir}/service/EmailService.java`),
      { ...this.answers, packageName: this.packageName }
    );
    
    // Implémentation spécifique selon le provider
    if (emailProvider === 'smtp') {
      this.fs.copyTpl(
        this.templatePath('SmtpEmailService.java.ejs'),
        this.destinationPath(`${notificationDir}/service/SmtpEmailService.java`),
        { ...this.answers, packageName: this.packageName }
      );
    } else {
      // Pour les autres providers (SendGrid, Mailgun, etc.)
      const providerClassName = emailProvider.charAt(0).toUpperCase() + emailProvider.slice(1);
      this.fs.copyTpl(
        this.templatePath('SmtpEmailService.java.ejs'), // Utiliser le template SMTP comme base
        this.destinationPath(`${notificationDir}/service/${providerClassName}EmailService.java`),
        { ...this.answers, packageName: this.packageName, providerName: providerClassName }
      );
    }

    // Controller pour les emails
    this.fs.copyTpl(
      this.templatePath('EmailController.java.ejs'),
      this.destinationPath(`${notificationDir}/controller/EmailController.java`),
      { ...this.answers, packageName: this.packageName }
    );
  }

  _generateWebSocketService() {
    const notificationDir = `src/main/java/${this.packageFolder}/notification`;

    // Configuration WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketConfig.java.ejs'),
      this.destinationPath(`${notificationDir}/config/WebSocketConfig.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // DTO pour les messages WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketMessageDTO.java.ejs'),
      this.destinationPath(`${notificationDir}/dto/WebSocketMessageDTO.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // Service WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketService.java.ejs'),
      this.destinationPath(`${notificationDir}/service/WebSocketService.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // Controller WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketController.java.ejs'),
      this.destinationPath(`${notificationDir}/controller/WebSocketController.java`),
      { ...this.answers, packageName: this.packageName }
    );
  }

  _generatePushNotificationService() {
    const { pushProviders } = this.answers;
    const notificationDir = `src/main/java/${this.packageFolder}/notification`;

    // DTO pour les notifications push
    this.fs.copyTpl(
      this.templatePath('PushNotificationDTO.java.ejs'),
      this.destinationPath(`${notificationDir}/dto/PushNotificationDTO.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // Service de notification push
    this.fs.copyTpl(
      this.templatePath('PushNotificationService.java.ejs'),
      this.destinationPath(`${notificationDir}/service/PushNotificationService.java`),
      { ...this.answers, packageName: this.packageName }
    );

    // Implémentation spécifique pour FCM
    if (pushProviders && pushProviders.includes('fcm')) {
      this.fs.copyTpl(
        this.templatePath('FcmPushService.java.ejs'),
        this.destinationPath(`${notificationDir}/service/FcmPushService.java`),
        { ...this.answers, packageName: this.packageName }
      );
    }

    // Controller pour les notifications push
    this.fs.copyTpl(
      this.templatePath('PushNotificationController.java.ejs'),
      this.destinationPath(`${notificationDir}/controller/PushNotificationController.java`),
      { ...this.answers, packageName: this.packageName }
    );
  }

  _generateWebhooksService() {
    // À implémenter ultérieurement si nécessaire
  }

  _generateEmailTemplates() {
    const { templateEngine } = this.answers;
    const resourcesDir = 'src/main/resources';
    const templatesDir = `${resourcesDir}/templates`;

    this.fs.mkdirp(`${templatesDir}/email`);

    // Template d'activation de compte adapté au moteur de template choisi
    if (templateEngine === 'thymeleaf') {
      this.fs.copyTpl(
        this.templatePath('activation-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/activation-email.html`),
        {
          ...this.answers,
          nameVar: '${name}',
          activationUrlVar: '${activationUrl}',
          emailVar: '${email}'
        }
      );
    } else if (templateEngine === 'freemarker') {
      // Pour FreeMarker, utiliser la syntaxe ${variable}
      this.fs.copyTpl(
        this.templatePath('activation-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/activation-email.ftl`),
        {
          ...this.answers,
          nameVar: '${name}',
          activationUrlVar: '${activationUrl}',
          emailVar: '${email}'
        }
      );
    } else if (templateEngine === 'handlebars') {
      // Pour Handlebars, la syntaxe {{variable}} est déjà correcte
      this.fs.copyTpl(
        this.templatePath('activation-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/activation-email.hbs`),
        {
          ...this.answers,
          nameVar: '{{name}}',
          activationUrlVar: '{{activationUrl}}',
          emailVar: '{{email}}'
        }
      );
    } else {
      // Par défaut, utiliser un format simple
      this.fs.copyTpl(
        this.templatePath('activation-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/activation-email.html`),
        this.answers
      );
    }

    // Template de réinitialisation de mot de passe
    this._generatePasswordResetTemplate();
  }

  _generatePasswordResetTemplate() {
    const { templateEngine } = this.answers;
    const resourcesDir = 'src/main/resources';
    const templatesDir = `${resourcesDir}/templates`;

    // Assurez-vous que le répertoire existe
    this.fs.mkdirp(`${templatesDir}/email`);

    // Générer le template de réinitialisation de mot de passe adapté au moteur de template choisi
    if (templateEngine === 'thymeleaf') {
      this.fs.copyTpl(
        this.templatePath('password-reset-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/password-reset-email.html`),
        {
          ...this.answers,
          nameVar: '${name}',
          resetUrlVar: '${resetUrl}',
          emailVar: '${email}'
        }
      );
    } else if (templateEngine === 'freemarker') {
      // Pour FreeMarker, utiliser la syntaxe ${variable}
      this.fs.copyTpl(
        this.templatePath('password-reset-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/password-reset-email.ftl`),
        {
          ...this.answers,
          nameVar: '${name}',
          resetUrlVar: '${resetUrl}',
          emailVar: '${email}'
        }
      );
    } else if (templateEngine === 'handlebars') {
      // Pour Handlebars, utiliser la syntaxe {{variable}}
      this.fs.copyTpl(
        this.templatePath('password-reset-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/password-reset-email.hbs`),
        {
          ...this.answers,
          nameVar: '{{name}}',
          resetUrlVar: '{{resetUrl}}',
          emailVar: '{{email}}'
        }
      );
    } else {
      // Par défaut, utiliser un format simple
      this.fs.copyTpl(
        this.templatePath('password-reset-email.html.ejs'),
        this.destinationPath(`${templatesDir}/email/password-reset-email.html`),
        this.answers
      );
    }
  }

  _updateMavenDependencies() {
    const { notificationTypes, emailProvider, pushProviders } = this.answers;
    const pomPath = this.destinationPath('pom.xml');
    let pomContent = this.fs.read(pomPath);

    const dependencies:any = [];

    // Dépendances pour les emails
    if (notificationTypes.includes('email')) {
      dependencies.push(`
        <!-- Spring Mail -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>`);

      // Dépendances spécifiques au provider
      if (emailProvider === 'sendgrid') {
        dependencies.push(`
        <!-- SendGrid -->
        <dependency>
            <groupId>com.sendgrid</groupId>
            <artifactId>sendgrid-java</artifactId>
            <version>4.9.3</version>
        </dependency>`);
      } else if (emailProvider === 'mailgun') {
        dependencies.push(`
        <!-- Mailgun -->
        <dependency>
            <groupId>com.mailgun</groupId>
            <artifactId>mailgun-java</artifactId>
            <version>1.0.5</version>
        </dependency>`);
      }
    }

    // Dépendances pour WebSocket
    if (notificationTypes.includes('websocket')) {
      dependencies.push(`
        <!-- WebSocket -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>`);
    }

    // Dépendances pour les notifications push
    if (notificationTypes.includes('push') && pushProviders && pushProviders.includes('fcm')) {
      dependencies.push(`
        <!-- Firebase Cloud Messaging -->
        <dependency>
            <groupId>com.google.firebase</groupId>
            <artifactId>firebase-admin</artifactId>
            <version>9.1.1</version>
        </dependency>`);
    }

    // Ajouter les dépendances avant la fermeture des dependencies
    if (dependencies.length > 0) {
      if (pomContent.includes('</dependencies>')) {
        pomContent = pomContent.replace('</dependencies>', `${dependencies.join('\n')}\n    </dependencies>`);
        this.fs.write(pomPath, pomContent);
        this.log('✅ Dépendances Maven ajoutées avec succès');
      } else {
        this.log('⚠️ Impossible d\'ajouter les dépendances Maven. Structure du pom.xml non reconnue.');
        this.log('Veuillez ajouter les dépendances suivantes manuellement:');
        this.log(dependencies.join('\n'));
      }
    }
  }

  _updateGradleDependencies() {
    const { notificationTypes, emailProvider, pushProviders } = this.answers;
    const buildGradlePath = this.destinationPath('build.gradle');

    // Si le fichier build.gradle existe
    if (this.fs.exists(buildGradlePath)) {
      let buildGradleContent = this.fs.read(buildGradlePath);
      const dependencies: string[] = [];

      // Dépendances pour les emails
      if (notificationTypes.includes('email')) {
        dependencies.push(`implementation 'org.springframework.boot:spring-boot-starter-mail'`);

        // Dépendances spécifiques au provider
        if (emailProvider === 'sendgrid') {
          dependencies.push(`implementation 'com.sendgrid:sendgrid-java:4.9.3'`);
        } else if (emailProvider === 'mailgun') {
          dependencies.push(`implementation 'com.mailgun:mailgun-java:1.0.5'`);
        } else if (emailProvider === 'ses') {
          dependencies.push(`implementation 'com.amazonaws:aws-java-sdk-ses:1.12.1'`);
        }
      }

      // Dépendances pour WebSocket
      if (notificationTypes.includes('websocket')) {
        dependencies.push(`implementation 'org.springframework.boot:spring-boot-starter-websocket'`);
      }

      // Dépendances pour les notifications push
      if (notificationTypes.includes('push') && pushProviders && pushProviders.includes('fcm')) {
        dependencies.push(`implementation 'com.google.firebase:firebase-admin:9.1.1'`);
      } else if (notificationTypes.includes('push') && pushProviders && pushProviders.includes('onesignal')) {
        dependencies.push(`implementation 'com.github.OneSignal:OneSignal-Java-SDK:1.0.0'`);
      }

      // Dépendances pour les templates
      const { useTemplating, templateEngine } = this.answers;
      if (useTemplating) {
        if (templateEngine === 'thymeleaf') {
          dependencies.push(`implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'`);
        } else if (templateEngine === 'freemarker') {
          dependencies.push(`implementation 'org.springframework.boot:spring-boot-starter-freemarker'`);
        } else if (templateEngine === 'handlebars') {
          dependencies.push(`implementation 'com.github.jknack:handlebars:4.3.1'`);
          dependencies.push(`implementation 'com.github.jknack:handlebars-springmvc:4.3.1'`);
        }
      }

      // Ajouter les dépendances à build.gradle
      if (dependencies.length > 0) {
        if (buildGradleContent.includes('dependencies {')) {
          const newDependenciesBlock = `dependencies {\n    ${dependencies.join('\n    ')}\n`;

          // Vérifier si les dépendances existent déjà pour éviter les doublons
          const updatedContent = dependencies.reduce((content, dep) => {
            if (!content.includes(dep)) {
              return content.replace('dependencies {', `dependencies {\n    ${dep}`);
            }
            return content;
          }, buildGradleContent);

          this.fs.write(buildGradlePath, updatedContent);
          this.log('✅ Dépendances Gradle ajoutées avec succès');
        } else {
          this.log('⚠️ Impossible d\'ajouter les dépendances Gradle. Structure du build.gradle non reconnue.');
          this.log('Veuillez ajouter les dépendances suivantes manuellement:');
          this.log(dependencies.join('\n'));
        }
      }
    } else {
      this.log('⚠️ Le fichier build.gradle n\'existe pas. Impossible d\'ajouter les dépendances.');
    }
  }
}
