// server/src/utils/dateHelpers.js
// Date and time utility functions used across modules.
// OWNER: Member 1 — SHARED

/**
 * Returns true if a given date/time is in the past.
 */
const isPast = (date) => new Date(date) < new Date();

/**
 * Returns true if two departure times are within a given window (in minutes).
 */
const isWithinTimeWindow = (time1, time2, windowMinutes = 30) => {
  const diff = Math.abs(new Date(time1) - new Date(time2));
  return diff <= windowMinutes * 60 * 1000;
};

/**
 * Returns the start of a given day (midnight) as a Date.
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns the end of a given day (23:59:59) as a Date.
 */
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

module.exports = { isPast, isWithinTimeWindow, startOfDay, endOfDay };
