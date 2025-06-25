import { describe, beforeEach, jest, it, expect } from '@jest/globals';
import PaymentGenerator from '../../payment/index';
import path from 'path';
import fs from 'fs';
import helpers from 'yeoman-test';

describe('PaymentGenerator', () => {
  let mockSpawn: jest.SpyInstance;

  beforeEach(() => {
    mockSpawn = jest.spyOn(PaymentGenerator.prototype, 'spawnSync').mockImplementation(() => null);
    jest.spyOn(process, 'chdir').mockImplementation(() => null);
  });

  afterEach(() => {
    mockSpawn.mockRestore();
  });

  it('should generate payment system with Stripe provider', async () => {
    const dir = await helpers
      .run(PaymentGenerator)
      .withOptions({
        provider: ['stripe'],
        subscription: false,
        webhook: true,
        invoicing: false,
        taxes: false,
        refunds: false,
        reporting: false,
        skipInstall: true
      })
      .inTmpDir((tmpdir) => {
        // Simuler un projet Spring Boot existant
        fs.writeFileSync(
          path.join(tmpdir, 'pom.xml'),
          '<project><dependencies></dependencies></project>'
        );

        // Créer le dossier src/main/java
        const srcMainJavaDir = path.join(tmpdir, 'src', 'main', 'java');
        fs.mkdirSync(srcMainJavaDir, { recursive: true });
      });

    // Vérifier que les fichiers principaux ont été générés
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/domain/Payment.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/service/PaymentService.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/web/rest/PaymentController.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/service/dto/PaymentDTO.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/config/StripeConfig.java'))).toBe(true);
  });

  it('should generate payment system with multiple providers', async () => {
    const dir = await helpers
      .run(PaymentGenerator)
      .withOptions({
        provider: ['stripe', 'paypal'],
        subscription: true,
        webhook: true,
        invoicing: true,
        taxes: false,
        refunds: false,
        reporting: false,
        skipInstall: true
      })
      .inTmpDir((tmpdir) => {
        fs.writeFileSync(
          path.join(tmpdir, 'pom.xml'),
          '<project><dependencies></dependencies></project>'
        );

        const srcMainJavaDir = path.join(tmpdir, 'src', 'main', 'java');
        fs.mkdirSync(srcMainJavaDir, { recursive: true });
      });

    // Vérifier que les fichiers spécifiques aux providers ont été générés
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/config/StripeConfig.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/config/PaypalConfig.java'))).toBe(true);

    // Vérifier que les fichiers d'abonnement ont été générés
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/domain/Subscription.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/domain/Plan.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/service/dto/SubscriptionDTO.java'))).toBe(true);

    // Vérifier que les fichiers de facturation ont été générés
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/domain/Invoice.java'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src/main/java/com/example/payment/service/dto/InvoiceDTO.java'))).toBe(true);
  });

  it('should generate payment system with Lombok annotations when lombok=true', async () => {
    const dir = await helpers
      .run(PaymentGenerator)
      .withOptions({
        provider: ['stripe'],
        subscription: false,
        webhook: true,
        invoicing: false,
        taxes: false,
        refunds: false,
        reporting: false,
        lombok: true, // Activer Lombok (valeur par défaut)
        skipInstall: true
      })
      .inTmpDir((tmpdir) => {
        fs.writeFileSync(
          path.join(tmpdir, 'pom.xml'),
          '<project><dependencies></dependencies></project>'
        );

        const srcMainJavaDir = path.join(tmpdir, 'src', 'main', 'java');
        fs.mkdirSync(srcMainJavaDir, { recursive: true });
      });

    // Lire un DTO généré pour vérifier la présence d'annotations Lombok
    const dtoPath = path.join(dir, 'src/main/java/com/example/payment/service/dto/PaymentDTO.java');
    expect(fs.existsSync(dtoPath)).toBe(true);

    const dtoContent = fs.readFileSync(dtoPath, 'utf8');
    expect(dtoContent.includes('import lombok.')).toBe(true); // Vérifier l'import de Lombok
    expect(dtoContent.includes('@Data') ||
           dtoContent.includes('@Getter') ||
           dtoContent.includes('@Setter')).toBe(true); // Vérifier au moins une annotation Lombok
  });

  it('should generate payment system without Lombok annotations when lombok=false', async () => {
    const dir = await helpers
      .run(PaymentGenerator)
      .withOptions({
        provider: ['stripe'],
        subscription: false,
        webhook: true,
        invoicing: false,
        taxes: false,
        refunds: false,
        reporting: false,
        lombok: false, // Désactiver Lombok
        skipInstall: true
      })
      .inTmpDir((tmpdir) => {
        fs.writeFileSync(
          path.join(tmpdir, 'pom.xml'),
          '<project><dependencies></dependencies></project>'
        );

        const srcMainJavaDir = path.join(tmpdir, 'src', 'main', 'java');
        fs.mkdirSync(srcMainJavaDir, { recursive: true });
      });

    // Lire un DTO généré pour vérifier l'absence d'annotations Lombok
    const dtoPath = path.join(dir, 'src/main/java/com/example/payment/service/dto/PaymentDTO.java');
    expect(fs.existsSync(dtoPath)).toBe(true);

    const dtoContent = fs.readFileSync(dtoPath, 'utf8');
    // Si lombok=false, le contenu ne devrait pas contenir d'imports ou d'annotations Lombok
    expect(dtoContent.includes('import lombok.')).toBe(false);
    expect(dtoContent.includes('@Data')).toBe(false);
    expect(dtoContent.includes('@Getter')).toBe(false);
    expect(dtoContent.includes('@Setter')).toBe(false);

    // Par contre, il devrait contenir des getters et setters explicites
    expect(dtoContent.includes('public ')).toBe(true);
    expect(dtoContent.includes('get') || dtoContent.includes('set')).toBe(true);
  });
});
