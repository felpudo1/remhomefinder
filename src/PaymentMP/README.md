# 💳 PaymentMP - Módulo Reutilizable de MercadoPago

Módulo autocontenido de integración con MercadoPago para React + TypeScript.
**Copiá esta carpeta a cualquier proyecto y empezá a cobrar.**

## 📦 Estructura

```
PaymentMP/
├── index.ts                    ← Punto de entrada (importá todo desde acá)
├── types/payment.types.ts      ← Tipos TypeScript centralizados
├── config/mercadopago.config.ts ← Factory de configuración
├── utils/payment.utils.ts      ← Validaciones y formateo
├── services/payment.service.ts ← Servicio de API (fetch nativo)
├── hooks/usePayment.ts         ← Hook React configurable
├── components/
│   ├── PaymentForm.tsx         ← Formulario skeleton (HTML nativo)
│   ├── PaymentSuccess.tsx      ← Pantalla éxito skeleton
│   ├── PaymentFailure.tsx      ← Pantalla fallo skeleton
│   └── PaymentPending.tsx      ← Pantalla pendiente skeleton
├── backend/
│   ├── server.js               ← Backend Express listo para usar
│   ├── package.json            ← Dependencias del backend
│   └── .env.example            ← Variables de entorno ejemplo
└── README.md                   ← Este archivo
```

## 🚀 Instalación Rápida

### 1. Copiar la carpeta

Copiá `PaymentMP/` a tu proyecto destino en `src/PaymentMP/`.

### 2. Dependencia de React

El módulo solo requiere `react` (>=16.8 para hooks). No tiene otras dependencias de frontend.

### 3. Configurar el backend

```bash
cd PaymentMP/backend
npm install
cp .env.example .env
# Editá .env con tus credenciales de MercadoPago
node server.js
```

### 4. Obtener credenciales

1. Ir a [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crear una aplicación
3. Copiar **Access Token** (para el backend `.env`)
4. Copiar **Public Key** (para el frontend)

## 📝 Uso Básico

### Configurar el módulo

```tsx
import { createMPConfig } from './PaymentMP';

// Crear configuración (pasá tus propias env vars)
const mpConfig = createMPConfig({
  publicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
  apiBaseUrl: 'http://localhost:3001/api',
  defaultCurrency: 'UYU',     // Moneda por defecto
});
```

### Usar el formulario

```tsx
import { PaymentForm } from './PaymentMP';

function MiPaginaDePagos() {
  return (
    <PaymentForm
      config={mpConfig}
      currency="UYU"
      onSuccess={(result) => {
        console.log('Pago creado:', result.paymentId);
        // Se redirige automáticamente a MercadoPago
      }}
      onError={(error) => {
        console.error('Error:', error);
      }}
    />
  );
}
```

### Usar el hook directamente

```tsx
import { usePayment, createMPConfig } from './PaymentMP';

function MiComponenteCustom() {
  const config = createMPConfig({
    publicKey: 'APP_USR-xxx',
    apiBaseUrl: 'http://localhost:3001/api',
  });

  const { processPayment, isLoading, error, success } = usePayment(config);

  const handlePay = async () => {
    const result = await processPayment({
      amount: 1500,
      description: 'Servicio Premium',
      currency: 'UYU',
    });

    if (result.success) {
      // Se redirige automáticamente a MercadoPago
    }
  };

  return (
    <button onClick={handlePay} disabled={isLoading}>
      {isLoading ? 'Procesando...' : 'Pagar $U 1500'}
    </button>
  );
}
```

### Pantallas de resultado

```tsx
import { PaymentSuccess, PaymentFailure, PaymentPending } from './PaymentMP';

// En tus rutas:
<Route path="/payments/success" element={
  <PaymentSuccess
    onNavigateBack={() => navigate('/payments')}
    onNavigateHome={() => navigate('/')}
  />
} />

<Route path="/payments/failure" element={
  <PaymentFailure
    onRetry={() => navigate('/payments')}
    onNavigateHome={() => navigate('/')}
  />
} />

<Route path="/payments/pending" element={
  <PaymentPending
    onNavigateBack={() => navigate('/payments')}
    onNavigateHome={() => navigate('/')}
  />
} />
```

## 🎨 Estilos (Skeleton)

Los componentes son **skeleton**: HTML puro sin estilos. Para customizarlos:

### Opción 1: Clases CSS con data-attributes

```css
/* PaymentForm */
[data-payment-form] { /* contenedor */ }
[data-field="amount"] { /* campo monto */ }
[data-field="description"] { /* campo descripción */ }
[data-currency-symbol] { /* símbolo de moneda */ }
[data-error] { /* mensaje de error */ }
[data-success] { /* mensaje de éxito */ }
[data-submit] { /* botón de pago */ }

/* Resultados */
[data-payment-result="success"] { /* contenedor éxito */ }
[data-payment-result="failure"] { /* contenedor fallo */ }
[data-payment-result="pending"] { /* contenedor pendiente */ }
[data-icon] { /* ícono de resultado */ }
[data-title] { /* título */ }
[data-message] { /* mensaje */ }
[data-actions] { /* contenedor de botones */ }
[data-action="back"] { /* botón volver */ }
[data-action="home"] { /* botón inicio */ }
[data-action="retry"] { /* botón reintentar */ }
```

### Opción 2: className prop

```tsx
<PaymentForm config={mpConfig} className="mi-form-custom" />
<PaymentSuccess className="mi-success-custom" />
```

## ⚙️ Configuración Avanzada

### Fetcher Custom (Supabase Edge Functions)

```tsx
import { createMPConfig } from './PaymentMP';
import { supabase } from '@/integrations/supabase/client';

const mpConfig = createMPConfig({
  publicKey: 'APP_USR-xxx',
  apiBaseUrl: '', // No se usa con fetcher custom
  fetcher: async (url, options) => {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: JSON.parse(options?.body as string),
    });
    
    return new Response(JSON.stringify(data || { success: false, error: error?.message }), {
      status: error ? 500 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
});
```

### Sin auto-redirect

```tsx
const { processPayment } = usePayment(config, false); // false = no autoRedirect

const result = await processPayment(paymentData);
if (result.success && result.redirectUrl) {
  // Controlar la redirección manualmente
  window.open(result.redirectUrl, '_blank');
}
```

### Monedas soportadas

| Código | Moneda | Símbolo |
|--------|--------|---------|
| ARS | Peso Argentino | $ |
| BRL | Real Brasileño | R$ |
| CLP | Peso Chileno | $ |
| COP | Peso Colombiano | $ |
| MXN | Peso Mexicano | $ |
| PEN | Sol Peruano | S/ |
| UYU | Peso Uruguayo | $U |
| USD | Dólar Estadounidense | US$ |

## 🔒 Seguridad

- ✅ Access Token **solo en el backend** (nunca en el frontend)
- ✅ Public Key en el frontend (segura por diseño)
- ✅ Validación de datos en frontend Y backend
- ✅ Rate limiting básico incluido en el backend
- ✅ CORS configurado
- ✅ Sin dependencias innecesarias

## 📊 Flujo de Pago

```
1. Usuario → Completa formulario (PaymentForm)
2. Frontend → Valida datos y llama al backend
3. Backend → Crea preferencia en MercadoPago API
4. Frontend → Redirige al checkout de MercadoPago
5. Usuario → Paga en MercadoPago
6. MercadoPago → Redirige al usuario a back_urls
7. Frontend → Muestra PaymentSuccess/Failure/Pending
8. MercadoPago → Envía webhook al backend (async)
```
