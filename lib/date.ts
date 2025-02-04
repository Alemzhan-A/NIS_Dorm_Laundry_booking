"use client";

import { format } from "date-fns";

export function getKazakhstanTime() {
  return new Date();
}

export function formatKazakhstanTime(date: Date) {
  return format(date, "HH:mm");
}

export function isKazakhstanTimeInRange(date: Date, startHour: number, endHour: number) {
  const hour = date.getHours();
  return hour >= startHour && hour < endHour;
} 