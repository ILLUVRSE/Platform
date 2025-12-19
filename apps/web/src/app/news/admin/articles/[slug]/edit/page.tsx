'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { updateArticle } from '@news/lib/actions';

const initialState = { message: '', errors: {} as Record<string, string[]> };

export default function EditArticlePage({ params }: { params: { slug: string } }) {
  const [state, dispatch] = useFormState(updateArticle, initialState);
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [scheduledFor, setScheduledFor] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(params.slug);
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [pullQuote, setPullQuote] = useState('');
  const [sources, setSources] = useState('[]');
  const [articleType, setArticleType] = useState<'news' | 'feature'>('news');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  type ArticlePayload = {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    status: 'draft' | 'scheduled' | 'published';
    scheduledFor?: string | null;
    tags?: { name: string; slug: string }[];
    coverImage?: string | null;
    pullQuote?: string | null;
    sources?: unknown;
  };

  useEffect(() => {
    fetch(`/news/api/articles/${params.slug}`)
      .then((res) => res.json())
      .then((data: ArticlePayload) => {
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt || '');
        setContent(data.content || '');
        setStatus(data.status || 'draft');
        setScheduledFor(
          data.scheduledFor ? new Date(data.scheduledFor).toISOString().slice(0, 16) : '',
        );
        setTags(data.tags?.map((t) => t.name).join(', ') || '');
        setCoverImage(data.coverImage || '');
        setPullQuote(data.pullQuote || '');
        setSources(data.sources ? JSON.stringify(data.sources) : '[]');
        if (data.tags?.some((t) => t.slug === 'feature')) {
          setArticleType('feature');
        } else if (data.tags?.some((t) => t.slug === 'news')) {
          setArticleType('news');
        }
      })
      .catch(() => {});
  }, [params.slug]);

  const applyMarkdown = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const nextValue =
      value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    setContent(nextValue);
    requestAnimationFrame(() => {
      const pos = selectionStart + before.length + selected.length + after.length;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
              Admin
            </p>
            <h1 className="text-3xl font-black" style={{ color: 'var(--forest)' }}>
              Edit Story
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Update copy, metadata, and schedule or publish.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/news/admin/articles"
              className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
            >
              Back to list
            </Link>
            <Link
              href={`/news/articles/${slug}`}
              className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
            >
              View
            </Link>
          </div>
        </div>

        <form
          action={dispatch}
          className="space-y-8 rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <input type="hidden" name="existingSlug" value={params.slug} />
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Title" name="title" required error={state?.errors?.['title']?.[0]}>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
            <Field label="Slug" name="slug" required error={state?.errors?.['slug']?.[0]}>
              <input
                type="text"
                name="slug"
                id="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
          </div>

          <Field label="Excerpt" name="excerpt" error={state?.errors?.['excerpt']?.[0]}>
            <textarea
              name="excerpt"
              id="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short teaser for lists and previews"
              className="w-full rounded-xl border px-3 py-2 outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
                Type
              </p>
              <div className="flex flex-wrap gap-2">
                {(['news', 'feature'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setArticleType(type)}
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={
                      articleType === type
                        ? { background: 'rgba(91,143,123,0.16)', border: '1px solid var(--sage)', color: 'var(--forest)' }
                        : { background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--text)' }
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input type="hidden" name="articleType" value={articleType} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                We’ll tag it so it shows up in News or Features.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                Status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Schedule</option>
                <option value="published">Publish now</option>
              </select>
              {state?.errors?.['status']?.[0] && (
                <p className="text-sm text-rose-500">{state.errors['status'][0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                Scheduled publish (optional)
              </label>
              <input
                type="datetime-local"
                name="scheduledFor"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                disabled={status !== 'scheduled'}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
              {state?.errors?.['scheduledFor']?.[0] && (
                <p className="text-sm text-rose-500">{state.errors['scheduledFor'][0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Tags (comma separated)" name="tags">
              <input
                id="tags"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. sci-fi, streaming, award-season"
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
            <Field label="Cover image URL" name="coverImage">
              <input
                id="coverImage"
                name="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Pull quote" name="pullQuote">
              <input
                id="pullQuote"
                name="pullQuote"
                value={pullQuote}
                onChange={(e) => setPullQuote(e.target.value)}
                placeholder="A standout line to highlight"
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
            <Field label="Sources JSON (name/url objects)" name="sources">
              <textarea
                id="sources"
                name="sources"
                rows={3}
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Example: {'[{"name":"IMDB","url":"https://imdb.com"}]'}
              </p>
            </Field>
          </div>

          <div className="space-y-3 rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
                Body (Markdown)
              </p>
              <div className="flex flex-wrap gap-2">
                <ToolbarButton label="Bold" onClick={() => applyMarkdown('**', '**')} />
                <ToolbarButton label="Italic" onClick={() => applyMarkdown('_', '_')} />
                <ToolbarButton label="Quote" onClick={() => applyMarkdown('> ')} />
                <ToolbarButton label="Heading" onClick={() => applyMarkdown('### ')} />
                <ToolbarButton label="List" onClick={() => applyMarkdown('- ')} />
                <ToolbarButton label="Code" onClick={() => applyMarkdown('`', '`')} />
              </div>
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="ml-auto rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {!showPreview ? (
              <textarea
                name="content"
                id="content"
                ref={textareaRef}
                rows={14}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 font-mono text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
                placeholder="Write in Markdown. Use the buttons above for quick formatting."
              />
            ) : (
              <div
                className="prose max-w-none rounded-2xl border p-5"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
              >
                {content.trim() ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>Nothing to preview yet.</p>
                )}
              </div>
            )}
            {state?.errors?.['content']?.[0] && (
              <p className="text-sm text-rose-500">{state.errors['content'][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Save as draft, schedule, or publish instantly.
            </p>
            <button
              type="submit"
              className="rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition"
              style={{ background: 'var(--sage)', color: '#fff', boxShadow: '0 12px 30px -14px rgba(62,95,80,0.4)' }}
            >
              Update Article
            </button>
          </div>

          {state?.message && (
            <p className="text-sm text-rose-500" id="form-error">
              {state.message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  children,
  required,
  error,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
        {label} {required ? '*' : ''}
      </label>
      {children}
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
    >
      {label}
    </button>
  );
}
