# STARVIA Deployment Guide

## Development
npm run dev — starts Vite dev server on port 3000

## Build
npm run build — creates production build in dist/

## Preview
npm run preview — preview production build locally

## Deploy to Vercel
1. Connect GitHub repo to Vercel
2. Vercel auto-detects Vite framework
3. Build command: npm run build
4. Output directory: dist

## Deploy to Netlify
1. Connect GitHub repo to Netlify
2. Build command: npm run build
3. Publish directory: dist
