import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullScreenGalleryProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Componente de Galería en Pantalla Completa (REGLA 2)
 * Reutilizable en cualquier parte de la app para mostrar imágenes con navegación premium.
 */
export function FullScreenGallery({ images, initialIndex = 0, isOpen, onClose }: FullScreenGalleryProps) {
    const [activeImg, setActiveImg] = useState(initialIndex);

    // Sincronizar índice inicial cuando se abre
    useEffect(() => {
        if (isOpen) {
            setActiveImg(initialIndex);
        }
    }, [isOpen, initialIndex]);

    // Manejo de teclado (ESC para cerrar, Flechas para navegar)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") setActiveImg((prev) => (prev - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setActiveImg((prev) => (prev + 1) % images.length);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, images, onClose]);

    if (!isOpen || images.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300"
            onClick={(e) => e.stopPropagation()} // Evitar propagación a elementos debajo
        >
            {/* Gallery Header */}
            <div className="flex items-center justify-between p-4 md:p-6 text-white">
                <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                    {activeImg + 1} / {images.length}
                </span>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Full Image */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                {images.length > 1 && (
                    <button
                        onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                        className="absolute left-4 md:left-8 bg-white/10 hover:bg-white/20 p-4 rounded-full backdrop-blur-md transition-all z-20"
                    >
                        <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                )}

                <img
                    src={images[activeImg]}
                    alt=""
                    className="max-w-full max-h-[75vh] object-contain shadow-2xl transition-all duration-300 transform scale-100"
                />

                {images.length > 1 && (
                    <button
                        onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                        className="absolute right-4 md:right-8 bg-white/10 hover:bg-white/20 p-4 rounded-full backdrop-blur-md transition-all z-20"
                    >
                        <ChevronRight className="w-8 h-8 text-white" />
                    </button>
                )}
            </div>

            {/* Thumbnails Footer */}
            {images.length > 1 && (
                <div className="p-4 md:p-8 flex justify-center gap-3 overflow-x-auto no-scrollbar">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${i === activeImg
                                    ? "border-primary scale-110 shadow-lg shadow-primary/20"
                                    : "border-transparent opacity-50 hover:opacity-80"
                                }`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
