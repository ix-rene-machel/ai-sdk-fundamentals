import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";

// For demo: simple city-to-coordinates mapping. In production, use a geocoding API.
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "san francisco": { lat: 37.7749, lon: -122.4194 },
  "new york": { lat: 40.7128, lon: -74.006 },
  london: { lat: 51.5074, lon: -0.1278 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  paris: { lat: 48.8566, lon: 2.3522 },
};

const openMeteoSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    weathercode: z.number(),
  }),
});

export const getWeather = tool({
  description: `Get the current weather conditions and temperature for a specific city.`,

  inputSchema: z.object({
    city: z.string().describe("The city name for weather lookup"),
  }),

  execute: async ({ city }) => {
    const coords = CITY_COORDINATES[city.trim().toLowerCase()];
    // Unknown city: return a structured error the model can explain, instead of another city's weather.
    if (!coords) {
      return {
        city,
        error: `No weather data available for "${city}".`,
        supportedCities: Object.keys(CITY_COORDINATES),
      };
    }

    // Free Open-Meteo weather API (no key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&current=temperature_2m,relative_humidity_2m,weathercode&timezone=auto`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const { current } = openMeteoSchema.parse(await response.json());
    return {
      city,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      weatherCode: current.weathercode,
    };
  },
});

export const tools = { getWeather };

/** Chat message type with typed tool parts (e.g. `tool-getWeather`), shared by route and UI. */
export type ChatMessage = UIMessage<never, never, InferUITools<typeof tools>>;
