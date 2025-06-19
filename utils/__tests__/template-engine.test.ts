import { describe, expect, test } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import {
  renderString,
  buildTemplateContext,
  getOutputFilename
} from '../template-engine.js';

describe('Template Engine Utils', () => {
  describe('renderString', () => {
    test('devrait rendre une chaîne de template simple', () => {
      const template = 'Hello, <%= name %>!';
      const data = { name: 'World' };
      expect(renderString(template, data)).toBe('Hello, World!');
    });

    test('devrait gérer les conditions', () => {
      const template = '<% if (showGreeting) { %>Hello!<% } else { %>Hi!<% } %>';
      expect(renderString(template, { showGreeting: true })).toBe('Hello!');
      expect(renderString(template, { showGreeting: false })).toBe('Hi!');
    });

    test('devrait gérer les boucles', () => {
      const template = '<% items.forEach(function(item){ %><%= item %>, <% }); %>';
      const data = { items: ['apple', 'banana', 'orange'] };
      expect(renderString(template, data)).toBe('apple, banana, orange, ');
    });

    test('devrait échapper les caractères par défaut', () => {
      const template = '<%= code %>';
      const data = { code: '<script>alert("XSS")</script>' };
      const result = renderString(template, data);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('buildTemplateContext', () => {
    test('devrait intégrer le contexte de base', () => {
      const baseContext = { appName: 'TestApp' };
      const context = buildTemplateContext(baseContext);
      expect(context.appName).toBe('TestApp');
    });

    test('devrait ajouter les helpers', () => {
      const context = buildTemplateContext({});

      // Test capitalize
      expect(context.capitalize('hello')).toBe('Hello');
      expect(context.capitalize('')).toBe('');

      // Test camelCase
      expect(context.camelCase('hello-world')).toBe('helloWorld');
      expect(context.camelCase('hello_world')).toBe('helloWorld');

      // Test pascalCase
      expect(context.pascalCase('hello-world')).toBe('HelloWorld');
      expect(context.pascalCase('hello_world')).toBe('HelloWorld');

      // Test escapeHtml
      expect(context.escapeHtml('<script>')).toBe('&lt;script&gt;');
    });
  });

  describe('getOutputFilename', () => {
    test('devrait retirer l\'extension .ejs', () => {
      expect(getOutputFilename('file.txt.ejs')).toBe('file.txt');
      expect(getOutputFilename('index.html.ejs')).toBe('index.html');
      expect(getOutputFilename('App.java.ejs')).toBe('App.java');
    });

    test('devrait gérer les fichiers sans extension .ejs', () => {
      expect(getOutputFilename('file.txt')).toBe('file.txt');
    });
  });
});
