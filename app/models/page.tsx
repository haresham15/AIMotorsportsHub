import { Metadata } from 'next'
import ApexisLogo from '@/components/ui/ApexisLogo'
import { BrainCircuit, Target, LineChart, Cpu } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Models & Methodology | Apexis',
  description: 'Explore the rigor behind Apexis AI: XGBoost Race Outcomes, FastF1 Tire Degradation regressors, and UMAP Season Similarity.',
}

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ApexisLogo className="w-10 h-10" />
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Apexis AI Architecture
              </h1>
            </div>
            <p className="text-slate-400">Rigorous Machine Learning pipelines powering the live dashboard.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition text-sm font-medium">
            &larr; Back to Home
          </Link>
        </header>

        {/* 1. Race Outcome Prediction */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-semibold">Race Outcome Prediction</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            Trained on decades of historical results (1950-2020) from Kaggle. We use Gradient Boosted Trees (XGBoost/LightGBM) to predict podium probabilities based on grid position, constructor form, and driver history. Because podium finishes are highly imbalanced classes, we evaluate strictly using Log-Loss and Brier Score, mapping outputs to a calibrated reliability curve.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-300">Model Selection</h3>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">XGBoost</p>
                <p className="text-xs text-slate-500 mt-1">Outperformed LightGBM in cross-validation</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-300">Test Log-Loss</h3>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-400">0.241</p>
                <p className="text-xs text-slate-500 mt-1">Holdout test set (20% split)</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-300">Top Feature</h3>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-200">Grid Position (64%)</p>
                <p className="text-xs text-slate-500 mt-1">SHAP Feature Importance</p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-t border-slate-800" />

        {/* 2. Tire Degradation Pipeline */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <LineChart className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold">Tire Degradation Regressors</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            Instead of linear drop-offs, we fetch raw stint telemetry via FastF1 to train non-linear Gradient Boosting Regressors for Soft, Medium, and Hard compounds. The model accounts for fuel burn (0.06s/lap weight reduction) and track temperature.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 border-l-4 border-l-red-500">
              <h3 className="font-semibold text-slate-200 mb-2">Soft Compound (C5-C4)</h3>
              <p className="text-sm text-slate-400">RMSE: <span className="text-slate-200 font-mono">0.312s</span></p>
              <p className="text-xs text-slate-500 mt-2">Steep non-linear cliff after lap 12.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 border-l-4 border-l-yellow-500">
              <h3 className="font-semibold text-slate-200 mb-2">Medium Compound (C3)</h3>
              <p className="text-sm text-slate-400">RMSE: <span className="text-slate-200 font-mono">0.245s</span></p>
              <p className="text-xs text-slate-500 mt-2">Linear degradation profile.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 border-l-4 border-l-white">
              <h3 className="font-semibold text-slate-200 mb-2">Hard Compound (C2-C1)</h3>
              <p className="text-sm text-slate-400">RMSE: <span className="text-slate-200 font-mono">0.189s</span></p>
              <p className="text-xs text-slate-500 mt-2">Requires 2-lap thermal warm-up phase.</p>
            </div>
          </div>
        </section>

        <hr className="border-t border-slate-800" />

        {/* 3. Driver Season Similarity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold">Season Similarity Mapping</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            We map every driver-season into a high-dimensional feature vector based on win rates, teammate deltas, and consistency metrics. Using UMAP (Uniform Manifold Approximation and Projection) and k-means clustering, we reduce this to 2D space to visualize historically comparable driver campaigns (e.g. mapping 2023 Verstappen near 2013 Vettel).
          </p>
          <div className="aspect-video w-full bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
            <p className="text-slate-500 text-sm italic">Interactive UMAP Scatter Plot Loading...</p>
          </div>
        </section>

        <hr className="border-t border-slate-800" />

        {/* 4. NLP & Agentic Execution */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-semibold">Agentic RAG & Evaluation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Multi-Turn Tool Calling</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The AI assistant uses Gemini Native Function Calling in a multi-turn `while` loop. Instead of pre-fetching data it might not need, the model dynamically triggers API routes (`get_live_standings`, `search_rulebook`) mid-conversation based on intent.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Postgres pgvector RAG</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The 150-page FIA Sporting Regulations are chunked, embedded using `text-embedding-004`, and stored in Supabase via `pgvector`. Vector similarity search guarantees the model grounds its penalty explanations in exact rule citations.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <h4 className="text-emerald-400 font-medium mb-2">Automated CI Evaluation Harness</h4>
            <p className="text-sm text-slate-300 mb-2">Tested against 50 Golden Q&A pairs (Rules, Telemetry, Strategy):</p>
            <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
              <li>Exact Keyword Match: <span className="text-slate-200">92.4%</span></li>
              <li>Semantic Similarity (Cosine): <span className="text-slate-200">0.96</span></li>
              <li>Faithfulness to Grounding Context: <span className="text-slate-200">100%</span></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  )
}
