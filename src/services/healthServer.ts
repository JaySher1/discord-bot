import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

type HealthStatus = {
  discordReady: boolean;
  commandsLoaded: number;
};

type HealthServerOptions = {
  port: number;
  host?: string;
  getStatus: () => HealthStatus;
};

function sendJson(response: ServerResponse, statusCode: number, body: object, includeBody: boolean): void {
  const payload = JSON.stringify(body);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload)
  });

  response.end(includeBody ? payload : undefined);
}

function routeHealthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  getStatus: () => HealthStatus
): void {
  const method = request.method ?? "GET";

  if (method !== "GET" && method !== "HEAD") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" }, method !== "HEAD");
    return;
  }

  const path = request.url?.split("?")[0] ?? "/";

  if (path !== "/" && path !== "/health") {
    sendJson(response, 404, { ok: false, error: "Not found" }, method !== "HEAD");
    return;
  }

  const status = getStatus();

  sendJson(
    response,
    200,
    {
      ok: true,
      service: "server-command-discord-bot",
      ...status
    },
    method !== "HEAD"
  );
}

export function startHealthServer(options: HealthServerOptions): Server {
  const host = options.host ?? "0.0.0.0";
  const server = createServer((request, response) => {
    routeHealthRequest(request, response, options.getStatus);
  });

  server.listen(options.port, host, () => {
    console.log(`Health server listening on ${host}:${options.port}`);
  });

  return server;
}
