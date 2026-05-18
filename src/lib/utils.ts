import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function onlyDigits(s: string) {
  return s ? s.replace(/\D/g, "") : "";
}

export async function getLatLongFromCep(cep: string, logradouro?: string, bairro?: string, cidade?: string): Promise<{ lat: number; lng: number } | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    // 1. Try by postal code first (fastest and most specific)
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanCep}&country=Brazil&limit=1`,
      {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "LiderX-Strategic-Map-App-v2",
        },
      }
    );
    let data = await response.json();

    // 2. If no result, try a more descriptive search
    if (!data || data.length === 0) {
      const queryParts = [];
      if (logradouro) queryParts.push(logradouro);
      if (bairro) queryParts.push(bairro);
      if (cidade) queryParts.push(cidade);
      queryParts.push("Brasil");

      if (queryParts.length > 1) {
        const query = encodeURIComponent(queryParts.join(", "));
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
          {
            headers: {
              "Accept-Language": "pt-BR",
              "User-Agent": "LiderX-Strategic-Map-App-v2",
            },
          }
        );
        data = await response.json();
      }
    }

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
