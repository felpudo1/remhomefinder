

## Plan: Differentiate "in family" vs "in app" duplicate messages

### Current Problem
Both cases (`in_family` and `in_app`) currently set the same `urlInFamily` state and display the same amber message: "Este aviso ya existe en tu listado familiar...". The `in_app` case (different family) should show a different message and allow the user to proceed.

### Changes

**1. `AddPropertyModal.tsx`** — Separate the two cases into distinct state:
- Keep `urlInFamily` for `in_family` case (same as now, blocks adding)
- Add new state `urlInApp` with `{ firstAddedAt, usersCount }` for `in_app` case
- When `result.case === "in_app"`, set `urlInApp` instead of `urlInFamily`
- Pass `urlInApp` to `ScraperInput`

**2. `ScraperInput.tsx`** — Add a new prop `urlInApp` and render a different message:
- For `urlInFamily`: keep current amber block with "Este aviso ya existe en tu listado familiar..." + "Para verlo hacé click acá" button, no "Extraer datos" button
- For `urlInApp`: show a blue/info block with "Esta publicación ya existe en nuestra app, fue ingresada hace XX días y XX usuario(s) la han ingresado en su listado" + an "Agregar" button that proceeds with pre-filling the form from the existing property data
- The "Extraer datos" button stays disabled only for `in_family`, not for `in_app`

**3. `duplicateCheck.ts`** — Update `usersCount`: query actual count of `user_listings` for that `property_id` to show the real number of users who have it in their lists.

