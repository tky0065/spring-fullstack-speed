module.exports = {
  preset: '<% if (useTypeScript) { %>ts-jest<% } else { %>@vue/cli-plugin-unit-jest<% } %>',
  testEnvironment: 'jsdom',
  transform: {
<% if (useTypeScript) { %>
    '^.+\\.tsx?$': 'ts-jest',
<% } %>
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleFileExtensions: [
    'vue',
<% if (useTypeScript) { %>
    'ts',
    'tsx',
<% } %>
    'js',
    'jsx',
    'json'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx,vue}',
    '!src/**/*.d.ts',
    '!src/main.{js,ts}',
    '!src/App.vue',
    '!src/router/index.{js,ts}',
    '!src/store/index.{js,ts}'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/'
  ],
  testMatch: [
    '**/tests/unit/**/*.spec.[jt]s?(x)',
    '**/__tests__/**/*.[jt]s?(x)',
    '**/*.test.[jt]s?(x)'
  ]
};

