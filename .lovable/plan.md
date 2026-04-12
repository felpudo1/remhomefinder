
Objetivo: hacer robusto el guardado de `referred_by_id` para Google OAuth aunque Supabase no vuelva por `/auth/callback`.

Diagnóstico confirmado:
- La ruta `/auth/callback` existe y el componente `AuthCallback.tsx` tiene la lógica de referral.
- Pero hoy esa lógica depende de que Google/Supabase respeten `redirectTo`.
- En tu caso real, el usuario termina en `/dashboard`, por lo que `AuthCallback` no monta y nunca corre el update.
- La evidencia de base acompaña esto: el usuario nuevo `efde88ee-762d-4e33-8b8c-0f991c2d7f78` quedó con `referred_by_id = NULL`.
- Además, `Landing.tsx` redirige automáticamente a `/dashboard` si ya hay sesión, lo que refuerza que el flujo puede “saltearse” la callback visual.

Plan de implementación propuesto:

1. Desacoplar el referral de `/auth/callback`
- Mantener `AuthCallback.tsx` como camino ideal cuando sí monta.
- Pero mover la lógica crítica de “si hay sesión + existe `hf_referral_id` + el perfil actual no tiene `referred_by_id`, entonces vincular referido” a un punto global.
- El lugar más estable es `ReferralTracker.tsx`, porque ya está montado globalmente dentro de `App.tsx`.

2. Reforzar `ReferralTracker` como finalizador post-login
- Extender `ReferralTracker` para que haga dos cosas:
  - seguir capturando `?ref=` / `?agente=` desde URL y guardarlo en `localStorage`
  - cuando detecte usuario autenticado y perfil sin referido, usar `hf_referral_id` de `localStorage` para hacer el `update` a `profiles.referred_by_id`
- Evitar auto-referencia comparando `refId !== profile.userId`
- Limpiar `hf_referral_id` solo cuando el update haya sido exitoso

3. Añadir tolerancia a race condition del perfil
- Como el trigger `handle_new_user_profile()` puede crear el perfil unos instantes después del login OAuth, replicar un pequeño retry en `ReferralTracker`
- Flujo:
  - leer `profile`
  - si todavía no existe, reintentar unas pocas veces
  - si existe y `referred_by_id` es null, actualizar
- Esto elimina la dependencia temporal de que el callback corra “en el momento exacto”

4. Mantener `AuthCallback` como soporte, no como único mecanismo
- No sacar la lógica actual de `AuthCallback.tsx`
- Solo dejar de depender exclusivamente de ella
- Así, si el proveedor sí vuelve a `/auth/callback`, funcionará igual; y si no, el referral se resolverá después al entrar a landing/dashboard

5. Verificación puntual del flujo QR
- Revisar que no se limpie `hf_referral_id` antes de tiempo
- Validar que el flujo quede así:
  1. QR con `?ref=...`
  2. `ReferralTracker` guarda `hf_referral_id`
  3. Google OAuth
  4. si vuelve por `/auth/callback`, se procesa ahí
  5. si vuelve por `/` o `/dashboard`, `ReferralTracker` global procesa el referido al detectar sesión
- Esto cubre ambos escenarios sin depender de configuración externa

Detalles técnicos:
```text
Estado actual:
QR -> localStorage(hf_referral_id) -> Google OAuth -> /dashboard
                                              X
                                   AuthCallback no monta

Estado propuesto:
QR -> localStorage(hf_referral_id) -> Google OAuth -> /dashboard
                                                     |
                                                     v
                              ReferralTracker global detecta sesión
                              + profile sin referred_by_id
                              + update profiles.referred_by_id
```

Archivos a tocar:
- `src/components/ReferralTracker.tsx`
- probablemente ajuste menor en `src/pages/AuthCallback.tsx` para evitar duplicación/conflictos de limpieza
- no haría cambios en `Landing.tsx`, `AuthProvider.tsx` ni `GoogleSignInButton.tsx` salvo que al implementar aparezca un conflicto concreto

Qué NO cambiaría:
- No cambiaría la configuración de redirects del proyecto desde código
- No movería todo a metadata de usuario ahora, porque ya existe `profiles.referred_by_id` y el objetivo es arreglar solo este bug
- No tocaría el flujo de guardado manual del aviso salvo que al implementar veamos una interferencia real

Riesgo y mitigación:
- Riesgo: doble update del referido si corre en callback y luego en tracker
- Mitigación: antes de actualizar, verificar `!profile.referredById`; después limpiar `hf_referral_id`

Resultado esperado:
- Aunque Supabase ignore `redirectTo` y mande al usuario a `/dashboard`, el referido igual queda asociado al perfil
- El sistema deja de depender de una sola ruta frágil y pasa a funcionar con un mecanismo global post-login
