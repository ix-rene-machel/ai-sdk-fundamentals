"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarAppointment } from "./calendar-appointment";
import { extractAppointment } from "./actions";
import { localIsoDate, type AppointmentDetails } from "./schemas";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null,
  );

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setAppointment(null); // Clear previous results

    const formData = new FormData(e.currentTarget);
    const input = formData.get("appointment");

    try {
      if (typeof input !== "string" || !input.trim()) return;
      const result = await extractAppointment(input, localIsoDate());
      setAppointment(result);
    } catch (error) {
      console.error("Extraction failed:", error);
      // TODO: Show error to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Extract Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="appointment"
                placeholder="Enter appointment details..."
                className="w-full"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Extracting..." : "Extract Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <CalendarAppointment appointment={appointment} />
      </div>
    </div>
  );
}
