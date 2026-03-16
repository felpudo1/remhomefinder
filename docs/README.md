# 📚 Documentación técnica — RemHomeFinder

Este directorio concentra la documentación para **el desarrollador del mañana**: decisiones de arquitectura, historial de cambios, guías de setup y diagramas de flujo. Todo está pensado para que un nuevo dev (o vos dentro de unos meses) entienda el proyecto y pueda moverse con confianza.

---

## 🗂️ Índice de documentos

| Documento | Para qué sirve |
|-----------|-----------------|
| **[CHANGELOG.md](CHANGELOG.md)** | Changelog técnico detallado: cambios de schema en BD, autenticación, panel admin, agentes, marketplace, IA (scraping), UI/UX, pendientes y **correcciones realizadas en Lovable**. Incluye el mapa de archivos principales y fragmentos de código/SQL de referencia. |
| **[SETUP.md](SETUP.md)** | Guía paso a paso para clonar el repo, instalar dependencias, configurar variables de entorno, correr la app y verificar que todo funcione. Incluye troubleshooting y qué revisar si algo falla. |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Diagramas de flujo (Mermaid): autenticación y roles, flujo de datos (propiedades / marketplace), y relación entre tablas y componentes. Ideal para entender “por dónde pasa” la información. |

---

## 🧭 Cómo usar esta documentación

- **Primera vez en el proyecto:** empezá por [SETUP.md](SETUP.md) y luego [ARCHITECTURE.md](ARCHITECTURE.md).
- **Entender un cambio reciente o por qué está algo así:** [CHANGELOG.md](CHANGELOG.md).
- **Ver qué fallos se corrigieron en Lovable:** [CHANGELOG.md — Correcciones Lovable](CHANGELOG.md#correcciones-realizadas-en-lovable-mar-2026).
- **Encontrar un archivo por responsabilidad:** [CHANGELOG.md — Mapa de archivos](CHANGELOG.md#-mapa-de-archivos-principales).
- **Ver evaluación técnica con puntajes:** [EVALUACION.md](EVALUACION.md) (arquitectura, código, testing, documentación, etc.; seguridad excluida).

En la raíz del repo también tenés [CONTRIBUTING.md](../CONTRIBUTING.md) para estilo de código, tests y buenas prácticas al contribuir.
