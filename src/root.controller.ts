import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class RootController {
  @Get()
  root(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CobraPy API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #061B31;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #0d2640;
      border: 1px solid #1a3a5c;
      border-radius: 16px;
      padding: 48px;
      max-width: 520px;
      width: 90%;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(83,58,253,0.15);
      border: 1px solid rgba(83,58,253,0.4);
      border-radius: 999px;
      padding: 6px 16px;
      font-size: 13px;
      color: #a89eff;
      margin-bottom: 24px;
    }
    .dot {
      width: 8px; height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    h1 {
      font-size: 36px;
      font-weight: 700;
      background: linear-gradient(135deg, #533AFD, #a89eff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }
    p {
      color: #8aadcc;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .links {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    a {
      text-decoration: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    a:hover { opacity: 0.8; }
    .primary { background: #533AFD; color: #fff; }
    .secondary { background: transparent; border: 1px solid #1a3a5c; color: #8aadcc; }
    .version {
      margin-top: 32px;
      font-size: 12px;
      color: #3a5c7a;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      API operativa
    </div>
    <h1>CobraPy</h1>
    <p>Infraestructura de cobros instantáneos sobre el SIP del Banco Central del Paraguay.</p>
    <div class="links">
      <a href="/docs" class="primary">Documentación API</a>
      <a href="/v1/health" class="secondary">Health Check</a>
    </div>
    <div class="version">v0.1.0 &nbsp;·&nbsp; REST API &nbsp;·&nbsp; Paraguay 🇵🇾</div>
  </div>
</body>
</html>`);
  }
}
