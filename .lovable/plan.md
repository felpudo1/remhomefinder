

## Plan: Fix duplicate URL detection flow and build errors

### Problem Analysis

Three issues identified:

1. **Build error in `PublishPropertyModal.tsx`**: Line 436 passes `checkDuplicateUrl` prop which doesn't exist on `PropertyFormManualProps`. It's also missing `privateImages` and `handlePrivateFileUpload` props.

2. **Build error in `PropertyFormManual.tsx`**: Line 93 references `formatDaysAgo` without importing it from `@/lib/duplicateCheck`.

3. **"In app" case (Caso 2) UX**: When a URL exists in the app but not in the user's family, the current code silently pre-fills the form and shows a small inline message. The user wants a proper modal/dialog saying: *"Esta publicación ya existe en nuestra app, fue ingresada hace XX días y XX usuarios la han marcado como favorita"* with an "Agregar" button.

### Changes

**1. Fix `PublishPropertyModal.tsx`**
- Remove the `checkDuplicateUrl` prop from the `PropertyFormManual` usage
- Add missing `privateImages`, `setPrivateImages`, `privateFileInputRef`, `handlePrivateFileUpload` props (already partially done in previous edits but seems reverted/broken)

**2. Fix `PropertyFormManual.tsx`**  
- Add `import { formatDaysAgo } from "@/lib/duplicateCheck"` at the top

**3. Add "In App" confirmation dialog in `AddPropertyModal.tsx`**
- Add an `AlertDialog` that appears when `result.case === "in_app"` is detected during `handleScrape`
- Store the "in_app" result data in state
- Dialog shows the message with days ago + user count
- "Agregar" button dismisses the dialog and proceeds to pre-fill the form (current behavior)
- "Cancelar" button dismisses without action

