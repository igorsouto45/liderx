import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getLatLongFromCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    // We use Nominatim OpenStreetMap API
    // Requirement: Include a descriptive User-Agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanCep}&country=Brazil&limit=1`,
      {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "LiderX-Strategic-Map-App",
        },
      }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
