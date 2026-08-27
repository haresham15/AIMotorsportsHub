# Apexis

A centralized, personalized web platform for motorsport fans to track their favorite racing series, teams, and drivers. Currently features AI-powered race analysis and predictive strategy modeling.

## Features

- **Multi-Series Support**: Track F1, F2, F3, Formula E, NASCAR, and GT World Challenge
- **AI-Powered Race Strategist**: Ask questions about races and get context-aware answers from a Gemini-powered Race Engineer Chatbot that reads live and simulated telemetry.
- **Machine Learning Strategy Predictor**: TensorFlow.js integration predicting tire degradation with real-time time-loss estimates for staying out on aging tires.
- **Computer Vision Standings Extractor**: In-browser OCR using `tesseract.js` to automatically extract live standings directly from TV broadcasts (runs entirely client-side).
- **Multi-Threaded Live Race Simulation**: 2D race map visualization powered by a custom Web Worker engine. Incorporates true track geometries (via OpenF1), session-specific dynamic lap logic (Sprint, Qualifying, Practice, Race), and dynamic framerate buffering for endurance events.
- **Public Portfolio Demo**: Clean, accessible interface with no login required for core features.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Serverless API Routes
- **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`)
- **Computer Vision**: Tesseract.js (In-Browser Web Worker OCR)
- **Generative AI**: Google Gemini API (`@google/generative-ai`)
- **Simulation Engine**: Custom Multi-Threaded Web Worker Pipeline

## Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key (free tier available)

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for local development instructions.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a comprehensive guide on how to deploy this application to Vercel.

## Project Structure

```text
├── app/
│   ├── dashboard/[series]/    # Sport-specific dashboard pages
│   ├── api/                   # Next.js Serverless API Routes
│   │   ├── ai/                # AI Chatbot endpoints
│   │   ├── f1/                # F1 data & OpenF1 endpoints
│   │   └── replay/            # Replay system endpoints
│   └── page.tsx               # Main dashboard
├── components/
│   └── dashboard/
│       ├── BroadcastScanner.tsx  # Tesseract.js CV integration
│       ├── StrategyPredictor.tsx # TensorFlow.js tire degradation predictor
│       ├── Chatbot.tsx        # AI chatbot interface
│       ├── LiveStandings.tsx  # Real-time race standings
│       └── LiveMap2D.tsx      # 2D race map visualization
├── lib/
│   └── ml/
│       └── tireModel.ts       # TensorFlow.js neural network definition
├── workers/                   # Web workers for heavy off-main-thread processing
│   └── simulator.worker.ts    # Race replay simulation worker
└── public/                    # Static assets
```

## Features in Detail

### Main Dashboard
- Overview of all supported racing series
- Navigation to sport-specific dashboards
- Predictive AI modeling

### Sport-Specific Dashboard
- **AI Strategy Predictor**: Dynamic charting projecting time penalties for staying out on aging tires.
- **Race Results & CV Broadcast Scanner**: Live standings with simulated updates, or sync via computer vision directly from an external live broadcast.
- **2D Live Race Map**: Visual representation of driver positions powered by a Web Worker simulation engine, scaling from 3-lap Quali sessions to 24-hour endurance events.
- **AI Race Engineer**: Ask questions about the race or series, and get answers grounded in current telemetry.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
