/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * Change Date: January 1, 2029 (license converts to MIT)
 */

import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---- Session store: disable SSL for localhost; relaxed SSL for remote ----
const PgSession = ConnectPgSimple(session);

function sslFor(url?: string) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (u.hostname === "localhost" || u.hostname === "127.0.0.1")
      ? false
      : { rejectUnauthorized: false };
  } catch {
    return /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false };
  }
}

app.use(
  session({
    store: new PgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: sslFor(process.env.DATABASE_URL),
      },
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

// --- API logging (only /api/*) ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const orig = res.json.bind(res);
  let captured: unknown;
  res.json = (body: any) => { captured = body; return orig(body); };
  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const ms = Date.now() - start;
    let line = `${req.method} ${path} ${res.statusCode} in ${ms}ms`;
    if (captured) { try { line += ` :: ${JSON.stringify(captured)}`; } catch {} }
    if (line.length > 140) line = line.slice(0, 139) + "…";
    log(line);
  });
  next();
});

(async () => {
  console.log("[env] NODE_ENV =", NODE_ENV);

  // ✅ Register ALL API routes BEFORE Vite/static
  await registerAuthRoutes(app);
  const server = await registerRoutes(app);

  // Debug/health endpoints (also BEFORE Vite/static)
  app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true, env: NODE_ENV }));
  app.get("/api/_session-test", (req: Request, res: Response) => {
    (req.session as any).ping = Date.now();
    res.json({ ok: true, ts: (req.session as any).ping });
  });

  // Global error handler (still before Vite/static)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ message: err?.message || "Internal Server Error" });
  });

  // ⬇️ Vite in dev, static in prod — AFTER routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server
    .listen({ port: PORT, host: "0.0.0.0" }, () => log(`serving on port ${PORT}`))
    .on("error", (err: any) => {
      if (err?.code === "EADDRINUSE") {
        const newPort = PORT + 1;
        log(`Port ${PORT} is busy, trying ${newPort}`);
        server.listen(newPort, "0.0.0.0", () => log(`serving on port ${newPort}`));
      } else {
        console.error("Server error:", err);
      }
    });
})();