export const environment = {
  production: false,
  // Local inquiry_tool_backend_api. Products are synced into this backend
  // from the Deckard PIM (channel: inquiry_tool); the client reads them
  // through /api/v1/products here, not directly from the PIM.
  apiBaseUrl: 'http://127.0.0.1:8005',
  apiPath: '/api/v1',
  serverUrl: 'http://127.0.0.1:8005',
  pim: {
    // PIM asset endpoint, used only for image URLs on PIM-sourced products
    // when the backend exposes raw PIM image UUIDs. Kept here for future use.
    exportUrl: 'https://127.0.0.1:8002/api/v1/export',
    assetUrl: 'https://127.0.0.1:8002/api/v1/assets',
    channel: 'inquiry_tool',
  },
};
