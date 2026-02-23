import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

// ─── Extended Request/Response ────────────────────────────────────

export interface AppRequest extends IncomingMessage {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  user?: { userId: string; email: string; role: string };
  correlationId?: string;
  startTime?: number;
  parsedUrl?: URL;
}

export interface AppResponse extends ServerResponse {
  json: (statusCode: number, data: unknown) => void;
}

export function enhanceResponse(res: ServerResponse): AppResponse {
  const enhanced = res as AppResponse;
  enhanced.json = (statusCode: number, data: unknown) => {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  };
  return enhanced;
}

// ─── Handler Types ────────────────────────────────────────────────
// Both Middleware and RouteHandler use the same signature so they
// can be mixed freely in router.get('/path', middleware, handler)

export type Next = (err?: Error) => void | Promise<void>;

// Universal handler — receives (req, res, next?) so it works as
// both a middleware and a terminal route handler
export type Handler = (req: AppRequest, res: AppResponse, next: Next) => void | Promise<void>;

// Aliases for clarity in calling code
export type Middleware   = Handler;
export type RouteHandler = Handler;

// ─── Router ──────────────────────────────────────────────────────

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handlers: Handler[];
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Handler[] = [];
  private prefix: string = '';

  use(...middleware: Handler[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  private addRoute(method: string, path: string, ...handlers: Handler[]): this {
    const fullPath = this.prefix + path;
    const paramNames: string[] = [];
    const pattern = fullPath
      .replace(/:([^/]+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; })
      .replace(/\//g, '\\/');

    this.routes.push({
      method: method.toUpperCase(),
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handlers,
    });
    return this;
  }

  get(path: string, ...handlers: Handler[]): this    { return this.addRoute('GET',    path, ...handlers); }
  post(path: string, ...handlers: Handler[]): this   { return this.addRoute('POST',   path, ...handlers); }
  put(path: string, ...handlers: Handler[]): this    { return this.addRoute('PUT',    path, ...handlers); }
  patch(path: string, ...handlers: Handler[]): this  { return this.addRoute('PATCH',  path, ...handlers); }
  delete(path: string, ...handlers: Handler[]): this { return this.addRoute('DELETE', path, ...handlers); }

  setPrefix(prefix: string): this { this.prefix = prefix; return this; }

  match(method: string, pathname: string): { handlers: Handler[]; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const match = pathname.match(route.pattern);
      if (!match) continue;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
      return { handlers: route.handlers, params };
    }
    return null;
  }

  getMiddlewares(): Handler[] { return this.middlewares; }
}

// ─── Application ──────────────────────────────────────────────────

export class Application {
  private globalMiddlewares: Handler[] = [];
  private routers: Router[] = [];
  private errorHandler?: (err: Error, req: AppRequest, res: AppResponse) => void;

  use(...middleware: Handler[]): this {
    this.globalMiddlewares.push(...middleware);
    return this;
  }

  addRouter(router: Router): this {
    this.routers.push(router);
    return this;
  }

  onError(handler: (err: Error, req: AppRequest, res: AppResponse) => void): this {
    this.errorHandler = handler;
    return this;
  }

  private async parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) return resolve(undefined);
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : undefined); }
        catch { reject(new Error('Invalid JSON body')); }
      });
      req.on('error', reject);
    });
  }

  handler() {
    return async (rawReq: IncomingMessage, rawRes: ServerResponse) => {
      const req = rawReq as AppRequest;
      const res = enhanceResponse(rawRes);

      req.startTime = Date.now();
      req.correlationId = (req.headers['x-correlation-id'] as string) || generateId();
      res.setHeader('X-Correlation-ID', req.correlationId);
      res.setHeader('X-Powered-By', 'Node.js');

      const baseUrl = `http://${req.headers.host || 'localhost'}`;
      req.parsedUrl = new URL(req.url || '/', baseUrl);
      const pathname = req.parsedUrl.pathname;

      req.query = {};
      req.parsedUrl.searchParams.forEach((value, key) => { req.query[key] = value; });

      try { req.body = await this.parseBody(req); }
      catch { res.json(400, { success: false, message: 'Invalid JSON body' }); return; }

      // Match route
      let matchedHandlers: Handler[] | null = null;
      let routerMiddlewares: Handler[] = [];
      for (const router of this.routers) {
        const result = router.match(req.method || 'GET', pathname);
        if (result) {
          req.params = result.params;
          matchedHandlers = result.handlers;
          routerMiddlewares = router.getMiddlewares();
          break;
        }
      }

      if (!matchedHandlers) {
        res.json(404, { success: false, message: `Cannot ${req.method} ${pathname}` });
        return;
      }

      // Run global middleware + router middleware + route handlers as one pipeline
      const pipeline: Handler[] = [
        ...this.globalMiddlewares,
        ...routerMiddlewares,
        ...matchedHandlers,
      ];
      let idx = 0;

      const next: Next = async (err?: Error) => {
        if (err) {
          if (this.errorHandler) return this.errorHandler(err, req, res);
          res.json(500, { success: false, message: err.message || 'Internal server error' });
          return;
        }
        if (idx >= pipeline.length || res.writableEnded) return;
        const handler = pipeline[idx++];
        try { await handler(req, res, next); }
        catch (e) { await next(e as Error); }
      };

      await next();
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function success<T>(res: AppResponse, data: T, message = 'Success', status = 200): void {
  res.json(status, { success: true, message, data });
}

export function created<T>(res: AppResponse, data: T, message = 'Created'): void {
  res.json(201, { success: true, message, data });
}
