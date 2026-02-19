import { Property } from "@/types/property";
import property1Img from "@/assets/property-1.jpg";
import property2Img from "@/assets/property-2.jpg";
import property3Img from "@/assets/property-3.jpg";
import property4Img from "@/assets/property-4.jpg";

export const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    url: "https://www.zonaprop.com.ar/propiedades/departamento-palermo-2-amb",
    title: "Luminoso departamento de 2 ambientes en Palermo",
    priceRent: 850,
    priceExpenses: 120,
    totalCost: 970,
    currency: "USD",
    neighborhood: "Palermo",
    sqMeters: 58,
    rooms: 2,
    status: "contacted",
    images: [property1Img, property2Img],
    aiSummary:
      "Luminoso departamento de 2 ambientes en el 5to piso con ascensor. Cocina y baño recientemente renovados. Excelente iluminación natural. Cerca de los parques y la vida nocturna de Palermo. Edificio pet-friendly. Cochera disponible (costo adicional).",
    comments: [
      {
        id: "c1",
        author: "María",
        avatar: "M",
        text: "¡Me encanta la luz natural de este! La cocina también se ve genial. Tratemos de visitarlo lo antes posible.",
        createdAt: new Date("2025-02-10T10:30:00"),
      },
      {
        id: "c2",
        author: "Carlos",
        avatar: "C",
        text: "El precio está un poco por encima del presupuesto pero el barrio es ideal. Vale la pena verlo.",
        createdAt: new Date("2025-02-10T14:15:00"),
      },
    ],
    createdAt: new Date("2025-02-09"),
  },
  {
    id: "2",
    url: "https://www.mercadolibre.com.ar/inmuebles/recoleta-3-amb",
    title: "Clásico departamento de 3 ambientes en Recoleta con balcón",
    priceRent: 1100,
    priceExpenses: 200,
    totalCost: 1300,
    currency: "USD",
    neighborhood: "Recoleta",
    sqMeters: 85,
    rooms: 3,
    status: "coordinated",
    images: [property3Img, property1Img],
    aiSummary:
      "Amplio departamento clásico en el prestigioso barrio de Recoleta. Techos altos, pisos originales de parquet. Gran balcón con vista a la calle. Edificio con portero 24/7 y gimnasio. A pasos de centros culturales y restaurantes de primera.",
    comments: [
      {
        id: "c3",
        author: "María",
        avatar: "M",
        text: "La visita está programada para el sábado a las 11am. ¡Muy emocionada con este — Recoleta es perfecto!",
        createdAt: new Date("2025-02-12T09:00:00"),
      },
    ],
    createdAt: new Date("2025-02-11"),
  },
  {
    id: "3",
    url: "https://www.argenprop.com/departamento-villa-crespo",
    title: "Moderno monoambiente en Villa Crespo",
    priceRent: 550,
    priceExpenses: 80,
    totalCost: 630,
    currency: "USD",
    neighborhood: "Villa Crespo",
    sqMeters: 35,
    rooms: 1,
    status: "visited",
    images: [property4Img, property2Img],
    aiSummary:
      "Monoambiente compacto pero bien diseñado. Terminaciones modernas, planta abierta, cocina totalmente equipada. En un barrio de moda con cafés y tiendas vintage. Ideal para una persona o pareja. No se permiten mascotas.",
    comments: [
      {
        id: "c4",
        author: "Carlos",
        avatar: "C",
        text: "Visitamos ayer. Es más pequeño de lo que parece en las fotos pero los terminados son de primera.",
        createdAt: new Date("2025-02-14T18:00:00"),
      },
      {
        id: "c5",
        author: "María",
        avatar: "M",
        text: "Demasiado chico para nosotros. La política de no mascotas es un punto en contra de todas formas.",
        createdAt: new Date("2025-02-14T19:30:00"),
      },
    ],
    createdAt: new Date("2025-02-13"),
  },
  {
    id: "4",
    url: "https://www.zonaprop.com.ar/departamento-caballito-2-amb",
    title: "Acogedor departamento de 2 ambientes en Caballito",
    priceRent: 700,
    priceExpenses: 95,
    totalCost: 795,
    currency: "USD",
    neighborhood: "Caballito",
    sqMeters: 52,
    rooms: 2,
    status: "discarded",
    images: [property2Img, property3Img],
    aiSummary:
      "Departamento bien mantenido cerca del Parque Rivadavia. Dos ambientes, baño renovado. Edificio con ascensor. La zona tiene excelentes conexiones de transporte y colegios cercanos. Se reporta algo de ruido de calle.",
    comments: [
      {
        id: "c6",
        author: "Carlos",
        avatar: "C",
        text: "El propietario no respondía y las fotos no coincidían con la realidad. Demasiado ruido de calle.",
        createdAt: new Date("2025-02-08T11:00:00"),
      },
    ],
    createdAt: new Date("2025-02-07"),
  },
];
