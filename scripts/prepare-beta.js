#!/usr/bin/env node
/**
 * Script pour préparer le lancement d'une version beta de Spring-Fullstack-Speed
 * Ce script :
 * - Met à jour la version dans package.json avec un suffixe beta
 * - Exécute les tests pour s'assurer que tout fonctionne
 * - Génère les notes de changement pour la beta
 * - Prépare une annonce pour la version beta
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Fonction pour créer une interface readline
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Fonction pour exécuter une commande shell
function execCommand(command, args, options = {}) {
  console.log(`${colors.blue}Exécution de: ${colors.bold}${command} ${args.join(' ')}${colors.reset}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
    encoding: 'utf8'
  });

  if (result.error) {
    console.error(`${colors.red}Erreur lors de l'exécution de la commande: ${result.error.message}${colors.reset}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${colors.red}La commande a échoué avec le code: ${result.status}${colors.reset}`);
    process.exit(result.status);
  }

  return result;
}

// Vérifier que le repo Git est propre
function checkGitStatus() {
  console.log('\n🔍 Vérification du statut Git...');
  const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });

  if (result.stdout.trim() !== '') {
    console.warn(`${colors.yellow}⚠️  Le répertoire de travail contient des modifications non commitées.${colors.reset}`);
    console.warn(`${colors.yellow}Il est recommandé de commiter ou stasher vos changements avant de lancer une beta.${colors.reset}`);
    return false;
  }

  console.log(`${colors.green}✅ Le répertoire de travail est propre.${colors.reset}`);
  return true;
}

// Lire le package.json
function readPackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

// Mettre à jour la version dans package.json
function updateVersion(version) {
  console.log(`\n📝 Mise à jour de la version à ${colors.bold}${version}${colors.reset}...`);
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = readPackageJson();

  const oldVersion = packageJson.version;
  packageJson.version = version;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`${colors.green}✅ Version mise à jour de ${oldVersion} à ${version}${colors.reset}`);
}

// Générer les notes de changement pour la beta
function generateBetaChangelog(version) {
  console.log('\n📋 Génération des notes de changement pour la beta...');

  // Utiliser le script de génération de changelog existant
  try {
    execCommand('node', [path.join(rootDir, 'scripts/generate-changelog.js')], {
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn(`${colors.yellow}⚠️  Impossible de générer automatiquement le changelog: ${error.message}${colors.reset}`);
    console.warn(`${colors.yellow}Vous devrez peut-être le mettre à jour manuellement.${colors.reset}`);
  }

  // Créer un fichier markdown spécifique pour les notes de version beta
  const betaNotesPath = path.join(rootDir, 'learn/press/notes-beta.md');
  const betaNotes = `# Spring-Fullstack-Speed ${version} - Notes de version Beta

Date: ${new Date().toISOString().split('T')[0]}

## 🚀 Introduction

Cette version beta de Spring-Fullstack-Speed est publiée pour recueillir les retours de la communauté avant la sortie officielle de la version 1.0. Nous vous encourageons à tester toutes les fonctionnalités et à nous faire part de vos remarques.

## ✨ Fonctionnalités à tester

- Génération d'applications Spring Boot complètes
- Intégration avec différents frameworks frontend (React, Vue, Angular)
- Génération d'entités et CRUD
- Configuration de sécurité (JWT, OAuth2)
- Déploiement Docker et Kubernetes
- Interface CLI et commandes disponibles

## 🐛 Problèmes connus

- [Liste à compléter avec les problèmes connus]

## 📋 Comment donner votre avis

1. **Via GitHub Issues**: Créez une issue avec le tag \`beta-feedback\`
2. **Via Discord**: Rejoignez notre canal #beta-testing
3. **Via le formulaire de feedback**: [Lien vers le formulaire]

## 🔍 Installation

\`\`\`bash
npm install -g @enokdev/spring-fullstack-speed@beta
\`\`\`

## 🙏 Remerciements

Un grand merci à tous nos beta-testeurs pour leur précieuse contribution à l'amélioration de Spring-Fullstack-Speed!
`;

  fs.writeFileSync(betaNotesPath, betaNotes);
  console.log(`${colors.green}✅ Notes de version beta générées dans ${betaNotesPath}${colors.reset}`);
}

// Créer l'annonce de la beta pour le site web
function createBetaAnnouncement() {
  console.log('\n🔔 Création de l\'annonce beta pour le site web...');

  const betaPagePath = path.join(rootDir, 'learn/beta.html');
  const betaPageContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Version Beta - Spring-Fullstack-Speed</title>
    <meta name="description" content="Découvrez et testez la version beta de Spring-Fullstack-Speed, le générateur d'applications Spring Boot fullstack.">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/beta.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
</head>
<body>
    <header>
        <div class="container">
            <nav>
                <div class="logo">
                    <a href="index.html">
                        <img src="images/logo.svg" alt="SFS Logo">
                        <span>Spring-Fullstack-Speed</span>
                    </a>
                </div>
                <div class="nav-links" id="navLinks">
                    <i class="fas fa-times" onclick="hideMenu()"></i>
                    <ul>
                        <li><a href="index.html">Accueil</a></li>
                        <li><a href="documentation.html">Documentation</a></li>
                        <li><a href="commandes.html">Commandes</a></li>
                        <li><a href="demos.html">Démos</a></li>
                        <li><a href="roadmap.html">Roadmap</a></li>
                        <li><a href="support.html">Support</a></li>
                        <li><a href="beta.html" class="active">Beta</a></li>
                        <li><a href="https://github.com/tky0065/spring-fullstack-speed" target="_blank">GitHub</a></li>
                    </ul>
                </div>
                <i class="fas fa-bars" onclick="showMenu()"></i>
            </nav>
            
            <div class="beta-hero">
                <h1>Version Beta</h1>
                <p>Participez au programme beta et aidez-nous à améliorer Spring-Fullstack-Speed</p>
            </div>
        </div>
    </header>

    <section class="beta-info">
        <div class="container">
            <div class="beta-intro">
                <h2>Spring-Fullstack-Speed Beta</h2>
                <p>Nous sommes ravis de vous présenter la version beta de Spring-Fullstack-Speed, notre générateur d'applications Spring Boot fullstack. Votre participation est essentielle pour nous aider à identifier les bugs, améliorer la documentation et perfectionner l'expérience utilisateur avant la sortie officielle.</p>
            </div>
            
            <div class="beta-install">
                <h3>Comment installer la version beta</h3>
                <div class="code-block">
                    <pre><code>npm install -g @enokdev/spring-fullstack-speed@beta</code></pre>
                    <button class="copy-btn" onclick="copyToClipboard('npm install -g @enokdev/spring-fullstack-speed@beta')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p>Une fois installé, vous pouvez vérifier la version avec :</p>
                <div class="code-block">
                    <pre><code>sfs --version</code></pre>
                    <button class="copy-btn" onclick="copyToClipboard('sfs --version')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <div class="beta-features">
                <h3>Fonctionnalités à tester</h3>
                <p>Nous vous encourageons particulièrement à tester les fonctionnalités suivantes :</p>
                <div class="feature-list">
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <div>
                            <h4>Génération d'application</h4>
                            <p>Générez une application Spring Boot complète avec différentes options.</p>
                            <div class="code-block">
                                <pre><code>sfs app --name=my-app --db=postgresql --frontend=react</code></pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <div>
                            <h4>Entités et CRUD</h4>
                            <p>Créez des entités et générez les opérations CRUD associées.</p>
                            <div class="code-block">
                                <pre><code>sfs entity --name=Product
sfs crud --entity=Product</code></pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <div>
                            <h4>Intégration Frontend</h4>
                            <p>Testez l'intégration avec différents frameworks frontend.</p>
                            <div class="code-block">
                                <pre><code>sfs app --frontend=react|vue|angular</code></pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <i class="fas fa-check"></i>
                        <div>
                            <h4>Déploiement</h4>
                            <p>Vérifiez les configurations Docker et Kubernetes générées.</p>
                            <div class="code-block">
                                <pre><code>sfs docker
sfs kubernetes</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="beta-feedback">
                <h3>Comment partager vos retours</h3>
                <p>Votre avis est crucial pour améliorer Spring-Fullstack-Speed. Plusieurs options s'offrent à vous :</p>
                <div class="feedback-methods">
                    <div class="feedback-method">
                        <i class="fab fa-github"></i>
                        <h4>GitHub Issues</h4>
                        <p>Créez une issue avec le tag <code>beta-feedback</code> pour signaler des bugs ou suggérer des améliorations.</p>
                        <a href="https://github.com/tky0065/spring-fullstack-speed/issues/new?template=beta_feedback.md" target="_blank" class="btn btn-primary">Créer une issue</a>
                    </div>
                    
                    <div class="feedback-method">
                        <i class="fab fa-discord"></i>
                        <h4>Discord</h4>
                        <p>Rejoignez notre canal #beta-testing pour discuter en temps réel avec l'équipe de développement.</p>
                        <a href="#" target="_blank" class="btn btn-primary">Rejoindre Discord</a>
                    </div>
                    
                    <div class="feedback-method">
                        <i class="fas fa-clipboard-list"></i>
                        <h4>Formulaire en ligne</h4>
                        <p>Remplissez notre formulaire de feedback pour nous faire part de votre expérience.</p>
                        <a href="#" target="_blank" class="btn btn-primary">Formulaire de feedback</a>
                    </div>
                </div>
            </div>
            
            <div class="beta-timeline">
                <h3>Calendrier beta</h3>
                <div class="timeline">
                    <div class="timeline-item current">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Phase 1: Beta initiale</h4>
                            <p>Test des fonctionnalités de base et collecte des premiers retours.</p>
                            <span class="timeline-date">En cours</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Phase 2: Corrections itératives</h4>
                            <p>Application des correctifs basés sur les premiers retours.</p>
                            <span class="timeline-date">2 semaines</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Phase 3: Release Candidate</h4>
                            <p>Finalisation et derniers tests avant la version 1.0.</p>
                            <span class="timeline-date">4 semaines</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>Version 1.0</h4>
                            <p>Publication officielle de Spring-Fullstack-Speed.</p>
                            <span class="timeline-date">8 semaines</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="beta-faq">
                <h3>FAQ Beta</h3>
                <div class="accordion">
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <h4>Est-ce que je peux utiliser cette version pour des projets réels?</h4>
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="accordion-content">
                            <p>La version beta est principalement destinée aux tests. Bien qu'elle puisse fonctionner pour des projets réels, nous recommandons d'attendre la version stable 1.0 pour la production.</p>
                        </div>
                    </div>
                    
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <h4>Comment passer de la beta à la version stable?</h4>
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="accordion-content">
                            <p>Une fois la version 1.0 publiée, il vous suffira d'exécuter <code>npm update -g @enokdev/spring-fullstack-speed</code> pour obtenir la version stable.</p>
                        </div>
                    </div>
                    
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <h4>Mes retours seront-ils pris en compte?</h4>
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="accordion-content">
                            <p>Absolument! Tous les retours sont examinés par l'équipe de développement. Les problèmes critiques et les améliorations pertinentes sont intégrés en priorité avant la sortie de la version 1.0.</p>
                        </div>
                    </div>
                    
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <h4>Y aura-t-il plusieurs versions beta?</h4>
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="accordion-content">
                            <p>Oui, nous prévoyons de publier des versions beta itératives (beta.1, beta.2, etc.) à mesure que nous apportons des améliorations basées sur vos retours.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <section class="beta-cta">
        <div class="container">
            <h2>Rejoignez notre programme de beta-testeurs</h2>
            <p>Votre expertise est précieuse pour nous aider à créer le meilleur outil possible pour la communauté Spring Boot.</p>
            <div class="cta-buttons">
                <a href="https://github.com/tky0065/spring-fullstack-speed" target="_blank" class="btn btn-primary">Contribuer sur GitHub</a>
                <a href="#" target="_blank" class="btn btn-secondary">S'inscrire au programme</a>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-logo">
                    <img src="images/logo.svg" alt="SFS Logo">
                    <h3>Spring-Fullstack-Speed</h3>
                    <p>Générateur d'applications Spring Boot fullstack</p>
                </div>
                <div class="footer-links">
                    <h4>Liens rapides</h4>
                    <ul>
                        <li><a href="index.html">Accueil</a></li>
                        <li><a href="documentation.html">Documentation</a></li>
                        <li><a href="commandes.html">Commandes</a></li>
                        <li><a href="roadmap.html">Roadmap</a></li>
                        <li><a href="support.html">Support</a></li>
                        <li><a href="beta.html">Beta</a></li>
                        <li><a href="https://github.com/tky0065/spring-fullstack-speed" target="_blank">GitHub</a></li>
                    </ul>
                </div>
                <div class="footer-community">
                    <h4>Communauté</h4>
                    <ul>
                        <li><a href="https://github.com/tky0065/spring-fullstack-speed/issues" target="_blank">Signaler un bug</a></li>
                        <li><a href="https://github.com/tky0065/spring-fullstack-speed/blob/main/docs/contributing.md" target="_blank">Comment contribuer</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Spring-Fullstack-Speed. Sous licence MIT.</p>
                <div class="social-icons">
                    <a href="https://github.com/tky0065/spring-fullstack-speed" target="_blank"><i class="fab fa-github"></i></a>
                    <a href="https://www.npmjs.com/package/@enokdev/spring-fullstack-speed" target="_blank"><i class="fab fa-npm"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <script src="js/script.js"></script>
    <script src="js/beta.js"></script>
</body>
</html>`;

  fs.writeFileSync(betaPagePath, betaPageContent);
  console.log(`${colors.green}✅ Page beta créée dans ${betaPagePath}${colors.reset}`);

  // Créer le CSS pour la page beta
  const betaCssPath = path.join(rootDir, 'learn/css/beta.css');
  const betaCssContent = `/* Beta page styles */
