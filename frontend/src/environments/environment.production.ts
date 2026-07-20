/**
 * Production environment. `apiBaseUrl` is injected at build time by CI
 * (see .github/workflows/deploy.yml): the `__API_BASE_URL__` placeholder is
 * replaced with the API's public URL. An empty value means "same origin".
 */
export const environment = {
  production: true,
  apiBaseUrl: '__API_BASE_URL__',
};
