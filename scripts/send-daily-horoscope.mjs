#!/usr/bin/env node

/**
 * STARVIA Daily Horoscope Email Sender
 * 
 * This script sends daily horoscope emails to all active subscribers.
 * Run this daily via cron job or scheduler.
 * 
 * Usage:
 *   node scripts/send-daily-horoscope.mjs
 * 
 * Environment Variables:
 *   RESEND_API_KEY - Resend API key for sending emails
 *   NEWSLETTER_FROM - From email address (default: STARVIA <newsletter@starvia.app>)
 */

import { sendDailyHoroscope } from '../api/email-service.mjs';

async function main() {
  console.log('=== STARVIA Daily Horoscope Sender ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    const result = await sendDailyHoroscope();
    
    if (result.success) {
      console.log(`✓ Sent ${result.sent} emails successfully`);
      if (result.failed > 0) {
        console.log(`✗ Failed to send ${result.failed} emails`);
      }
      console.log(`Total subscribers: ${result.total}`);
    } else {
      console.error('Failed to send daily horoscopes:', result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  console.log('');
  console.log('=== Done ===');
}

main();