.beta-hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(to right, var(--primary-color), #7986cb);
}

.beta-hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.beta-info {
  padding: 4rem 0;
}

.beta-intro {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem;
}

.beta-intro h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.beta-intro p {
  font-size: 1.2rem;
  color: var(--text-light);
  line-height: 1.7;
}

.beta-install {
  max-width: 800px;
  margin: 0 auto 4rem;
  background-color: var(--bg-light);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.beta-install h3 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.beta-features {
  margin-bottom: 4rem;
}

.beta-features h3 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  gap: 1.5rem;
  background-color: var(--bg-light);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.feature-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-top: 0.5rem;
}

.feature-item h4 {
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
}

.feature-item .code-block {
  margin-top: 1rem;
}

.beta-feedback {
  margin-bottom: 4rem;
}

.beta-feedback h3 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
}

.feedback-methods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.feedback-method {
  background-color: var(--bg-light);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  text-align: center;
  transition: var(--transition);
}

.feedback-method:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.feedback-method i {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.feedback-method h4 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.feedback-method p {
  margin-bottom: 1.5rem;
}

.beta-timeline {
  margin-bottom: 4rem;
}

.beta-timeline h3 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: "";
  position: absolute;
  width: 4px;
  background-color: var(--primary-color);
  top: 0;
  bottom: 0;
  left: 20px;
  opacity: 0.3;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  padding-left: 60px;
}

