
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  
  if (seconds < 30) return "Just now";
  
  return Math.floor(seconds) + "s ago";
}

export const playMessageSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.error("Error playing sound", e);
  }
};

export const playNotificationSound = () => {
  try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle'; // Different tone for notifications
          osc.frequency.setValueAtTime(500, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
          osc.stop(ctx.currentTime + 0.3);
      }
  } catch (e) {
      console.error("Error playing notification sound", e);
  }
};

/**
 * Formats a price in cents to a formatted currency string.
 * @param {number} amountInCents - The price in cents (integer).
 * @param {string} currency - The currency code (default: USD).
 * @returns {string} Formatted price (e.g., "$499.00").
 */
export function formatPrice(amountInCents, currency = 'USD') {
  if (amountInCents === null || amountInCents === undefined) return '$0.00';
  // Ensure we are working with a number
  const cents = Number(amountInCents);
  if (isNaN(cents)) return '$0.00';
  
  const amount = cents / 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
