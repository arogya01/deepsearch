/**
 * Date formatting utilities for prompts and context
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Format the current date in long format: "Monday, February 2, 2026"
 */
export function formatCurrentDate(): string {
  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  return `${dayName}, ${monthName} ${day}, ${year}`;
}

/**
 * Parse and normalize search result dates to a standard format
 * Handles various date formats from search engines
 */
export function formatSearchDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") {
    return "Unknown date";
  }

  // If it's already in ISO format or standard format, try to parse it
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Parsing failed, return original
  }

  // Return original if we can't parse it
  return dateStr;
}

/**
 * Get the current year as a number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
