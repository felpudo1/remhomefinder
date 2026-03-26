# 💼 Análisis: Modelo de Negocio vs Infraestructura

**Fecha:** 2026-03-26  
**Proyecto:** homefinder4  
**Escenario objetivo:** 200 agentes inmobiliarios pagos a $30/mes

---

## 💰 Revenue Model

```
200 agentes × $30/mes = $6,000/mes
                      = $72,000/año
```

---

## 📊 Perfil de uso de los agentes

| Métrica | Estimación |
|---------|-----------|
| Usuarios registrados | 200 agentes + sus clientes ≈ **500-1,000** |
| Horas activas/día por agente | 6-10 hs (uso permanente, no casual) |
| Simultáneos en horario laboral | **100-150** (50-75% de 200) |
| Canales Realtime simultáneos | 150 × 4 = **~600** |
| Auth requests/mes | ~50,000-100,000 |
| Edge Functions/mes (AI scraping) | ~10,000-30,000 |
| Storage (fotos de propiedades) | ~10-50 GB (crece ~5 GB/mes) |
| Propiedades activas en BD | ~2,000-5,000 |
| Requests REST/día | ~30,000-50,000 |

---

## 🔮 Path de Escalamiento Supabase

| Etapa | Usuarios | Plan | Costo/mes | % del Revenue | Comentario |
|-------|----------|------|-----------|---------------|------------|
| **MVP** (ahora) | 10 | Free Tier | **$0** | 0% | Validación y testing |
| **Early adopters** | 20-30 | **Pro** base | **$25** | 0.8% | Primer revenue |
| **Lanzamiento** | 50-100 | Pro + Compute Small | **$50** | 1.7% | Más RAM, más concurrent |
| **Crecimiento** | 100-200 | Pro + Compute + Realtime | **$75-100** | 1.6% | Target de este análisis |
| **Escala** | 300-500 | Pro + Compute Medium | **$125-175** | ~2% | Si crecés mucho |
| **Enterprise** | 1,000+ | Team | **$599** | ~5% | Soporte prioritario |

---

## 📋 Detalle de planes Supabase relevantes

### Pro Plan ($25/mes) — Tu siguiente paso

| Recurso | Valor | ¿Alcanza para 200 agentes? |
|---------|-------|---------------------------|
| RAM | 8 GB | ✅ Sí (actualmente usás ~190 MB) |
| CPU | 2 cores dedicados | ✅ Sí |
| BD | 8 GB | ✅ Sí (tendrías ~2-5 GB de datos) |
| Storage | 100 GB | ✅ Sí |
| Auth requests/mes | Sin límite | ✅ Sí |
| Edge Functions | 2M invocations | ✅ Sí |
| **Realtime concurrent** | **500** | ⚠️ **Justo al límite** (600 canales estimados) |
| Bandwidth | 250 GB | ✅ Sí |
| Backups | Diarios (7 días retención) | ✅ Mejor que Free (0 backups) |

### Add-ons recomendados para 200 agentes

| Add-on | Precio | Qué resuelve |
|--------|--------|-------------|
| **Compute Upgrade (Small)** | +$25/mes | RAM 2 GB extra, CPU optimizado |
| **Realtime Multiplier** | +$25/mes | Sube concurrent de 500 a 1,000 |
| **PITR Backups** | +$25/mes | Restaurar BD a cualquier punto en el tiempo |

**Total recomendado: ~$75-100/mes** → **1.2-1.6% del revenue**

---

## 🧑‍💼 Consideraciones Senior para Escalar

### 1. Realtime es tu cuello de botella principal

Tu app abre 3-4 canales WebSocket por usuario. Esto escala linealmente y Supabase cobra por concurrent connections. **Acciones a considerar:**

- **Eliminar canal dinámico de `usePropertyRating`** — crea 1 canal por cada propiedad que el usuario abre. Con 200 agentes abriendo 5 propiedades/día = cientos de canales extra.
- **Evaluar si necesitás Realtime en todo** — ¿realmente necesitás que los cambios de estado se reflejen al instante? Un polling cada 30 segundos con `refetchInterval` sería mucho más barato.
- **Considerar Realtime solo para features premium** — chat, notificaciones de visita, CRM live. El listado de propiedades puede funcionar con caché + pull manual.

