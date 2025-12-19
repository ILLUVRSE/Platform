'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createArticle } from '@news/lib/actions';

const initialState = { message: '', errors: {} as Record<string, string[]> };
const AUTOSAVE_KEY = 'create-article-draft';
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function CreateArticlePage() {
  const getDraft = () => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const draft = useMemo(() => getDraft(), []);

  const [state, dispatch] = useActionState(createArticle, initialState);
  const [content, setContent] = useState(() => draft?.content ?? '');
  const [excerpt, setExcerpt] = useState(() => draft?.excerpt ?? '');
  const [title, setTitle] = useState(() => draft?.title ?? '');
  const [slug, setSlug] = useState(() => draft?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>(() => draft?.status ?? 'draft');
  const [scheduledFor, setScheduledFor] = useState(() => draft?.scheduledFor ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState(() => draft?.tags ?? '');
  const [coverImage, setCoverImage] = useState(() => draft?.coverImage ?? '');
  const [coverPrompt, setCoverPrompt] = useState('');
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [coverRevisedPrompt, setCoverRevisedPrompt] = useState('');
  const [pullQuote, setPullQuote] = useState(() => draft?.pullQuote ?? '');
  const initialSourcesList = draft?.sourcesList ?? [{ name: 'Wikipedia', url: 'https://wikipedia.org' }];
  const [sources, setSources] = useState(() => draft?.sources ?? JSON.stringify(initialSourcesList));
  const [sourcesList, setSourcesList] = useState<{ name: string; url: string }[]>(initialSourcesList);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [license, setLicense] = useState(() => draft?.license ?? '');
  const [region, setRegion] = useState(() => draft?.region ?? 'WORLD');
  const [language, setLanguage] = useState(() => draft?.language ?? 'en');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => draft?.lastSavedAt ?? null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<{ id: string; title: string; url: string }[]>([]);
  const searchParams = useSearchParams();
  const [articleType, setArticleType] = useState<'news' | 'feature'>('news');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const slugCheckTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/news/api/media')
      .then((res) => res.json())
      .then((data) => setMedia(data))
      .catch(() => setMedia([]));
  }, []);

  useEffect(() => {
    const payload = {
      title,
      slug,
      excerpt,
      content,
      tags,
      coverImage,
      pullQuote,
      sources,
      sourcesList,
      status,
      scheduledFor,
      articleType,
      license,
      region,
      language,
      lastSavedAt: new Date().toISOString(),
    };
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      setLastSavedAt(payload.lastSavedAt);
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, slug, excerpt, content, tags, coverImage, pullQuote, sources, sourcesList, status, scheduledFor, articleType, license, region, language]);

  useEffect(() => {
    const type = searchParams?.get?.('type');
    if (type === 'feature' || type === 'news') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArticleType(type);
    }
  }, [searchParams]);

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

  const insertImage = () => {
    const url = window.prompt('Image URL');
    if (!url) return;
    applyMarkdown(`![alt text](${url})`);
  };

  const insertEmbed = () => {
    const url = window.prompt('Embed URL (YouTube, Spotify, etc.)');
    if (!url) return;
    applyMarkdown(`[Watch/Listen](${url})`);
  };

  const generateCoverImage = async () => {
    if (!coverPrompt.trim()) {
      setCoverError('Enter a short visual prompt first.');
      return;
    }
    setCoverError('');
    setCoverGenerating(true);
    try {
      const res = await fetch('/news/api/internal/openai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: coverPrompt, articleId: null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setCoverError(data.error || 'Failed to generate image. Try again.');
        return;
      }
      if (data.url) setCoverImage(data.url);
      if (data.revisedPrompt) setCoverRevisedPrompt(data.revisedPrompt);
    } catch (error) {
      console.error('Cover image generation failed', error);
      setCoverError('Could not reach the AI service.');
    } finally {
      setCoverGenerating(false);
    }
  };

  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    const next = [...sourcesList, { name: newSourceName.trim(), url: newSourceUrl.trim() }];
    setSourcesList(next);
    setSources(JSON.stringify(next));
    setNewSourceName('');
    setNewSourceUrl('');
  };

  const handleSlugChange = (value: string, fromTitle = false) => {
    if (!fromTitle) setSlugTouched(true);
    const next = slugify(value);
    setSlug(next);
    setSlugStatus('checking');
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/news/api/articles/check-slug?slug=${encodeURIComponent(next)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!slug.trim()) errs.slug = 'Slug is required';
    if (slugStatus === 'taken') errs.slug = 'Slug already used';
    if (!content.trim()) errs.content = 'Body is required';
    if (!license.trim()) errs.license = 'License is required';
    setClientErrors(errs);
    if (Object.keys(errs).length) return;
    if (status === 'published') {
      const confirmed = window.confirm('Publish now to selected regions/languages?');
      if (!confirmed) return;
    }
    const formData = new FormData(e.currentTarget);
    await dispatch(formData);
    localStorage.removeItem(AUTOSAVE_KEY);
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
              Create Story
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Publish a news update or feature with cover art, sources, and scheduling.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/news/admin/dashboard"
              className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
            >
              Dashboard
            </Link>
            <Link
              href="/news/admin/articles"
              className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
            >
              Manage
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          action={dispatch}
          className="space-y-8 rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Title" name="title" required error={clientErrors.title || state?.errors?.['title']?.[0]}>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) handleSlugChange(e.target.value, true);
                }}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </Field>
            <Field label="Slug" name="slug" required error={clientErrors.slug || state?.errors?.['slug']?.[0]}>
              <input
                type="text"
                name="slug"
                id="slug"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {slugStatus === 'checking'
                  ? 'Checking availability...'
                  : slugStatus === 'taken'
                  ? 'Slug already used — pick another.'
                  : slugStatus === 'available'
                  ? 'Slug available.'
                  : 'Auto-generated from title. Editable.'}
              </p>
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

          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Region" name="region">
              <select
                name="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="WORLD">World</option>
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="AS">Asia</option>
                <option value="AF">Africa</option>
                <option value="SA">South America</option>
                <option value="OC">Oceania</option>
              </select>
            </Field>
            <Field label="Language" name="locale">
              <select
                name="locale"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="zh">中文</option>
              </select>
            </Field>
            <Field label="License" name="license" required error={clientErrors.license || state?.errors?.['license']?.[0]}>
              <select
                name="license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="">Select a license</option>
                <option value="CC-BY-4.0">CC-BY 4.0</option>
                <option value="CC-BY-SA-4.0">CC-BY-SA 4.0</option>
                <option value="CC0">CC0 / Public Domain</option>
                <option value="ILLUVRSE-PUBLIC">ILLUVRSE Public (permission required)</option>
                <option value="ALL-RIGHTS-RESERVED">All Rights Reserved</option>
              </select>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                License is required before publish. Choose the correct reuse terms.
              </p>
            </Field>
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
              <div className="space-y-3">
                <input
                  id="coverImage"
                  name="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Paste an image URL or generate below"
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
                />
                {coverImage && (
                  <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                    <div className="h-16 w-24 overflow-hidden rounded-lg" style={{ background: 'var(--panel)' }}>
                      <img src={coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Preview from current URL.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="text-xs uppercase tracking-[0.16em]"
                        style={{ color: 'var(--forest)' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--forest)' }}>
                    Generate with OpenAI
                  </p>
                  <textarea
                    rows={2}
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="Describe the cover art you want (scene, mood, lighting, style)"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                  />
                  {coverRevisedPrompt && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Revised prompt: {coverRevisedPrompt}
                    </p>
                  )}
                  {coverError && <p className="text-xs text-rose-500">{coverError}</p>}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={generateCoverImage}
                      disabled={coverGenerating}
                      className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] disabled:opacity-60"
                      style={{ background: 'var(--sage)', color: '#fff', boxShadow: '0 10px 24px -14px rgba(62,95,80,0.4)' }}
                    >
                      {coverGenerating ? 'Generating...' : 'Use ChatGPT'}
                    </button>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Uses your server OPENAI_API_KEY to create a new cover image.
                    </p>
                  </div>
                </div>
              </div>
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
            <Field label="Sources" name="sources">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Source name"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="w-1/2 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
                  />
                  <input
                    type="url"
                    placeholder="https://source.com"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="w-1/2 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSource}
                    className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourcesList.map((s) => (
                    <span key={`${s.name}-${s.url}`} className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                      {s.name}
                    </span>
                  ))}
                  {sourcesList.length === 0 && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      Add at least one source with name and URL.
                    </span>
                  )}
                </div>
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
                  Structured sources are required for transparency.
                </p>
              </div>
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
                <ToolbarButton label="Image" onClick={insertImage} />
                <ToolbarButton label="Embed" onClick={insertEmbed} />
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
            {clientErrors.content && <p className="text-sm text-rose-500">{clientErrors.content}</p>}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Save as draft, schedule, or publish instantly. Autosaves every few seconds.
              {lastSavedAt && <span className="ml-2 text-xs">Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>}
            </p>
            <button
              type="submit"
              className="rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition"
              style={{ background: 'var(--sage)', color: '#fff', boxShadow: '0 12px 30px -14px rgba(62,95,80,0.4)' }}
            >
              Save Article
            </button>
          </div>

          {state?.message && (
            <p className="text-sm text-rose-500" id="form-error">
              {state.message}
            </p>
          )}
        </form>

        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Media library
            </p>
            <Link
              href="/news/admin/media"
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: 'var(--forest)' }}
            >
              Manage
            </Link>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {media.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => applyMarkdown(`![${asset.title}](${asset.url})`)}
                className="group flex items-center gap-3 rounded-xl border p-3 text-left transition"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
              >
                <div className="h-14 w-16 overflow-hidden rounded-lg" style={{ background: 'var(--panel)' }}>
                  <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                    {asset.title}
                  </p>
                  <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
                    {asset.url}
                  </p>
                </div>
              </button>
            ))}
            {media.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No media yet. Add some URLs in Admin → Media to quickly insert images.
              </p>
            )}
          </div>
        </div>
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
