export const environment = {
  production: false,
  apiBaseUrl: 'https://127.0.0.1:8004', // for asset URLs
  apiPath: '/api/v1', // for API endpoints
  serverUrl: 'https://127.0.0.1:8004', // for server-side rendering
  pim: {
    // Deckard PIM export endpoint and asset endpoint.
    // In dev these are proxied by proxy.conf.json (/api -> https://127.0.0.1:8002).
    exportUrl: 'https://127.0.0.1:8002/api/v1/export',
    assetUrl: 'https://127.0.0.1:8002/api/v1/assets',
    channel: 'inquiry_tool',
  },
};
