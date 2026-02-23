// Pure Node.js Swagger UI HTML generator (no swagger-ui-express dependency)

export const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Auth Service API', version: '1.0.0', description: 'Pure Node.js JWT Authentication Service' },
  servers: [{ url: 'http://localhost:3001', description: 'Auth Service' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      RegisterRequest: {
        type: 'object', required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Kamdev Kumar' },
          email: { type: 'string', example: 'kamdev@example.com' },
          password: { type: 'string', example: 'SecurePass123!' },
          role: { type: 'string', enum: ['admin', 'teacher', 'student'], default: 'student' },
        },
      },
      LoginRequest: {
        type: 'object', required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'kamdev@example.com' },
          password: { type: 'string', example: 'SecurePass123!' },
        },
      },
    },
  },
  paths: {
    '/api/v1/auth/register': {
      post: { tags: ['Auth'], summary: 'Register user',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/RegisterRequest' } } } },
        responses: { '201': { description: 'Registered' }, '409': { description: 'Email taken' } } },
    },
    '/api/v1/auth/login': {
      post: { tags: ['Auth'], summary: 'Login',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/LoginRequest' } } } },
        responses: { '200': { description: 'Success' }, '401': { description: 'Invalid credentials' } } },
    },
    '/api/v1/auth/refresh': {
      post: { tags: ['Auth'], summary: 'Refresh token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
        responses: { '200': { description: 'New token pair' } } },
    },
    '/api/v1/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
        responses: { '200': { description: 'Logged out' } } },
    },
    '/api/v1/auth/profile': {
      get: { tags: ['Auth'], summary: 'Get profile', security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'User profile' } } },
    },
  },
};

export function swaggerUiHtml(specJson: string, title: string): string {
  return `<!DOCTYPE html>
<html><head>
  <title>${title}</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css">
</head><body>
<div id="swagger-ui"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
<script>
  window.onload = function() {
    SwaggerUIBundle({
      spec: ${specJson},
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true,
    });
  }
</script>
</body></html>`;
}
