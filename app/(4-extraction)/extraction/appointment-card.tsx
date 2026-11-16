import { CalendarIcon, ClockIcon, MapPinIcon, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AppointmentCardProps = {
  /** Appointment title, shown as the card heading. */
  title: string;
  /** Appointment date, e.g. "2026-11-17". */
  date: string;
  /** Appointment time, e.g. "14:00 - 15:00"; `null` shows a placeholder. */
  time: string | null;
  /** Appointment location; `null` shows a placeholder. */
  location: string | null;
};

const PLACEHOLDER = "Not specified";

/**
 * Card that shows an appointment's title, date, time and location with icons; missing values show "Not specified".
 * @example <AppointmentCard title="Keynote Practice" date="2026-11-17" time="14:00" location={null} />
 */
export function AppointmentCard({ title, date, time, location }: AppointmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title || PLACEHOLDER}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <DetailRow icon={CalendarIcon} label="Date" value={date} />
          <DetailRow icon={ClockIcon} label="Time" value={time} />
          <DetailRow icon={MapPinIcon} label="Location" value={location} />
        </dl>
      </CardContent>
    </Card>
  );
}

type DetailRowProps = {
  /** Decorative icon for the row. */
  icon: LucideIcon;
  /** Field name, announced to screen readers. */
  label: string;
  /** Field value; empty or `null` shows the placeholder. */
  value: string | null;
};

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className={value ? "text-sm" : "text-sm text-muted-foreground"}>{value || PLACEHOLDER}</dd>
    </div>
  );
}
