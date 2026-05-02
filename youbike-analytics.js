/**
 * Vercel Web Analytics initialization
 * Tracks page views and user interactions automatically
 * 
 * This module sets up the window.va function to queue analytics calls
 * before the Vercel Analytics script loads from the CDN.
 */

// Initialize the analytics queue function
window.va = window.va || function () {
  (window.vaq = window.vaq || []).push(arguments);
};

// Optional: Configure analytics before the script loads
// Example: Filter out certain pages or add custom logic
// window.va('beforeSend', (event) => {
//   // Return null to ignore the event, or return modified event
//   return event;
// });
