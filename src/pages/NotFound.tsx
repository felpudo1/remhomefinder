import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

/**
 * Página de error 404 personalizada.
 * Se muestra cuando el usuario intenta acceder a una ruta que no existe.
 * Utiliza una imagen de ruinas en blanco y negro para un estilo dramático y premium.
 */
const NotFound = () => {
  const location = useLocation();

  // Registramos el error en la consola para depuración
  useEffect(() => {
    console.error(
      "404 Error: El usuario intentó acceder a una ruta inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Imagen de fondo: Edificio en ruinas */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{
          backgroundImage: "url('/assets/images/404-building.png')",
          filter: "grayscale(100%) contrast(120%)"
        }}
      />

      {/* Capa de degradado para mejorar legibilidad */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Contenido principal con efecto Glassmorphism */}
      <div className="relative z-20 max-w-lg w-full px-6 py-12 mx-4 text-center backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-700">
        <h1 className="mb-2 text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
          404
        </h1>

        <div className="w-16 h-1 bg-primary mx-auto mb-6" />

        <h2 className="mb-4 text-2xl font-bold text-white uppercase tracking-widest">
          Ruta Extraviada
        </h2>

        <p className="mb-8 text-gray-300 text-lg leading-relaxed">
          Parece que has llegado a un lugar que ya no existe o nunca fue construido.
          Incluso en el mundo inmobiliario, hay rincones que es mejor dejar atrás.
        </p>

        {/* Botón de retorno con micro-animación */}
        <Button
          asChild
          size="lg"
          className="group relative overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 px-8 py-6 text-lg font-semibold"
        >
          <Link to="/">
            <Home className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-1" />
            Volver a la Civilización
          </Link>
        </Button>
      </div>

      {/* Marca de agua sutil */}
      <div className="absolute bottom-6 right-6 z-20 text-white/20 text-xs font-mono tracking-widest uppercase">
        Rem Home Finder • Error System
      </div>
    </div>
  );
};

export default NotFound;
