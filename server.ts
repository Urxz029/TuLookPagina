import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_EMAIL = 'tulookoffve@gmail.com';
const PORT = Number(process.env.PORT || 3000);

const VALID_PLATFORMS = new Set(['Web', 'iOS', 'Android']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccessRequestPayload {
  name: string;
  email: string;
  platform: string;
  note?: string;
  website?: string; // Honeypot field
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, RateBucket>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;

function sanitizeText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function firewallHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = ipRateLimits.get(ip);

  if (!bucket || now > bucket.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error:
        'Demasiadas solicitudes en poco tiempo. Por seguridad, espera un minuto antes de volver a intentarlo.',
    });
    return;
  }

  bucket.count += 1;
  next();
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(firewallHeaders);
  app.use(express.json({ limit: '16kb', strict: true }));

  // Reject malformed JSON payloads cleanly
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Formato JSON inválido o tamaño excedido.' });
      return;
    }
    next(err);
  });

  app.post('/api/solicitar-acceso', apiRateLimiter, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = (req.body || {}) as Partial<AccessRequestPayload>;

    // Honeypot bot guard
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      res.status(400).json({ error: 'Solicitud bloqueada por validación de seguridad.' });
      return;
    }

    const name = sanitizeText(body.name, 100);
    const email = sanitizeText(body.email, 160);
    const platform = sanitizeText(body.platform, 20) || 'Web';
    const note = sanitizeText(body.note, 400);

    if (name.length < 2) {
      res.status(400).json({ error: 'Por favor ingresa tu nombre completo.' });
      return;
    }

    if (email.length < 5 || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
      return;
    }

    if (!VALID_PLATFORMS.has(platform)) {
      res.status(400).json({ error: 'Plataforma no permitida.' });
      return;
    }

    const subject = `Nueva solicitud de acceso a TU LOOK — ${name}`;
    const textBody = [
      'Hola equipo de TU LOOK,',
      '',
      'Se ha registrado una nueva solicitud de acceso desde la página web:',
      `Nombre: ${name}`,
      `Correo: ${email}`,
      `Plataforma preferida: ${platform}`,
      `Prioridad / Comentario: ${note || 'Sin comentarios adicionales'}`,
      '',
      `Fecha: ${new Date().toLocaleString('es-CL')}`,
    ].join('\n');

    const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(textBody)}`;

    const rawSmtpHost = (process.env.SMTP_HOST || '').trim();
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    const smtpPort = Number(process.env.SMTP_PORT || 587);

    const isValidHostname =
      rawSmtpHost === 'localhost' ||
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rawSmtpHost);

    const resolvedHost = isValidHostname
      ? rawSmtpHost
      : smtpUser.toLowerCase().endsWith('@gmail.com')
      ? 'smtp.gmail.com'
      : '';

    if (resolvedHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: resolvedHost,
          port: smtpPort,
          secure: smtpPort === 465,
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"TU LOOK Web" <${smtpUser}>`,
          to: TARGET_EMAIL,
          replyTo: email,
          subject,
          text: textBody,
        });

        res.json({
          ok: true,
          mode: 'smtp',
          recipient: TARGET_EMAIL,
          subject,
          textBody,
          mailtoUrl,
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`SMTP fallback to mailto (${resolvedHost}): ${msg}`);
      }
    } else if (rawSmtpHost && !isValidHostname) {
      console.warn(
        `SMTP_HOST "${rawSmtpHost}" is not a valid hostname (e.g. smtp.gmail.com); falling back to mailto.`
      );
    }

    res.json({
      ok: true,
      mode: 'mailto',
      recipient: TARGET_EMAIL,
      subject,
      textBody,
      mailtoUrl,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TU LOOK server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
