import type { ComponentType } from "react";

const CHUNK_RELOAD_KEY = "hf_chunk_retry_done";

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("Loading chunk")
  );
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
) => {
  return async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    } catch (error) {
      if (typeof window !== "undefined" && isChunkLoadError(error)) {
        const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";

        if (!alreadyRetried) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          window.location.reload();
          return new Promise<never>(() => undefined);
        }
      }

      throw error;
    }
  };
};
