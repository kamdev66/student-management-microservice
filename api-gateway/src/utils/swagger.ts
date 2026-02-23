export const gatewaySwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Student Management System – API Gateway',
    version: '1.0.0',
    description: [
      '## Node.js + TypeScript Microservices',
      '',
      'Single gateway entry point routing to downstream services.',
      '',
      '### Services',
      '| Service | Port | Purpose |',
      '|---------|------|---------|',
      '| API Gateway | 3000 | Routing, rate limiting, JWT auth |',
      '| Auth Service | 3001 | Registration, login, refresh, RBAC |',
      '| Student Service | 3002 | CRUD, pagination, filtering, caching |',
      '| Notification Service | 3003 | Event-driven email via RabbitMQ |',
      '',
      '### Rate Limits',
      '- Global: 100 req / 15 min',
      '- Auth endpoints: 20 req / 15 min',
    ].join('\n'),
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local (API Gateway)' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      RegisterRequest: { type: 'object', required: ['name','email','password'],
        properties: { name: { type: 'string', example: 'Kamdev Kumar' }, email: { type: 'string', example: 'kamdev@gmail.com' },
          password: { type: 'string', example: 'Secure123!' }, role: { type: 'string', enum: ['admin','teacher','student'] } } },
      LoginRequest: { type: 'object', required: ['email','password'],
        properties: { email: { type: 'string' }, password: { type: 'string' } } },
      CreateStudentRequest: { type: 'object',
        required: ['firstName','lastName','email','dateOfBirth','gender','grade','department'],
        properties: {
          firstName: { type: 'string', example: 'Kamdev' }, lastName: { type: 'string', example: 'Kumar' },
          email: { type: 'string' }, dateOfBirth: { type: 'string', format: 'date', example: '2000-05-20' },
          gender: { type: 'string', enum: ['male','female','other'] },
          grade: { type: 'string', example: '10th' }, department: { type: 'string', example: 'Computer Science' },
          gpa: { type: 'number', minimum: 0, maximum: 4 }, subjects: { type: 'array', items: { type: 'string' } },
        } },
    },
  },
  paths: {
    '/api/v1/auth/register': { post: { tags: ['Auth'], summary: 'Register', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/RegisterRequest' } } } }, responses: { '201': { description: 'Registered' }, '409': { description: 'Duplicate email' } } } },
    '/api/v1/auth/login':    { post: { tags: ['Auth'], summary: 'Login', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/LoginRequest' } } } }, responses: { '200': { description: 'Token pair' }, '401': { description: 'Invalid credentials' } } } },
    '/api/v1/auth/refresh':  { post: { tags: ['Auth'], summary: 'Refresh token', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } }, responses: { '200': { description: 'New tokens' } } } },
    '/api/v1/auth/profile':  { get:  { tags: ['Auth'], summary: 'Get profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Profile' } } } },
    '/api/v1/students/all-student': {
      get:  { tags: ['Students'], summary: 'List students', security: [{ bearerAuth: [] }], parameters: [ { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'department', in: 'query', schema: { type: 'string' } }, { name: 'enrollmentStatus', in: 'query', schema: { type: 'string' } } ], responses: { '200': { description: 'Paginated list' } } },
      // post: { tags: ['Students'], summary: 'Create student (admin/teacher)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateStudentRequest' } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/v1/students/add-student': {
      post: { tags: ['Students'], summary: 'Create student (admin/teacher)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateStudentRequest' } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/v1/students/stats': { get: { tags: ['Students'], summary: 'Statistics', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Stats' } } } },
    '/api/v1/students/{id}': {
      get:    { tags: ['Students'], summary: 'Get by ID',    security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Student' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Students'], summary: 'Update',       security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateStudentRequest' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Students'], summary: 'Delete (admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
  },
};

export function swaggerHtml(spec: object, title: string): string {
  return '<!DOCTYPE html><html><head><title>' + title + '</title><meta charset="utf-8"/>' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css">' +
    '</head><body><div id="swagger-ui"></div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>' +
    '<script>window.onload=()=>SwaggerUIBundle({spec:' + JSON.stringify(spec) + ',dom_id:"#swagger-ui",deepLinking:true,presets:[SwaggerUIBundle.presets.apis,SwaggerUIBundle.SwaggerUIStandalonePreset]})</script>' +
    '</body></html>';
}
