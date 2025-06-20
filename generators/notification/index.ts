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
    this.log('Configuration des fonctionnalités de notification...');
    
    // Ajouter les dépendances nécessaires au pom.xml ou build.gradle
    if (this.fs.exists(this.destinationPath('pom.xml'))) {
      this._addMavenDependencies();
    } else if (this.fs.exists(this.destinationPath('build.gradle')) || 
               this.fs.exists(this.destinationPath('build.gradle.kts'))) {
      this._addGradleDependencies();
    }
  }

  writing() {
    this.log('Génération des fichiers pour les fonctionnalités de notification...');

    // Configuration de base pour les notifications
    this._generateNotificationConfig();
    
    // Implémentation des notifications par email si sélectionnées
    if (this.answers.notificationTypes.includes('email')) {
      this._generateEmailImplementation();
    }
    
    // Implémentation des WebSockets si sélectionnés
    if (this.answers.notificationTypes.includes('websocket')) {
      this._generateWebSocketImplementation();
    }
    
    // Implémentation des notifications push si sélectionnées
    if (this.answers.notificationTypes.includes('push')) {
      this._generatePushNotificationImplementation();
    }
    
    // Implémentation des webhooks si sélectionnés
    if (this.answers.notificationTypes.includes('webhooks')) {
      this._generateWebhooksImplementation();
    }
    
    // Générer les templates de notification si nécessaire
    if (this.answers.useTemplating) {
      this._generateNotificationTemplates();
    }
    
    // Configurer les tests pour chaque type de notification
    this._generateNotificationTests();
    
    // Générer la documentation pour les fonctionnalités de notification
    this._generateNotificationDocumentation();
  }

  install() {
    this.log('Installation terminée pour les fonctionnalités de notification');
  }

  end() {
    this.log('Intégration des fonctionnalités de notification terminée!');
  }

  // Méthodes privées d'aide
  private _addMavenDependencies() {
    try {
      const pomXml = this.fs.read(this.destinationPath('pom.xml'));
      let dependencies = '';

      // Dépendances pour email
      if (this.answers.notificationTypes.includes('email')) {
        dependencies += `
        <!-- Email dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>`;
        
        if (this.answers.emailProvider === 'sendgrid') {
          dependencies += `
        <dependency>
            <groupId>com.sendgrid</groupId>
            <artifactId>sendgrid-java</artifactId>
            <version>4.9.3</version>
        </dependency>`;
        } else if (this.answers.emailProvider === 'mailgun') {
          dependencies += `
        <dependency>
            <groupId>com.mailgun</groupId>
            <artifactId>mailgun-java</artifactId>
            <version>1.0.7</version>
        </dependency>`;
        } else if (this.answers.emailProvider === 'ses') {
          dependencies += `
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>ses</artifactId>
        </dependency>`;
        }
      }

      // Dépendances pour WebSocket
      if (this.answers.notificationTypes.includes('websocket')) {
        dependencies += `
        <!-- WebSocket dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>
        <dependency>
            <groupId>org.webjars</groupId>
            <artifactId>sockjs-client</artifactId>
            <version>1.5.1</version>
        </dependency>
        <dependency>
            <groupId>org.webjars</groupId>
            <artifactId>stomp-websocket</artifactId>
            <version>2.3.4</version>
        </dependency>`;
      }

      // Dépendances pour les templates
      if (this.answers.useTemplating) {
        if (this.answers.templateEngine === 'thymeleaf') {
          dependencies += `
        <!-- Thymeleaf for email templates -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.thymeleaf.extras</groupId>
            <artifactId>thymeleaf-extras-java8time</artifactId>
        </dependency>`;
        } else if (this.answers.templateEngine === 'freemarker') {
          dependencies += `
        <!-- FreeMarker for email templates -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
        </dependency>`;
        } else if (this.answers.templateEngine === 'handlebars') {
          dependencies += `
        <!-- Handlebars for email templates -->
        <dependency>
            <groupId>com.github.jknack</groupId>
            <artifactId>handlebars</artifactId>
            <version>4.3.1</version>
        </dependency>
        <dependency>
            <groupId>com.github.jknack</groupId>
            <artifactId>handlebars-springmvc</artifactId>
            <version>4.3.1</version>
        </dependency>`;
        }
      }

      // Dépendances pour FCM (Firebase Cloud Messaging)
      if (this.answers.notificationTypes.includes('push') && this.answers.pushProviders?.includes('fcm')) {
        dependencies += `
        <!-- Firebase Cloud Messaging -->
        <dependency>
            <groupId>com.google.firebase</groupId>
            <artifactId>firebase-admin</artifactId>
            <version>9.2.0</version>
        </dependency>`;
      }

      // Dépendances pour OneSignal
      if (this.answers.notificationTypes.includes('push') && this.answers.pushProviders?.includes('onesignal')) {
        dependencies += `
        <!-- OneSignal -->
        <dependency>
            <groupId>org.json</groupId>
            <artifactId>json</artifactId>
            <version>20231013</version>
        </dependency>`;
      }
      
      if (dependencies) {
        const updatedPom = pomXml.replace(
          '</dependencies>',
          `${dependencies}\n    </dependencies>`
        );
        this.fs.write(this.destinationPath('pom.xml'), updatedPom);
      }
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier pom.xml');
    }
  }

  private _addGradleDependencies() {
    try {
      const buildFile = this.fs.exists(this.destinationPath('build.gradle.kts')) 
        ? this.destinationPath('build.gradle.kts')
        : this.destinationPath('build.gradle');
      
      const buildContent = this.fs.read(buildFile);
      let dependencies = '';

      // Dépendances pour email
      if (this.answers.notificationTypes.includes('email')) {
        if (buildFile.endsWith('.kts')) {
          dependencies += `
    // Email
    implementation("org.springframework.boot:spring-boot-starter-mail")`;
          
          if (this.answers.emailProvider === 'sendgrid') {
            dependencies += `
    implementation("com.sendgrid:sendgrid-java:4.9.3")`;
          } else if (this.answers.emailProvider === 'mailgun') {
            dependencies += `
    implementation("com.mailgun:mailgun-java:1.0.7")`;
          } else if (this.answers.emailProvider === 'ses') {
            dependencies += `
    implementation("software.amazon.awssdk:ses")`;
          }
        } else {
          dependencies += `
    // Email
    implementation 'org.springframework.boot:spring-boot-starter-mail'`;
          
          if (this.answers.emailProvider === 'sendgrid') {
            dependencies += `
    implementation 'com.sendgrid:sendgrid-java:4.9.3'`;
          } else if (this.answers.emailProvider === 'mailgun') {
            dependencies += `
    implementation 'com.mailgun:mailgun-java:1.0.7'`;
          } else if (this.answers.emailProvider === 'ses') {
            dependencies += `
    implementation 'software.amazon.awssdk:ses'`;
          }
        }
      }

      // Dépendances pour WebSocket
      if (this.answers.notificationTypes.includes('websocket')) {
        if (buildFile.endsWith('.kts')) {
          dependencies += `
    // WebSocket
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.webjars:sockjs-client:1.5.1")
    implementation("org.webjars:stomp-websocket:2.3.4")`;
        } else {
          dependencies += `
    // WebSocket
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.webjars:sockjs-client:1.5.1'
    implementation 'org.webjars:stomp-websocket:2.3.4'`;
        }
      }

      // Dépendances pour les templates
      if (this.answers.useTemplating) {
        if (this.answers.templateEngine === 'thymeleaf') {
          if (buildFile.endsWith('.kts')) {
            dependencies += `
    // Thymeleaf for email templates
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.thymeleaf.extras:thymeleaf-extras-java8time")`;
          } else {
            dependencies += `
    // Thymeleaf for email templates
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.thymeleaf.extras:thymeleaf-extras-java8time'`;
          }
        } else if (this.answers.templateEngine === 'freemarker') {
          if (buildFile.endsWith('.kts')) {
            dependencies += `
    // FreeMarker for email templates
    implementation("org.springframework.boot:spring-boot-starter-freemarker")`;
          } else {
            dependencies += `
    // FreeMarker for email templates
    implementation 'org.springframework.boot:spring-boot-starter-freemarker'`;
          }
        } else if (this.answers.templateEngine === 'handlebars') {
          if (buildFile.endsWith('.kts')) {
            dependencies += `
    // Handlebars for email templates
    implementation("com.github.jknack:handlebars:4.3.1")
    implementation("com.github.jknack:handlebars-springmvc:4.3.1")`;
          } else {
            dependencies += `
    // Handlebars for email templates
    implementation 'com.github.jknack:handlebars:4.3.1'
    implementation 'com.github.jknack:handlebars-springmvc:4.3.1'`;
          }
        }
      }

      // Dépendances pour FCM (Firebase Cloud Messaging)
      if (this.answers.notificationTypes.includes('push') && this.answers.pushProviders?.includes('fcm')) {
        if (buildFile.endsWith('.kts')) {
          dependencies += `
    // Firebase Cloud Messaging
    implementation("com.google.firebase:firebase-admin:9.2.0")`;
        } else {
          dependencies += `
    // Firebase Cloud Messaging
    implementation 'com.google.firebase:firebase-admin:9.2.0'`;
        }
      }

      // Dépendances pour OneSignal
      if (this.answers.notificationTypes.includes('push') && this.answers.pushProviders?.includes('onesignal')) {
        if (buildFile.endsWith('.kts')) {
          dependencies += `
    // OneSignal
    implementation("org.json:json:20231013")`;
        } else {
          dependencies += `
    // OneSignal
    implementation 'org.json:json:20231013'`;
        }
      }
      
      if (dependencies) {
        const updatedContent = buildContent.replace(
          'dependencies {',
          `dependencies {${dependencies}`
        );
        this.fs.write(buildFile, updatedContent);
      }
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier build.gradle');
    }
  }

  private _generateNotificationConfig() {
    // Générer la configuration de base pour les notifications
    this.fs.copyTpl(
      this.templatePath('NotificationConfig.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/config/NotificationConfig.java`),
      {
        packageName: this.packageName,
        asyncNotifications: this.answers.asyncNotifications,
        trackingEnabled: this.answers.trackingEnabled
      }
    );
    
    // Ajouter les propriétés dans application.properties ou application.yml
    const propertiesPath = this.fs.exists(this.destinationPath('src/main/resources/application.yml'))
      ? this.destinationPath('src/main/resources/application.yml')
      : this.destinationPath('src/main/resources/application.properties');

    if (propertiesPath.endsWith('.yml')) {
      this._updateYamlProperties(propertiesPath);
    } else {
      this._updateProperties(propertiesPath);
    }
  }

  private _updateYamlProperties(propertiesPath: string) {
    try {
      const properties = this.fs.read(propertiesPath);
      let notificationProps = `
# Notification Configuration
application:
  notification:
    enabled: true
    tracking-enabled: ${this.answers.trackingEnabled}`;

      if (this.answers.notificationTypes.includes('email')) {
        notificationProps += `
spring:
  mail:
    host: ${this.answers.emailProvider === 'smtp' ? 'smtp.example.com' : 'localhost'}
    port: 587
    username: # votre-username
    password: # votre-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
    default-encoding: UTF-8
application:
  mail:
    from: ${this.answers.emailFrom}
    base-url: http://localhost:8080`;
        
        if (this.answers.emailProvider === 'sendgrid') {
          notificationProps += `
    sendgrid:
      api-key: # votre-api-key`;
        } else if (this.answers.emailProvider === 'mailgun') {
          notificationProps += `
    mailgun:
      api-key: # votre-api-key
      domain: # votre-domain`;
        } else if (this.answers.emailProvider === 'ses') {
          notificationProps += `
    aws:
      ses:
        access-key: # votre-access-key
        secret-key: # votre-secret-key
        region: eu-west-1`;
        }
      }

      if (this.answers.notificationTypes.includes('push')) {
        notificationProps += `
application:
  push-notification:
    enabled: true`;
        
        if (this.answers.pushProviders?.includes('fcm')) {
          notificationProps += `
    firebase:
      service-account-file: firebase-service-account.json
      database-url: https://your-app.firebaseio.com`;
        }
        
        if (this.answers.pushProviders?.includes('onesignal')) {
          notificationProps += `
    onesignal:
      app-id: # votre-app-id
      api-key: # votre-api-key`;
        }
      }
      
      if (this.answers.notificationTypes.includes('websocket')) {
        notificationProps += `
spring:
  websocket:
    path: /ws
    allowed-origins: "*"`;
      }
      
      if (this.answers.notificationTypes.includes('webhooks')) {
        notificationProps += `
application:
  webhooks:
    enabled: true
    endpoint: /api/webhooks
    secret: # votre-secret-pour-la-signature`;
      }
      
      this.fs.write(propertiesPath, properties + notificationProps);
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier application.yml');
    }
  }

  private _updateProperties(propertiesPath: string) {
    try {
      const properties = this.fs.read(propertiesPath);
      let notificationProps = `
# Notification Configuration
application.notification.enabled=true
application.notification.tracking-enabled=${this.answers.trackingEnabled}`;

      if (this.answers.notificationTypes.includes('email')) {
        notificationProps += `
# Email Configuration
spring.mail.host=${this.answers.emailProvider === 'smtp' ? 'smtp.example.com' : 'localhost'}
spring.mail.port=587
spring.mail.username=# votre-username
spring.mail.password=# votre-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.default-encoding=UTF-8
application.mail.from=${this.answers.emailFrom}
application.mail.base-url=http://localhost:8080`;
        
        if (this.answers.emailProvider === 'sendgrid') {
          notificationProps += `
application.mail.sendgrid.api-key=# votre-api-key`;
        } else if (this.answers.emailProvider === 'mailgun') {
          notificationProps += `
application.mail.mailgun.api-key=# votre-api-key
application.mail.mailgun.domain=# votre-domain`;
        } else if (this.answers.emailProvider === 'ses') {
          notificationProps += `
application.mail.aws.ses.access-key=# votre-access-key
application.mail.aws.ses.secret-key=# votre-secret-key
application.mail.aws.ses.region=eu-west-1`;
        }
      }

      if (this.answers.notificationTypes.includes('push')) {
        notificationProps += `
# Push Notification Configuration
application.push-notification.enabled=true`;
        
        if (this.answers.pushProviders?.includes('fcm')) {
          notificationProps += `
application.push-notification.firebase.service-account-file=firebase-service-account.json
application.push-notification.firebase.database-url=https://your-app.firebaseio.com`;
        }
        
        if (this.answers.pushProviders?.includes('onesignal')) {
          notificationProps += `
application.push-notification.onesignal.app-id=# votre-app-id
application.push-notification.onesignal.api-key=# votre-api-key`;
        }
      }
      
      if (this.answers.notificationTypes.includes('websocket')) {
        notificationProps += `
# WebSocket Configuration
spring.websocket.path=/ws
spring.websocket.allowed-origins=*`;
      }
      
      if (this.answers.notificationTypes.includes('webhooks')) {
        notificationProps += `
# Webhooks Configuration
application.webhooks.enabled=true
application.webhooks.endpoint=/api/webhooks
application.webhooks.secret=# votre-secret-pour-la-signature`;
      }
      
      this.fs.write(propertiesPath, properties + notificationProps);
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier application.properties');
    }
  }

  private _generateEmailImplementation() {
    // Entités et DTOs pour les emails
    this.fs.copyTpl(
      this.templatePath('EmailNotification.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/domain/EmailNotification.java`),
      {
        packageName: this.packageName,
        trackingEnabled: this.answers.trackingEnabled
      }
    );
    
    this.fs.copyTpl(
      this.templatePath('EmailDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/EmailDTO.java`),
      {
        packageName: this.packageName
      }
    );
    
    // Service pour l'envoi d'emails
    this.fs.copyTpl(
      this.templatePath('EmailService.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/service/EmailService.java`),
      {
        packageName: this.packageName,
        emailProvider: this.answers.emailProvider,
        useTemplating: this.answers.useTemplating,
        templateEngine: this.answers.templateEngine,
        asyncNotifications: this.answers.asyncNotifications,
        trackingEnabled: this.answers.trackingEnabled
      }
    );
    
    // Implémentation du service d'email selon le provider
    if (this.answers.emailProvider === 'smtp') {
      this.fs.copyTpl(
        this.templatePath('SmtpEmailService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/SmtpEmailService.java`),
        {
          packageName: this.packageName,
          useTemplating: this.answers.useTemplating,
          templateEngine: this.answers.templateEngine,
          asyncNotifications: this.answers.asyncNotifications
        }
      );
    } else if (this.answers.emailProvider === 'sendgrid') {
      this.fs.copyTpl(
        this.templatePath('SendgridEmailService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/SendgridEmailService.java`),
        {
          packageName: this.packageName,
          useTemplating: this.answers.useTemplating,
          templateEngine: this.answers.templateEngine,
          asyncNotifications: this.answers.asyncNotifications
        }
      );
    } else if (this.answers.emailProvider === 'mailgun') {
      this.fs.copyTpl(
        this.templatePath('MailgunEmailService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/MailgunEmailService.java`),
        {
          packageName: this.packageName,
          useTemplating: this.answers.useTemplating,
          templateEngine: this.answers.templateEngine,
          asyncNotifications: this.answers.asyncNotifications
        }
      );
    } else if (this.answers.emailProvider === 'ses') {
      this.fs.copyTpl(
        this.templatePath('AwsSesEmailService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/AwsSesEmailService.java`),
        {
          packageName: this.packageName,
          useTemplating: this.answers.useTemplating,
          templateEngine: this.answers.templateEngine,
          asyncNotifications: this.answers.asyncNotifications
        }
      );
    }

    // Controller pour les emails
    this.fs.copyTpl(
      this.templatePath('EmailController.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/controller/EmailController.java`),
      {
        packageName: this.packageName,
        trackingEnabled: this.answers.trackingEnabled
      }
    );

    // Repository pour les emails si tracking est activé
    if (this.answers.trackingEnabled) {
      this.fs.copyTpl(
        this.templatePath('EmailNotificationRepository.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/repository/EmailNotificationRepository.java`),
        {
          packageName: this.packageName
        }
      );
    }
  }

  private _generateWebSocketImplementation() {
    // Configuration WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketConfig.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/config/WebSocketConfig.java`),
      {
        packageName: this.packageName
      }
    );

    // Controller pour les messages WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketController.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/controller/WebSocketController.java`),
      {
        packageName: this.packageName
      }
    );

    // DTO pour les messages WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketMessageDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/WebSocketMessageDTO.java`),
      {
        packageName: this.packageName
      }
    );

    // Service pour WebSocket
    this.fs.copyTpl(
      this.templatePath('WebSocketService.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/service/WebSocketService.java`),
      {
        packageName: this.packageName
      }
    );
  }

  private _generatePushNotificationImplementation() {
    // Service pour les notifications push
    this.fs.copyTpl(
      this.templatePath('PushNotificationService.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/service/PushNotificationService.java`),
      {
        packageName: this.packageName
      }
    );

    // DTO pour les notifications push
    this.fs.copyTpl(
      this.templatePath('PushNotificationDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/PushNotificationDTO.java`),
      {
        packageName: this.packageName
      }
    );

    // Controller pour les notifications push
    this.fs.copyTpl(
      this.templatePath('PushNotificationController.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/controller/PushNotificationController.java`),
      {
        packageName: this.packageName
      }
    );

    // Implémentations spécifiques selon les providers
    if (this.answers.pushProviders?.includes('fcm')) {
      this.fs.copyTpl(
        this.templatePath('FcmPushService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/FcmPushService.java`),
        {
          packageName: this.packageName
        }
      );
    }

    if (this.answers.pushProviders?.includes('onesignal')) {
      this.fs.copyTpl(
        this.templatePath('OneSignalPushService.java.ejs'),
        this.destinationPath(`src/main/java/${this.packageFolder}/service/impl/OneSignalPushService.java`),
        {
          packageName: this.packageName
        }
      );
    }
  }

  private _generateWebhooksImplementation() {
    // Service pour les webhooks
    this.fs.copyTpl(
      this.templatePath('WebhookService.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/service/WebhookService.java`),
      {
        packageName: this.packageName
      }
    );

    // Controller pour les webhooks
    this.fs.copyTpl(
      this.templatePath('WebhookController.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/controller/WebhookController.java`),
      {
        packageName: this.packageName
      }
    );

    // Entity pour les webhooks
    this.fs.copyTpl(
      this.templatePath('Webhook.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/domain/Webhook.java`),
      {
        packageName: this.packageName
      }
    );

    // Repository pour les webhooks
    this.fs.copyTpl(
      this.templatePath('WebhookRepository.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/repository/WebhookRepository.java`),
      {
        packageName: this.packageName
      }
    );

    // DTO pour les webhooks
    this.fs.copyTpl(
      this.templatePath('WebhookDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/WebhookDTO.java`),
      {
        packageName: this.packageName
      }
    );
  }

  private _generateNotificationTemplates() {
    // Créer les templates d'emails
    if (this.answers.notificationTypes.includes('email')) {
      const templateDir = this.answers.templateEngine === 'thymeleaf'
        ? 'src/main/resources/templates/mail'
        : this.answers.templateEngine === 'freemarker'
          ? 'src/main/resources/templates/mail'
          : 'src/main/resources/templates/mail';

      this.fs.copyTpl(
        this.templatePath('activation-email.html.ejs'),
        this.destinationPath(`${templateDir}/activation-email.html`),
        {
          templateEngine: this.answers.templateEngine
        }
      );

      this.fs.copyTpl(
        this.templatePath('password-reset-email.html.ejs'),
        this.destinationPath(`${templateDir}/password-reset-email.html`),
        {
          templateEngine: this.answers.templateEngine
        }
      );

      this.fs.copyTpl(
        this.templatePath('notification-email.html.ejs'),
        this.destinationPath(`${templateDir}/notification-email.html`),
        {
          templateEngine: this.answers.templateEngine
        }
      );
    }
  }

  private _generateNotificationTests() {
    // Tests pour les services de notification
    if (this.answers.notificationTypes.includes('email')) {
      this.fs.copyTpl(
        this.templatePath('EmailServiceTest.java.ejs'),
        this.destinationPath(`src/test/java/${this.packageFolder}/service/EmailServiceTest.java`),
        {
          packageName: this.packageName,
          emailProvider: this.answers.emailProvider
        }
      );
    }

    if (this.answers.notificationTypes.includes('websocket')) {
      this.fs.copyTpl(
        this.templatePath('WebSocketServiceTest.java.ejs'),
        this.destinationPath(`src/test/java/${this.packageFolder}/service/WebSocketServiceTest.java`),
        {
          packageName: this.packageName
        }
      );
    }

    if (this.answers.notificationTypes.includes('push')) {
      this.fs.copyTpl(
        this.templatePath('PushNotificationServiceTest.java.ejs'),
        this.destinationPath(`src/test/java/${this.packageFolder}/service/PushNotificationServiceTest.java`),
        {
          packageName: this.packageName,
          pushProviders: this.answers.pushProviders || []
        }
      );
    }
  }

  private _generateNotificationDocumentation() {
    // Créer la documentation pour les fonctionnalités de notification
    this.fs.copyTpl(
      this.templatePath('notification-guide.md.ejs'),
      this.destinationPath('docs/notification-guide.md'),
      {
        notificationTypes: this.answers.notificationTypes,
        emailProvider: this.answers.emailProvider,
        pushProviders: this.answers.pushProviders,
        useTemplating: this.answers.useTemplating,
        templateEngine: this.answers.templateEngine
      }
    );
  }
}
