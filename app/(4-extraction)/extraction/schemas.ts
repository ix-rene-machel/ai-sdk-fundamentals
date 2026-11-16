import { z } from "zod";

// Factory so "today" is resolved per request (not frozen at module load) and in the user's timezone.
// `today` must be YYYY-MM-DD.
export const createAppointmentSchema = (today: string) =>
  z.object({
    title: z
      .string()
      .describe(
        "The title of the event. Should be the main purpose, concise, without names. Capitalize properly.",
      ),
    startTime: z
      .string()
      .nullable()
      .describe("Appointment start time in HH:MM format (e.g., 14:00 for 2pm)."),
    endTime: z
      .string()
      .nullable()
      .describe(
        "Appointment end time in HH:MM format. If not specified, assume a 1-hour duration after startTime.",
      ),
    attendees: z
      .array(z.string())
      .nullable()
      .describe("List of attendee names. Extract first and last names if available."),
    location: z.string().nullable(),
    date: z
      .string()
      .describe(
        `The date of the appointment. Today's date is ${today}. Use YYYY-MM-DD format.`,
      ),
  });

export type AppointmentDetails = z.infer<ReturnType<typeof createAppointmentSchema>>;

// Local calendar date (YYYY-MM-DD) in the runtime's timezone; call it in the browser for the user's date.
export const localIsoDate = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
