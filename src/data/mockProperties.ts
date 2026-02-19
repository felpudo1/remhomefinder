import { Property } from "@/types/property";
import property1Img from "@/assets/property-1.jpg";
import property2Img from "@/assets/property-2.jpg";
import property3Img from "@/assets/property-3.jpg";
import property4Img from "@/assets/property-4.jpg";

export const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    url: "https://www.zonaprop.com.ar/propiedades/departamento-palermo-2-amb",
    title: "Luminous 2-bedroom apartment in Palermo",
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
      "Bright 2-room apartment on the 5th floor with elevator. Recently renovated kitchen and bathroom. Natural light throughout. Close to Palermo parks and nightlife. Pet-friendly building. Parking available (extra cost).",
    comments: [
      {
        id: "c1",
        author: "María",
        avatar: "M",
        text: "I love the natural light in this one! The kitchen looks great too. Let's try to visit ASAP.",
        createdAt: new Date("2025-02-10T10:30:00"),
      },
      {
        id: "c2",
        author: "Carlos",
        avatar: "C",
        text: "The price is a bit above budget but the neighborhood is ideal. Worth checking out.",
        createdAt: new Date("2025-02-10T14:15:00"),
      },
    ],
    createdAt: new Date("2025-02-09"),
  },
  {
    id: "2",
    url: "https://www.mercadolibre.com.ar/inmuebles/recoleta-3-amb",
    title: "Classic 3-bedroom in Recoleta with balcony",
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
      "Spacious classic apartment in prestigious Recoleta. High ceilings, original hardwood floors. Large balcony with street views. Building with 24/7 doorman and gym. Walking distance to cultural centers and fine dining.",
    comments: [
      {
        id: "c3",
        author: "María",
        avatar: "M",
        text: "Visit is scheduled for Saturday at 11am. Very excited about this one — Recoleta is perfect!",
        createdAt: new Date("2025-02-12T09:00:00"),
      },
    ],
    createdAt: new Date("2025-02-11"),
  },
  {
    id: "3",
    url: "https://www.argenprop.com/departamento-villa-crespo",
    title: "Modern studio in Villa Crespo",
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
      "Compact but well-designed studio apartment. Modern finishes, open-plan layout, fully equipped kitchen. In a trendy neighborhood with cafes and vintage shops. Ideal for one person or couple. No pets allowed.",
    comments: [
      {
        id: "c4",
        author: "Carlos",
        avatar: "C",
        text: "We visited yesterday. It's smaller than it looks in photos but the finishes are premium.",
        createdAt: new Date("2025-02-14T18:00:00"),
      },
      {
        id: "c5",
        author: "María",
        avatar: "M",
        text: "Too small for us. The no-pets policy is a dealbreaker anyway.",
        createdAt: new Date("2025-02-14T19:30:00"),
      },
    ],
    createdAt: new Date("2025-02-13"),
  },
  {
    id: "4",
    url: "https://www.zonaprop.com.ar/departamento-caballito-2-amb",
    title: "Cozy 2-bedroom in Caballito",
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
      "Well-maintained apartment near Parque Rivadavia. Two bedrooms, renovated bathroom. Building with elevator. The area has excellent transport links and schools nearby. Some street noise reported.",
    comments: [
      {
        id: "c6",
        author: "Carlos",
        avatar: "C",
        text: "Owner was unresponsive and the photos didn't match reality. Too much street noise.",
        createdAt: new Date("2025-02-08T11:00:00"),
      },
    ],
    createdAt: new Date("2025-02-07"),
  },
];
