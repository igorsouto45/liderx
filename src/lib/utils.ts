import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function onlyDigits(s: string) {
  return s ? s.replace(/\D/g, "") : "";
}

export async function getLatLongFromCep(cep: string, logradouro?: string, bairro?: string, cidade?: string): Promise<{ lat: number; lng: number } | null> {
  const cleanCep = onlyDigits(cep);
  if (cleanCep.length !== 8) return null;

  try {
    let resolvedLogradouro = logradouro;
    let resolvedBairro = bairro;
    let resolvedCidade = cidade;

    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepResponse.ok) {
      const viaCepData = await viaCepResponse.json();
      if (!viaCepData.erro) {
        resolvedLogradouro = resolvedLogradouro || viaCepData.logradouro || undefined;
        resolvedBairro = resolvedBairro || viaCepData.bairro || undefined;
        resolvedCidade = resolvedCidade || viaCepData.localidade || undefined;
      }
    }

    const makeRequest = async (query: string) => {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`, {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "LiderX-Strategic-Map-App-v2",
        },
      });

      if (!response.ok) return null;
      const data = await response.json();
      if (!data || data.length === 0) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    };

    const queries = [
      [resolvedLogradouro, resolvedBairro, resolvedCidade, "RJ", cleanCep, "Brasil"].filter(Boolean).join(", "),
      [resolvedBairro, resolvedCidade, "RJ", cleanCep, "Brasil"].filter(Boolean).join(", "),
      [cleanCep, resolvedCidade, "Brasil"].filter(Boolean).join(", "),
      [cleanCep, "Brasil"].filter(Boolean).join(", "),
    ];

    for (const query of queries) {
      if (!query) continue;
      const result = await makeRequest(query);
      if (result) return result;
    }

    let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanCep}&country=Brazil&limit=1`, {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "LiderX-Strategic-Map-App-v2",
      },
    });
    let data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    
    if (resolvedCidade) {
      const fallbackQuery = [resolvedBairro, resolvedCidade, "RJ", "Brasil"].filter(Boolean).join(", ");
      response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`, {
        headers: {
          "Accept-Language": "pt-BR",
          "User-Agent": "LiderX-Strategic-Map-App-v2",
        },
      });
      data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
