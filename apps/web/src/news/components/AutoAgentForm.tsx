'use client';

import { useFormState } from 'react-dom';
import { useState } from 'react';
import { generateAiArticle } from '@news/lib/actions';

type AutoAgentFormProps = {
  articleType: 'news' | 'feature';
  label: string;
  description: string;
  disabled?: boolean;
  notice?: string;
};

export default function AutoAgentForm({ articleType, label, description, disabled, notice }: AutoAgentFormProps) {
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState('');
  const [tone, setTone] = useState('clear and confident');
  const [state, dispatch] = useFormState(generateAiArticle, { message: '' });

  return (
    <form
      action={disabled ? undefined : dispatch}
      className="rounded-3xl border border-dashed border-amber-300/70 bg-white/10 p-6"
    >
      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#f1c40f' }}>
        Desk • {label}
      </p>
      <h3 className="mt-2 text-2xl font-black">{description}</h3>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
            Topic or prompt
          </label>
          <input
            name="topic"
            required
            placeholder="e.g. ‘How AI curates new shows’"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
            disabled={disabled}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
            Tags (comma separated)
          </label>
          <input
            name="tags"
            placeholder="streaming, sci-fi, pop culture"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
            disabled={disabled}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
            Tone
          </label>
          <input
            name="tone"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
            placeholder="Clear and confident"
            disabled={disabled}
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          />
        </div>

        <input type="hidden" name="articleType" value={articleType} />

        <button
          type="submit"
          disabled={disabled || !topic.trim()}
          className="w-full rounded-full border border-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-100 transition hover:bg-amber-200/20 disabled:opacity-50"
        >
          {disabled ? 'AI disabled' : 'Generate with AI'}
        </button>
      </div>

      {(state?.message || notice) && (
        <p className="mt-4 text-sm text-amber-100">{notice || state.message}</p>
      )}
    </form>
  );
}
