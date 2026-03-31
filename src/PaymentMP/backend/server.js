/**
 * =====================================================
 * PaymentMP - Backend Express (Autocontenido)
 * =====================================================
 * 
 * Servidor Express listo para copiar a cualquier proyecto.
 * Maneja la comunicación con la API de MercadoPago.
 * 
 * Endpoints:
 *   POST /api/payments/create    → Crea preferencia de pago
 *   GET  /api/payments/:id       → Consulta info de un pago
 *   POST /api/webhooks/mercadopago → Recibe notificaciones de MP
 *   GET  /api/health             → Health check
 * 
 * Ejecutar:
 *   cd PaymentMP/backend
 *   npm install
 *   node server.js
 * =====================================================
 */

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────

// Habilitar CORS para recibir requests del frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Parsear body como JSON
app.use(express.json());

// ─────────────────────────────────────────────────────
// Rate Limiting básico (en memoria)
// ─────────────────────────────────────────────────────

/**
 * Rate limiter simple para evitar abuso.
 * En producción usar redis o similar.
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // máx 10 requests por minuto por IP

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return next();
  }

  const record = rateLimitMap.get(ip);

  // Resetear ventana si pasó el tiempo
  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return next();
  }

  // Incrementar contador
  record.count++;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.',
    });
  }

  next();
}

// Aplicar rate limiting a endpoints de pago
app.use('/api/payments', rateLimiter);

// ─────────────────────────────────────────────────────
// Configurar MercadoPago
// ─────────────────────────────────────────────────────

/**
 * Verificar que el access token esté configurado.
 * Sin esto, el backend no puede crear preferencias.
 */
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
  console.error('   Copia .env.example a .env y configurá tus credenciales.');
}

// Crear cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

// ─────────────────────────────────────────────────────
// Monedas soportadas
// ─────────────────────────────────────────────────────

const VALID_CURRENCIES = ['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU', 'USD'];

// ─────────────────────────────────────────────────────
// Endpoint: Crear preferencia de pago
// ─────────────────────────────────────────────────────

/**
 * POST /api/payments/create
 * 
 * Crea una preferencia de pago en MercadoPago.
 * El frontend debe llamar a este endpoint con amount, description y currency.
 * 
 * Body:
 *   { amount: number, description: string, currency?: string }
 * 
 * Response:
 *   { success: true, paymentId: string, redirectUrl: string }
 *   { success: false, error: string }
 */
app.post('/api/payments/create', async (req, res) => {
  try {
    const { amount, description, currency } = req.body;

    // ── Validar monto ──
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Monto inválido. Debe ser un número mayor a 0.',
      });
    }

    if (amount > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'El monto no puede exceder $1,000,000',
      });
    }

    // ── Validar descripción ──
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Descripción requerida y no puede estar vacía.',
      });
    }

    // ── Validar moneda ──
    const currencyCode = currency || 'UYU';
    if (!VALID_CURRENCIES.includes(currencyCode)) {
      return res.status(400).json({
        success: false,
        error: `Moneda no válida. Soportadas: ${VALID_CURRENCIES.join(', ')}`,
      });
    }

    // ── Verificar que el access token esté configurado ──
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN no configurado');
      return res.status(500).json({
        success: false,
        error: 'Error de configuración del servidor',
      });
    }

    // ── Crear preferencia de pago ──
    const preference = new Preference(client);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;

    // Generar referencia externa única para tracking
    const externalReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const preferenceData = {
      items: [
        {
          title: description.trim(),
          quantity: 1,
          unit_price: parseFloat(amount),
          currency_id: currencyCode,
        },
      ],
      back_urls: {
        success: `${frontendUrl}/payments/success`,
        failure: `${frontendUrl}/payments/failure`,
        pending: `${frontendUrl}/payments/pending`,
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      external_reference: externalReference,
    };

    console.log('📦 Creando preferencia:', {
      amount: preferenceData.items[0].unit_price,
      currency: preferenceData.items[0].currency_id,
      description: preferenceData.items[0].title,
      ref: externalReference,
    });

    const result = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada:', result.id);

    res.json({
      success: true,
      paymentId: result.id,
      redirectUrl: result.init_point,
    });

  } catch (error) {
    console.error('❌ Error creando preferencia:', error);

    // Manejo específico de errores de MercadoPago
    let errorMessage = 'Error al crear la preferencia de pago';

    if (error.response) {
      const mpError = error.response.data;
      if (mpError && mpError.message) {
        errorMessage = `Error de MercadoPago: ${mpError.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─────────────────────────────────────────────────────
// Endpoint: Consultar información de un pago
// ─────────────────────────────────────────────────────

/**
 * GET /api/payments/:id
 * 
 * Consulta la información de un pago por su ID.
 * Útil para verificar el estado cuando el usuario regresa.
 */
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payment = new Payment(client);
    const result = await payment.get({ id });

    res.json({
      success: true,
      payment: {
        id: result.id,
        status: result.status,
        amount: result.transaction_amount,
        currency: result.currency_id,
        description: result.description,
      },
    });
  } catch (error) {
    console.error('❌ Error consultando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del pago',
    });
  }
});

// ─────────────────────────────────────────────────────
// Webhook: Notificaciones de MercadoPago
// ─────────────────────────────────────────────────────

/**
 * POST /api/webhooks/mercadopago
 * 
 * Recibe notificaciones de MercadoPago sobre cambios en pagos.
 * Acá podés agregar tu lógica de negocio:
 *   - Actualizar estado en base de datos
 *   - Enviar emails de confirmación
 *   - Activar servicios/productos
 */
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('🔔 Webhook recibido:', { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`📋 Procesando notificación de pago: ${paymentId}`);

      // TODO: Implementá tu lógica de negocio acá
      // Ejemplo:
      //   - await db.payments.update({ id: paymentId, status: 'approved' });
      //   - await sendConfirmationEmail(paymentId);

      console.log(`✅ Pago ${paymentId} procesado`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send('Error');
  }
});

// ─────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────

/**
 * GET /api/health
 * 
 * Endpoint simple para verificar que el backend está corriendo.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PaymentMP backend funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────
// Iniciar servidor
// ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 PaymentMP Backend en puerto ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`💳 Pagos:  http://localhost:${PORT}/api/payments/create`);
});
