/**
 * Date utility functions for dashboard filtering
 */

import { TimePeriod } from "./types";



export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get date range based on time period
 */
export function getDateRange(period: TimePeriod): DateRange {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date();

  switch (period) {
    case "today":
      // From midnight today to now
      startDate.setHours(0, 0, 0, 0);
      break;

    case "week":
      // Last 7 days from midnight
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;

    case "month":
      // Last 30 days from midnight
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case "year":
      // From January 1st of current year to now
      startDate.setMonth(0, 1); // January 1st
      startDate.setHours(0, 0, 0, 0);
      break;

    default:
      // Default to today
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Get the previous period's date range for comparison
 */
export function getPreviousPeriodRange(period: TimePeriod): DateRange {
  const now = new Date();
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      // Yesterday
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case "week":
      // Previous 7 days (8-14 days ago)
      endDate.setDate(now.getDate() - 8);
      endDate.setHours(23, 59, 59, 999);
      startDate.setDate(now.getDate() - 14);
      startDate.setHours(0, 0, 0, 0);
      break;

    case "month":
      // Previous 30 days (31-60 days ago)
      endDate.setDate(now.getDate() - 31);
      endDate.setHours(23, 59, 59, 999);
      startDate.setDate(now.getDate() - 60);
      startDate.setHours(0, 0, 0, 0);
      break;

    case "year":
      // Previous year (January 1 to December 31 of last year)
      const lastYear = now.getFullYear() - 1;
      startDate.setFullYear(lastYear, 0, 1); // January 1 of last year
      startDate.setHours(0, 0, 0, 0);
      endDate.setFullYear(lastYear, 11, 31); // December 31 of last year
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      // Default to yesterday
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/**
 * Get day labels based on period (for charts)
 */
export function getDayLabels(period: TimePeriod): string[] {
  switch (period) {
    case "today":
      // Hourly labels (24 hours)
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, "0");
        return `${hour}:00`;
      });

    case "week":
      // 7 days
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    case "month":
      // 30 days - show every 5th day
      return Array.from({ length: 7 }, (_, i) => {
        const dayNum = i * 5 + 1;
        return `Day ${dayNum}`;
      });

    case "year":
      // 12 months
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    default:
      return [];
  }
}

/**
 * Get time buckets for grouping data (for charts)
 */
export function getTimeBuckets(period: TimePeriod, startDate: Date): Date[] {
  const buckets: Date[] = [];

  switch (period) {
    case "today":
      // 24 hourly buckets
      for (let i = 0; i < 24; i++) {
        const bucket = new Date(startDate);
        bucket.setHours(i, 0, 0, 0);
        buckets.push(bucket);
      }
      break;

    case "week":
      // 7 daily buckets
      for (let i = 0; i < 7; i++) {
        const bucket = new Date(startDate);
        bucket.setDate(startDate.getDate() + i);
        bucket.setHours(0, 0, 0, 0);
        buckets.push(bucket);
      }
      break;

    case "month":
      // 30 daily buckets
      for (let i = 0; i < 30; i++) {
        const bucket = new Date(startDate);
        bucket.setDate(startDate.getDate() + i);
        bucket.setHours(0, 0, 0, 0);
        buckets.push(bucket);
      }
      break;

    case "year":
      // 12 monthly buckets (first day of each month)
      for (let i = 0; i < 12; i++) {
        const bucket = new Date(startDate);
        bucket.setMonth(i, 1);
        bucket.setHours(0, 0, 0, 0);
        buckets.push(bucket);
      }
      break;
  }

  return buckets;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
