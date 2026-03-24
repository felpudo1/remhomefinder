import { useEffect, useState } from "react";

/**
 * Información completa de la versión de la aplicación.
 */
export interface VersionInfo {
  version: string;
  git: {
    commitHash: string;
    commitHashFull: string;
    branch: string;
    commitDate: string;
    isDirty: boolean;
  };
  build: {
    timestamp: string;
    timestampUnix: number;
    environment: 'development' | 'preview' | 'production';
    environmentLabel: string;
    nodeVersion: string;
  };
  meta: {
    name: string;
    deployedAt: string;
  };
}

/**
 * Hook para obtener información de la versión de la aplicación.
 * Lee el archivo version.json generado automáticamente en el build.
 * 
 * @example
 * const { version, commitHash, environment, isLoading } = useAppVersion();
 * 
 * @returns Objeto con información de versión o null si no está disponible
 */
export function useAppVersion() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchVersion = async () => {
      try {
        // Agregar timestamp para evitar cache
        const response = await fetch(`/version.json?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (mounted) {
          setVersionInfo(data);
          setError(null);
        }
      } catch (err) {
        console.warn('No se pudo cargar version.json:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          // Fallback a versión de package.json si está disponible
          setVersionInfo({
            version: '0.0.0',
            git: {
              commitHash: 'unknown',
              commitHashFull: 'unknown',
              branch: 'unknown',
              commitDate: 'unknown',
              isDirty: false,
            },
            build: {
              timestamp: new Date().toISOString(),
              timestampUnix: Date.now(),
              environment: 'development',
              environmentLabel: 'Desarrollo',
              nodeVersion: process.version || 'unknown',
            },
            meta: {
              name: 'homefinder',
              deployedAt: new Date().toISOString(),
            },
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVersion();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    version: versionInfo?.version || '0.0.0',
    commitHash: versionInfo?.git.commitHash || 'unknown',
    commitHashFull: versionInfo?.git.commitHashFull || 'unknown',
    branch: versionInfo?.git.branch || 'unknown',
    commitDate: versionInfo?.git.commitDate || 'unknown',
    isDirty: versionInfo?.git.isDirty || false,
    environment: versionInfo?.build.environment || 'development',
    environmentLabel: versionInfo?.build.environmentLabel || 'Desarrollo',
    buildTimestamp: versionInfo?.build.timestamp || new Date().toISOString(),
    buildTimestampUnix: versionInfo?.build.timestampUnix || Date.now(),
    isLoading,
    error,
    fullInfo: versionInfo,
  };
}
