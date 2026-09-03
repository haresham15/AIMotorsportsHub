'use client';

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageSquarePlus, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useUserProfile } from '@/lib/userPreferences';
import { toast } from 'sonner';

export const OPEN_SUGGESTIONS_EVENT = 'apexis_open_suggestions_modal';

export function openSuggestionsModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SUGGESTIONS_EVENT));
  }
}

const CATEGORIES = [
  'Feature Request',
  'Bug Report',
  'Telemetry & Physics Feedback',
  'UI / UX Suggestion',
  'New Racing Series Request',
  'Historical Archive Request',
  'General Suggestion',
];

export default function SuggestionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useUserProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setSubmitted(false);
      setIsOpen(true);
    };

    window.addEventListener(OPEN_SUGGESTIONS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_SUGGESTIONS_EVENT, handleOpen);
  }, []);

  // Pre-fill if logged in
  useEffect(() => {
    if (profile && !name) {
      setName(profile.displayName || '');
      setEmail(profile.email || '');
    }
  }, [profile, name]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please provide a subject');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter your suggestion or feedback');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to transmit suggestion');
      }

      setSubmitted(true);
      toast.success('Suggestion sent to haresham2006@gmail.com!');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-[560px] bg-[rgba(11,14,19,0.96)] border border-white/15 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)]">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-wide font-[family-name:var(--font-disp)] uppercase">
                Apexis Suggestions Box
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Direct Dispatch • Engineering Line
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close suggestions modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recipient Notice Banner */}
        <div className="px-6 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300 font-mono">
          <Mail size={13} className="shrink-0 text-[var(--amber)]" />
          <span>Feedback route: <strong>haresham2006@gmail.com</strong></span>
        </div>

        {submitted ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-scale-in">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2 font-[family-name:var(--font-disp)] uppercase">
              Transmission Delivered!
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
              Thank you for helping improve Apexis. Your suggestion has been dispatched directly to <strong>haresham2006@gmail.com</strong>.
            </p>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10 w-full max-w-md text-left text-xs text-[var(--text-muted)] mb-6 font-mono">
              <div><strong className="text-white">Subject:</strong> {subject}</div>
              <div className="mt-1"><strong className="text-white">Category:</strong> {category}</div>
            </div>

            <button
              onClick={handleReset}
              className="btn-primary text-xs px-6 py-2.5 cursor-pointer font-bold"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* Suggestion Form */
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Turner"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                  Reply Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#12161F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[var(--amber)] focus:outline-none transition-colors cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                Subject <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your suggestion or issue"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-[var(--text-muted)]">
                  Your Suggestion / Feedback <span className="text-amber-400">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {message.length} chars
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your ideas for new telemetry tools, UI tweaks, driver stats, bug reports, or feature wishes..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Press Esc to dismiss
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-2 cursor-pointer font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Suggestion</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
