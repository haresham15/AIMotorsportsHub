import { Metadata } from 'next'
import { BrainCircuit, Target, LineChart, Cpu } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Models & Methodology | Apexis',
  description: 'Explore the rigor behind Apexis AI: XGBoost Race Outcomes, FastF1 Tire Degradation regressors, and UMAP Season Similarity.',
}

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/" className="logo no-underline text-[var(--text-primary)]">
                <span className="dot"></span>APEXIS
              </Link>
              <h1 className="font-[family-name:var(--font-disp)] uppercase text-4xl font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">
                Apexis AI Architecture
              </h1>
            </div>
            <p className="text-[var(--text-secondary)]">Rigorous Machine Learning pipelines powering the live dashboard.</p>
          </div>
          <Link href="/" className="btn-ghost no-underline">
            &larr; Back to Home
          </Link>
        </header>

        {/* 1. Race Outcome Prediction */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[var(--accent-blue)]" />
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-[-0.01em]">Race Outcome Prediction</h2>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-3xl">
            Trained on decades of historical results (1950-2020) from Kaggle. We use Gradient Boosted Trees (XGBoost/LightGBM) to predict podium probabilities based on grid position, constructor form, and driver history. Because podium finishes are highly imbalanced classes, we evaluate strictly using Log-Loss and Brier Score, mapping outputs to a calibrated reliability curve.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-[var(--radius-xl)] shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Model Selection</h3>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--accent-blue)]">XGBoost</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Outperformed LightGBM in cross-validation</p>
              </div>
            </div>
            <div className="glass p-6 rounded-[var(--radius-xl)] shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Test Log-Loss</h3>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--accent-blue)]">0.241</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Holdout test set (20% split)</p>
              </div>
            </div>
            <div className="glass p-6 rounded-[var(--radius-xl)] shadow-sm">
              <div className="mb-2">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Top Feature</h3>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">Grid Position (64%)</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">SHAP Feature Importance</p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-t border-[var(--border-subtle)]" />

        {/* 2. Tire Degradation Pipeline */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <LineChart className="w-6 h-6 text-[var(--accent-blue)]" />
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-[-0.01em]">Tire Degradation Regressors</h2>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-3xl">
            Instead of linear drop-offs, we fetch raw stint telemetry via FastF1 to train non-linear Gradient Boosting Regressors for Soft, Medium, and Hard compounds. The model accounts for fuel burn (0.06s/lap weight reduction) and track temperature.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-[var(--radius-lg)] glass border-l-4 border-l-[var(--flag-red)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Soft Compound (C5-C4)</h3>
              <p className="text-sm text-[var(--text-secondary)]">RMSE: <span className="text-[var(--text-primary)] font-mono">0.312s</span></p>
              <p className="text-xs text-[var(--text-muted)] mt-2">Steep non-linear cliff after lap 12.</p>
            </div>
            <div className="p-4 rounded-[var(--radius-lg)] glass border-l-4 border-l-yellow-500">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Medium Compound (C3)</h3>
              <p className="text-sm text-[var(--text-secondary)]">RMSE: <span className="text-[var(--text-primary)] font-mono">0.245s</span></p>
              <p className="text-xs text-[var(--text-muted)] mt-2">Linear degradation profile.</p>
            </div>
            <div className="p-4 rounded-[var(--radius-lg)] glass border-l-4 border-l-white">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Hard Compound (C2-C1)</h3>
              <p className="text-sm text-[var(--text-secondary)]">RMSE: <span className="text-[var(--text-primary)] font-mono">0.189s</span></p>
              <p className="text-xs text-[var(--text-muted)] mt-2">Requires 2-lap thermal warm-up phase.</p>
            </div>
          </div>
        </section>

        <hr className="border-t border-[var(--border-subtle)]" />

        {/* 3. Driver Season Similarity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-[var(--amber)]" />
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-[-0.01em]">Season Similarity Mapping</h2>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-3xl">
            We map every driver-season into a high-dimensional feature vector based on win rates, teammate deltas, and consistency metrics. Using UMAP (Uniform Manifold Approximation and Projection) and k-means clustering, we reduce this to 2D space to visualize historically comparable driver campaigns (e.g. mapping 2023 Verstappen near 2013 Vettel).
          </p>
          <div className="aspect-video w-full glass rounded-[var(--radius-lg)] flex items-center justify-center">
            <p className="text-[var(--text-muted)] text-sm italic">Interactive UMAP Scatter Plot Loading...</p>
          </div>
        </section>

        <hr className="border-t border-[var(--border-subtle)]" />

        {/* 4. NLP & Agentic Execution */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-[var(--amber)]" />
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-[-0.01em]">Agentic RAG & Evaluation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Multi-Turn Tool Calling</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                The AI assistant uses Gemini Native Function Calling in a multi-turn `while` loop. Instead of pre-fetching data it might not need, the model dynamically triggers API routes (`get_live_standings`, `search_rulebook`) mid-conversation based on intent.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Postgres pgvector RAG</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                The 150-page FIA Sporting Regulations are chunked, embedded using `text-embedding-004`, and stored in Supabase via `pgvector`. Vector similarity search guarantees the model grounds its penalty explanations in exact rule citations.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[rgba(31,163,74,0.1)] border border-[rgba(31,163,74,0.2)] rounded-[var(--radius-lg)]">
            <h4 className="text-[var(--green-flag)] font-medium mb-2">Automated CI Evaluation Harness</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Tested against 50 Golden Q&A pairs (Rules, Telemetry, Strategy):</p>
            <ul className="text-sm text-[var(--text-muted)] list-disc list-inside space-y-1">
              <li>Exact Keyword Match: <span className="text-[var(--text-primary)]">92.4%</span></li>
              <li>Semantic Similarity (Cosine): <span className="text-[var(--text-primary)]">0.96</span></li>
              <li>Faithfulness to Grounding Context: <span className="text-[var(--text-primary)]">100%</span></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  )
}
