# Quick Start Guide

Get Apexis running locally in just a few minutes!

## Step 1: Install Dependencies

```bash
npm install
```

> [!NOTE]
> The first time you load a dashboard with the Computer Vision scanner active, `tesseract.js` will automatically download its required OCR language models (~30MB) into the browser cache.

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
- **Sync via Broadcast (Computer Vision)**: Navigate to a non-F1 series and click "Sync via Broadcast" to open the Tesseract.js scanner. Point it at a Youtube video of a race to see it extract live standings in real-time.
- **Dynamic Race Simulator**: Switch between the "Race", "Sprint", and "Qualifying" tabs on the F1 dashboard to see the Web Worker-powered replay engine instantly adjust the simulation length and scaling based on the session type.
- **AI Race Engineer**: Open the chatbot on a series dashboard and ask it for strategy advice. It will automatically read the simulated live telemetry.
- **ML Strategy Predictor**: Watch the TensorFlow.js model train on the fly and update its predictions for tire degradation on the right side of the dashboard.

## Next Steps

- Deploy the application to Vercel (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- Customize the ML models in `lib/ml/tireModel.ts`.
- Enhance the AI Chatbot prompts in `app/api/ai/chat/route.ts`.

Happy racing! 🏁
