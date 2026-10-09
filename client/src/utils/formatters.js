// client/src/utils/formatters.js
// Date, time, and currency formatting utilities.

/**
 * Format a date to a readable string. e.g. "Mon, 10 Oct 2026"
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

/**
 * Format a time from a Date or ISO string. e.g. "8:30 AM"
 */
export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

/**
 * Format a number as Indian Rupees. e.g. "₹50.00"
 */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

/**
 * Returns a relative time label e.g. "2 hours ago"
 */
export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