.timeline-marker {
  position: absolute;
  width: 24px;
  height: 24px;
  left: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

.timeline-item.current .timeline-marker {
  background-color: var(--secondary-color);
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}

.timeline-content {
  background-color: var(--bg-white);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  position: relative;
}

.timeline-content h4 {
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
}

.timeline-date {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background-color: var(--bg-light);
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.9rem;
}

.beta-faq {
  margin-bottom: 4rem;
}

.beta-faq h3 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
}

.accordion {
  max-width: 800px;
  margin: 0 auto;
}

.beta-cta {
  background-color: var(--primary-color);
  color: var(--text-white);
  padding: 4rem 0;
  text-align: center;
}

.beta-cta h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.beta-cta p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

/* Media queries */
@media screen and (max-width: 768px) {
  .beta-hero h1 {
    font-size: 2.5rem;
  }
  
  .beta-intro h2 {
    font-size: 2rem;
  }
  
  .feedback-methods {
    grid-template-columns: 1fr;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
}`;

  fs.writeFileSync(betaCssPath, betaCssContent);
  console.log(`${colors.green}✅ Styles CSS pour la page beta créés dans ${betaCssPath}${colors.reset}`);

  // Créer le JavaScript pour la page beta
  const betaJsPath = path.join(rootDir, 'learn/js/beta.js');
  const betaJsContent = `// Script for beta page
document.addEventListener('DOMContentLoaded', function() {
    // Accordion functionality
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        content.style.maxHeight = '0px';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';
        
        header.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all items
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherContent = otherItem.querySelector('.accordion-content');
                    otherContent.style.maxHeight = '0px';
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                content.style.maxHeight = '0px';
            } else {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
    
    // Add banner to homepage
    if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/')) {
        const header = document.querySelector('header');
        if (header) {
            const banner = document.createElement('div');
            banner.className = 'beta-banner';
            banner.innerHTML = \`
                <div class="container">
                    <p><strong>🚀 Version beta disponible !</strong> Testez dès maintenant la version 1.0.0-beta.1 et partagez vos retours. <a href="beta.html">En savoir plus</a></p>
                </div>
            \`;
            header.parentNode.insertBefore(banner, header.nextSibling);
            
            // Add styles
            const styleEl = document.createElement('style');
            styleEl.textContent = \`
                .beta-banner {
                    background-color: #7986cb;
                    color: white;
                    padding: 0.75rem 0;
                    text-align: center;
                }
                .beta-banner p {
                    margin: 0;
                }
                .beta-banner a {
                    color: white;
                    text-decoration: underline;
                    font-weight: bold;
                }
                .beta-banner a:hover {
                    text-decoration: none;
                }
            \`;
            document.head.appendChild(styleEl);
        }
    }
});`;

  fs.writeFileSync(betaJsPath, betaJsContent);
  console.log(`${colors.green}✅ Script JavaScript pour la page beta créé dans ${betaJsPath}${colors.reset}`);
}

// Créer le template d'issue pour les retours beta
function createBetaIssueTemplate() {
  console.log('\n📝 Création du template d\'issue GitHub pour les retours beta...');

  const templateDir = path.join(rootDir, '.github/ISSUE_TEMPLATE');
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }

  const templatePath = path.join(templateDir, 'beta_feedback.md');
  const templateContent = `---
name: Retour Beta
about: Partagez votre expérience avec la version beta
title: '[BETA] '
labels: beta-feedback
assignees: ''
---

**Version beta testée**
<!-- Ex: 1.0.0-beta.1 -->

**Environnement**
- OS: <!-- Ex: Windows 10, macOS Monterey, Ubuntu 22.04 -->
- Node.js version: <!-- Ex: v18.12.0 -->
- Java version: <!-- Ex: OpenJDK 17.0.2 -->

**Ce qui fonctionne bien**
<!-- Décrivez ce que vous avez apprécié -->

**Ce qui pourrait être amélioré**
<!-- Décrivez les problèmes rencontrés ou vos suggestions -->

**Screenshots/Logs**
<!-- Si applicable, ajoutez des captures d'écran ou logs -->
`;

  fs.writeFileSync(templatePath, templateContent);
  console.log(`${colors.green}✅ Template d'issue pour les retours beta créé dans ${templatePath}${colors.reset}`);
}

// Exécuter les tests
function runTests() {
  console.log('\n🧪 Exécution des tests...');

  try {
    execCommand('npm', ['test']);
    console.log(`${colors.green}✅ Tous les tests passent.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Les tests ont échoué. Veuillez corriger les erreurs avant de lancer la beta.${colors.reset}`);
    return false;
  }
}

// Point d'entrée principal
async function main() {
  try {
    const currentVersion = readPackageJson().version;
    console.log(`\n${colors.bold}🚀 Préparation de la version beta de Spring-Fullstack-Speed${colors.reset}`);
    console.log(`${colors.blue}Version actuelle: ${currentVersion}${colors.reset}`);

    const isGitClean = checkGitStatus();
    if (!isGitClean) {
      const rl = createInterface();
      const answer = await new Promise(resolve => {
        rl.question(`${colors.yellow}⚠️  Continuer malgré les modifications non commitées? (o/n): ${colors.reset}`, resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'o') {
        console.log(`${colors.yellow}Préparation de la beta annulée.${colors.reset}`);
        process.exit(0);
      }
    }

    // Déterminer la version beta
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let betaVersion;

    // Si la version actuelle est déjà une beta, incrémenter le numéro de beta
    if (currentVersion.includes('beta')) {
      const betaNum = parseInt(currentVersion.split('beta.')[1]) || 0;
      betaVersion = `${major}.${minor}.${patch}-beta.${betaNum + 1}`;
    } else {
      // Sinon, créer la première beta pour la prochaine version
      betaVersion = `${major}.${minor}.${patch}-beta.1`;
    }

    const rl = createInterface();

    // Confirmer la version beta
    const confirmVersion = await new Promise(resolve => {
      rl.question(`\n${colors.blue}Version beta proposée: ${colors.bold}${betaVersion}${colors.reset}\nConfirmez-vous cette version? (o/n): `, resolve);
    });

    if (confirmVersion.toLowerCase() !== 'o') {
      const customVersion = await new Promise(resolve => {
        rl.question(`\n${colors.blue}Entrez la version beta souhaitée (ex: 1.0.0-beta.1): ${colors.reset}`, resolve);
      });

      betaVersion = customVersion;
    }

    rl.close();

    // Exécuter les tests
    const testsPass = runTests();
    if (!testsPass) {
      console.error(`${colors.red}❌ Impossible de préparer la version beta en raison des tests échoués.${colors.reset}`);
      process.exit(1);
    }

    // Mettre à jour la version
    updateVersion(betaVersion);

    // Générer les notes de changement
    generateBetaChangelog(betaVersion);

    // Créer l'annonce de la beta
    createBetaAnnouncement();

    // Créer le template d'issue pour les retours beta
    createBetaIssueTemplate();

    console.log(`\n${colors.green}${colors.bold}✅ Version beta ${betaVersion} préparée avec succès!${colors.reset}`);
    console.log(`\n${colors.blue}Prochaines étapes:${colors.reset}`);
    console.log(`${colors.blue}1. Vérifiez et éditez les fichiers générés si nécessaire${colors.reset}`);
    console.log(`${colors.blue}2. Commitez les changements: ${colors.bold}git commit -am "Préparation de la version ${betaVersion}"${colors.reset}`);
    console.log(`${colors.blue}3. Créez un tag: ${colors.bold}git tag -a v${betaVersion} -m "Version ${betaVersion}"${colors.reset}`);
    console.log(`${colors.blue}4. Poussez les changements: ${colors.bold}git push && git push --tags${colors.reset}`);
    console.log(`${colors.blue}5. Publiez sur npm: ${colors.bold}npm publish --tag beta${colors.reset}`);
    console.log(`${colors.blue}6. Créez une release sur GitHub marquée comme "Pre-release"${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Erreur: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
