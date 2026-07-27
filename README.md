# The Motorsport Hub

A centralized, personalized web platform for motorsport fans to track their favorite racing series, teams, and drivers. Currently features AI-powered race analysis and predictive strategy modeling.

## Features

- **Multi-Series Support**: Track F1, F2, F3, Formula E, NASCAR, and GT World Challenge
- **AI-Powered Race Strategist**: Ask questions about races and get context-aware answers from a Gemini-powered Race Engineer Chatbot that reads simulated live telemetry.
- **Machine Learning Strategy Predictor**: TensorFlow.js integration that predicts tire degradation and provides real-time time-loss estimates for staying out on aging tires.
- **Live Race Data**: Real-time standings and 2D race map visualization (simulated via mock data streams).
- **Public Portfolio Demo**: Clean, accessible interface with no login required.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Serverless API Routes
- **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`)
- **Generative AI**: Google Gemini API (`@google/generative-ai`)

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
│   │   ├── f1/                # F1 data endpoints
│   │   └── replay/            # Replay system endpoints
│   └── page.tsx               # Main dashboard
├── components/
│   └── dashboard/
│       ├── StrategyPredictor.tsx # TensorFlow.js tire degradation predictor
│       ├── Chatbot.tsx        # AI chatbot interface
│       ├── LiveStandings.tsx  # Real-time race standings
│       └── LiveMap2D.tsx      # 2D race map visualization
├── lib/
│   └── ml/
│       └── tireModel.ts       # TensorFlow.js neural network definition
└── public/                    # Static assets
```

## Features in Detail

### Main Dashboard
- Overview of all supported racing series
- Navigation to sport-specific dashboards
- Predictive AI modeling

### Sport-Specific Dashboard
- **AI Strategy Predictor**: Dynamic charting projecting time penalties for staying out on aging tires.
- **Race Results**: Live standings with real-time simulated updates.
- **2D Live Race Map**: Visual representation of driver positions.
- **AI Race Engineer**: Ask questions about the race or series, and get answers grounded in current telemetry.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
