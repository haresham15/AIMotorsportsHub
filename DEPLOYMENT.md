# Deployment Guide

This guide will walk you through deploying **Apexis** to Vercel. Since the application has been refactored to use in-browser Computer Vision (Tesseract.js Web Workers) and a Multi-Agent AI Orchestrator (via Gemini), deployment is incredibly fast, 100% serverless, and requires zero external database configuration.

## Prerequisites

1. A GitHub account.
2. A Vercel account (free tier is perfect).
3. A Google Gemini API Key.

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

If you haven't already, ensure your local repository is pushed to a GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click the **Add New...** button and select **Project**.
3. Locate your GitHub repository for this project and click **Import**.

### 3. Configure the Project

Vercel will automatically detect that this is a Next.js project. You do not need to change the build commands or output directories.

The most important step is setting up the environment variables.

1. Expand the **Environment Variables** section.
2. Add the following variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_actual_gemini_api_key_here`
3. Click **Add**.

### 4. Deploy

Click the **Deploy** button. Vercel will now:

- Install your `npm` dependencies (including `tesseract.js` and `@google/generative-ai`).
- Build the Next.js application (`npm run build`).
- Provision serverless functions for the Next.js API routes (`app/api/*`).

This process usually takes about 1-2 minutes.

### 5. View Your Live Application

Once the deployment is complete, Vercel will provide you with a live URL (e.g., `https://aimotorsportshub.vercel.app`).

Click on the URL to view your live, public-facing portfolio project.

> [!TIP]
> **Client-Side Heavy Lifting:** The Computer Vision features (Tesseract.js OCR) and the new Multi-Threaded Track Replay Engine run directly and efficiently inside the client's browser via Web Workers. This ensures that the heavy simulation and OCR processing is completely offloaded from Vercel's serverless functions, keeping your deployment fast, scalable, and well within the free-tier limits. The Multi-Agent AI securely calls your Gemini API key via the Vercel serverless functions.

## Troubleshooting

- **Build Errors**: Check the Vercel deployment logs. If there are TypeScript errors, ensure you run `npm run build` locally first to catch them.
- **Chatbot / AI Features Failing**: Double-check that your `GEMINI_API_KEY` is correctly set in the Vercel Environment Variables. If you added it after the first deployment, you will need to trigger a redeploy for the environment variable to take effect.
