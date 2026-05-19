#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PLAN = 'premium_199';
const DEFAULT_DAYS = 7;
const PIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function issuePremiumPin(options = {}) {
  const storeFile = options.storeFile;
  if (!storeFile) {
    throw new Error('storeFile is required');
  }

  const nowDate = normalizeNow(options.now);
  const pin = normalizePin(options.pin || generatePin());
  const pinHash = hashPin(pin);
  const store = readStore(storeFile);

  if (store.pins.some((record) => record.pinHash === pinHash && !record.usedAt)) {
    throw new Error('PIN already exists in store');
  }

  const days = Number(options.days || DEFAULT_DAYS);
  const createdAt = nowDate.toISOString();
  const expiresAt = new Date(nowDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  const record = {
    pinHash,
    plan: options.plan || DEFAULT_PLAN,
    createdAt,
    expiresAt,
    usedAt: null,
    note: options.note || '',
  };

  store.pins.push(record);
  writeStore(storeFile, store);

  return {
    pin,
    plan: record.plan,
    createdAt,
    expiresAt,
    storeFile,
  };
}

function normalizeNow(now) {
  if (typeof now === 'function') return normalizeNow(now());
  if (now instanceof Date) return now;
  if (now) return new Date(now);
  return new Date();
}

function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

function generatePin() {
  var chars = '';
  for (var i = 0; i < 8; i += 1) {
    chars += PIN_ALPHABET[crypto.randomInt(0, PIN_ALPHABET.length)];
  }
  return 'STAR-' + chars;
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(normalizePin(pin)).digest('hex');
}

function readStore(storeFile) {
  if (!fs.existsSync(storeFile)) {
    return { pins: [] };
  }
  const parsed = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  return {
    ...parsed,
    pins: Array.isArray(parsed.pins) ? parsed.pins : [],
  };
}

function writeStore(storeFile, store) {
  fs.mkdirSync(path.dirname(storeFile), { recursive: true });
  fs.writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--store') options.storeFile = argv[++i];
    else if (arg === '--pin') options.pin = argv[++i];
    else if (arg === '--plan') options.plan = argv[++i];
    else if (arg === '--days') options.days = Number(argv[++i]);
    else if (arg === '--note') options.note = argv[++i];
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/issue-premium-pin.mjs --store ./data/premium-pins.json [options]\n\nOptions:\n  --pin <PIN>       Use a specific PIN instead of generating one\n  --plan <PLAN>     Premium plan name (default: ${DEFAULT_PLAN})\n  --days <N>        Days until PIN expires (default: ${DEFAULT_DAYS})\n  --note <TEXT>     Admin note, e.g. payment/order reference\n  --json            Print machine-readable JSON\n`);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const result = issuePremiumPin(options);
    if (options.json) {
      console.log(JSON.stringify(result));
      return;
    }
    console.log(`PIN: ${result.pin}`);
    console.log(`Plan: ${result.plan}`);
    console.log(`Expires: ${result.expiresAt}`);
    console.log(`Store: ${result.storeFile}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
