"use server";

import { generateText, Output } from "ai";
import { createAppointmentSchema, localIsoDate, type AppointmentDetails } from "./schemas";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const extractAppointment = async (
  input: string,
  clientToday?: string, // user's local date from the browser; server date as fallback
): Promise<AppointmentDetails> => {
  const today = clientToday && ISO_DATE.test(clientToday) ? clientToday : localIsoDate();
  console.log(`Extracting from: "${input}" (today: ${today})`);

  const { output: appointmentDetails } = await generateText({
    model: "openai/gpt-5.4", // ICA model (see AGENTS.md); course uses openai/gpt-5-mini
    prompt: `Extract the appointment details from the following natural language input:\n\n"${input}"`,
    output: Output.object({
      schema: createAppointmentSchema(today),
    }),
  });

  console.log("Extracted details:", appointmentDetails);
  return appointmentDetails;
};
