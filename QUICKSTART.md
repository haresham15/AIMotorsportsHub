# Quick Start Guide

Get The Motorsport Hub running locally in just a few minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key.
3. Copy the key.

## Step 3: Configure Environment

Create a `.env.local` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_key_here
```

## Step 4: Run the App

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Explore the Features

- **No Login Required**: Jump straight into the dashboard!
- **AI Race Engineer**: Open the chatbot on a series dashboard and ask it for strategy advice. It will automatically read the simulated live telemetry.
- **ML Strategy Predictor**: Watch the TensorFlow.js model train on the fly and update its predictions for tire degradation on the right side of the dashboard.

## Next Steps

- Deploy the application to Vercel (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- Customize the ML models in `lib/ml/tireModel.ts`.
- Enhance the AI Chatbot prompts in `app/api/ai/chat/route.ts`.

Happy racing! 🏁
