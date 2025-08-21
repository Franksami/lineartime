'use client';

import { LinearCalendarVertical } from "@/components/calendar/LinearCalendarVertical";

export default function Page() {
  const currentYear = new Date().getFullYear();
  
  return <LinearCalendarVertical initialYear={currentYear} />;
}