### 2. Storage va a crecer rápido

Cada propiedad tiene ~5-10 fotos. Con 200 agentes subiendo ~3 propiedades/semana:

```
200 agentes × 3 props/semana × 8 fotos × 500 KB = ~2.4 GB/semana
                                                  = ~10 GB/mes
```

**Acciones:**
- Comprimir imágenes antes de subir (ya lo hacés parcialmente)
- Implementar política de limpieza de propiedades eliminadas
- Considerar CDN externo (Cloudflare R2 = $0.015/GB, mucho más barato que Storage de Supabase a $0.021/GB)

### 3. Edge Functions con OpenAI — costo oculto

Las Edge Functions de scraping usan OpenAI API. Ese costo NO es de Supabase:

```
GPT-4o-mini: ~$0.15/1K tokens input + $0.60/1K tokens output
20 scrapes/día × 200 agentes × ~$0.05/scrape = $200/mes en OpenAI
```

**Acciones:**
- Cachear resultados de scraping por URL (si la misma propiedad ya fue scrapeada, no volver a hacerlo)
- Usar modelos más baratos para extracción (GPT-4o-mini vs GPT-4o)
- Establecer límites por usuario/mes

### 4. Base de datos — crecimiento de datos

Con 200 agentes activos durante 1 año:

```
~5,000 propiedades × ~50 KB promedio (con raw_ai_data) = 250 MB
~50,000 status_history_log entries × 2 KB = 100 MB
~100,000 comments × 1 KB = 100 MB
Attachments metadata: ~50 MB
Total estimado: ~500 MB - 1 GB al año
```

**Está dentro del Pro Plan (8 GB BD)**, pero:
- Limpiar `raw_ai_data` después de X días (no se usa post-extracción)
- Archivar propiedades viejas (> 6 meses)
- Índices bien configurados (performance > espacio)

### 5. Disponibilidad y confianza

Para 200 agentes pagos, **la app no puede caerse**. Consideraciones:

| Tema | Free Tier | Pro Plan | Recomendación |
|------|-----------|----------|---------------|
| Backups | ❌ Ninguno | ✅ Diario | Activar PITR ($25) si el revenue lo justifica |
| SLA | ❌ Ninguno | ❌ Ninguno | Solo Team ($599) tiene SLA |
| Soporte | Community | Email | Para emergencias no alcanza |
| Failover | ❌ | ❌ | Solo Enterprise |

**Para 200 agentes pagos:** el Pro Plan es suficiente si configurás alertas de monitoring y tenés un plan de contingencia (backup manual periódico).

### 6. Costos totales de infraestructura (visión completa)

| Servicio | Costo/mes | Notas |
|----------|-----------|-------|
| Supabase Pro + Add-ons | $75-100 | BD + Auth + Storage + Realtime |
| Vercel (hosting frontend) | $0-20 | Free/Pro según tráfico |
| OpenAI API | $100-200 | Scraping + extracción de imágenes |
| Dominio | ~$1 | Anual |
| Cloudflare (CDN, opcional) | $0-20 | Si necesitás CDN para imágenes |
| **TOTAL** | **$175-340/mes** | **2.9-5.7% del revenue** |

**Margen bruto de infraestructura: ~94-97%.** Excelente para un SaaS.

---

## 🎯 Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Revenue objetivo | $6,000/mes |
| Costo infra total | ~$200-300/mes |
| Margen de infra | **95-97%** |
| Plan Supabase recomendado | Pro + Compute Small + Realtime ($75) |
| Usuarios soportados | ~200 agentes heavy use |
| Cuello de botella | Realtime concurrent connections |
| Siguiente cuello de botella | Storage (a los 6-12 meses) |
| Momento de migrar a Team ($599) | Cuando superes 500 agentes |
