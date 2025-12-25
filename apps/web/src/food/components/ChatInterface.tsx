'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Recipe } from '@food/lib/types';
import { useStore } from '@food/lib/store';
import { Send, ChefHat, Loader2, Mic, MicOff, Volume2, VolumeX, Save, Clock, RefreshCw } from 'lucide-react';
import { categorizeItem } from '@food/lib/utils';

interface ChatInterfaceProps {
  recipes: Recipe[];
  sessionKey?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function parseSuggestedItems(text: string) {
  // Very lightweight parser: grab bullet-ish lines and take first phrase as item name.
  const lines = text.split('\n').map((l) => l.trim());
  const candidates = lines.filter((l) => /^[-*•]/.test(l));
  return candidates
    .map((line) => line.replace(/^[-*•]\s*/, ''))
    .map((line) => {
      const name = line.split(':')[0].split('(')[0].trim();
      return name;
    })
    .filter((name) => name.length > 0);
}

export function ChatInterface({ recipes, sessionKey = 'default' }: ChatInterfaceProps) {
  const apiKey = useStore((state) => state.apiKey);
  const user = useStore((state) => state.user);
  const addToGroceryList = useStore((state) => state.addToGroceryList);
  const groceryList = useStore((state) => state.groceryList);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyMissing = !apiKey;
  const [mode, setMode] = useState<'assist' | 'substitute' | 'pantry'>('assist');
  const [autoSuggest] = useState(true);
  const [suggestedItems, setSuggestedItems] = useState<string[]>([]);
  const [stubMode, setStubMode] = useState(false);
  const [diet, setDiet] = useState<'none' | 'vegetarian' | 'vegan' | 'gluten-free'>('none');
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [savedSessions, setSavedSessions] = useState<{ id: string; name: string; messages: Message[] }[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ label: string; remaining: number; interval?: any } | null>(null);
  const pantryItems = useMemo(
    () =>
      groceryList
        .filter((item) => !item.checked)
        .map((item) => `${item.item}${item.quantity ? ` (${item.quantity} ${item.unit})` : ''}`),
    [groceryList]
  );
  const primaryRecipe = recipes[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sousChefSessions');
    if (stored) {
      try {
        setSavedSessions(JSON.parse(stored));
        const match = JSON.parse(stored).find((s: any) => s.id === sessionKey);
        if (match) setMessages(match.messages || []);
      } catch {
        // ignore bad storage
      }
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!speakReplies || typeof window === 'undefined') return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant?.content) {
      const utterance = new SpeechSynthesisUtterance(lastAssistant.content);
      utterance.rate = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, speakReplies]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (!apiKey && !stubMode) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Add your OpenAI API key in Settings before chatting.',
        },
      ]);
      return;
    }

    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (stubMode) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Stub mode: I would normally call OpenAI here. Imagine a friendly cooking tip tailored to your recipe.',
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/food/api/sous-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          recipeContexts: recipes,
          apiKey,
          mode,
          diet,
          pantryItems,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      const parsed = parseSuggestedItems(data.content || '');
      setSuggestedItems(parsed);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having a little trouble thinking right now. Could you ask that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredientsToList = async () => {
    if (!primaryRecipe?.ingredients?.length) return;
    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sign in first so I can save to your Grocery List.' },
      ]);
      return;
    }
    const items = primaryRecipe.ingredients.map((ing) => ({
      id: Math.random().toString(36).substring(7),
      item: ing.item,
      quantity: ing.quantity,
      unit: ing.unit,
      note: ing.note,
      category: categorizeItem(ing.item),
      checked: false,
    }));
    try {
      await addToGroceryList(items);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I added these ingredients to your grocery list.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `Could not add items: ${err.message}`
              : 'I could not add items right now. Please try again.',
        },
      ]);
    }
  };

  const handleAddSuggestedToList = async () => {
    if (!suggestedItems.length) return;
    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sign in first so I can save to your Grocery List.' },
      ]);
      return;
    }
    const items = suggestedItems.map((name) => ({
      id: Math.random().toString(36).substring(7),
      item: name,
      quantity: null as number | null,
      unit: '',
      note: 'From Sous Chef suggestion',
      category: categorizeItem(name),
      checked: false,
    }));
    try {
      await addToGroceryList(items);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I added the suggested items to your grocery list.' },
      ]);
      setSuggestedItems([]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `Could not add suggested items: ${err.message}`
              : 'I could not add items right now. Please try again.',
        },
      ]);
    }
  };

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const handleSaveSession = () => {
    if (typeof window === 'undefined') return;
    const name = savedName.trim() || `Session ${new Date().toLocaleString()}`;
    const entry = { id: sessionKey, name, messages };
    const next = [...savedSessions.filter((s) => s.id !== sessionKey), entry];
    setSavedSessions(next);
    localStorage.setItem('sousChefSessions', JSON.stringify(next));
  };

  const handleLoadSession = (id: string) => {
    const match = savedSessions.find((s) => s.id === id);
    if (match) {
      setMessages(match.messages || []);
      setSavedName(match.name);
    }
  };

  const startTimer = (seconds: number, label: string) => {
    if (activeTimer?.interval) {
      clearInterval(activeTimer.interval);
    }
    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev) return prev;
        if (prev.remaining <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1, interval };
      });
    }, 1000);
    setActiveTimer({ label, remaining: seconds, interval });
  };

  const contextTips = useMemo(() => {
    const ingredients = recipes.flatMap((r) => r.ingredients.map((i) => i.item.toLowerCase()));
    const tips: string[] = [];
    if (ingredients.some((i) => i.includes('chicken'))) tips.push('Remind me safe temps for chicken and resting time.');
    if (ingredients.some((i) => i.includes('beef') || i.includes('steak'))) tips.push('How to sear without overcooking?');
    if (ingredients.some((i) => i.includes('egg'))) tips.push('How to avoid scrambling eggs in sauces?');
    if (recipes.some((r) => r.instructions.some((step) => step.toLowerCase().includes('bake')))) {
      tips.push('Give me doneness cues beyond oven time.');
    }
    if (pantryItems.length) tips.push('Given my pantry list, what swaps make sense?');
    return tips.slice(0, 4);
  }, [recipes, pantryItems]);

  useEffect(() => {
    return () => {
      if (activeTimer?.interval) clearInterval(activeTimer.interval);
    };
  }, [activeTimer]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden flex flex-col h-[600px]">
        <div className="bg-secondary p-4 flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-full">
                <ChefHat className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-serif font-bold text-lg">Sous Chef</h3>
                <p className="text-xs text-stone-100 opacity-90">Here to help with your cooking</p>
                <p className="text-[11px] text-amber-50/80">
                  Context: {recipes.map((r) => r.title).join(', ').slice(0, 80) || 'None'}
                </p>
            </div>
        </div>

        <div className="bg-white px-4 py-3 border-b border-stone-200 flex flex-wrap gap-2 items-center text-xs text-stone-600">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => startTimer(60, '1 min')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
            >
              <Clock className="w-3 h-3" /> 1m timer
            </button>
            <button
              type="button"
              onClick={() => startTimer(300, '5 min')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
            >
              <Clock className="w-3 h-3" /> 5m timer
            </button>
            {activeTimer && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                {activeTimer.label}: {activeTimer.remaining}s
                <button
                  onClick={() => {
                    if (activeTimer.interval) clearInterval(activeTimer.interval);
                    setActiveTimer(null);
                  }}
                  className="ml-1 text-[11px] underline"
                >
                  Clear
                </button>
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {contextTips.map((tip) => (
              <button
                key={tip}
                onClick={() => setInput(tip)}
                className="px-3 py-1 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
              >
                {tip}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-stone-50 space-y-4" ref={scrollRef}>
            {messages.length === 0 && (
                <div className="text-center text-stone-400 mt-10">
                    <p className="text-sm">Ask me anything about these recipes!</p>
                    <p className="text-xs mt-2">"Walk me through with times and doneness cues."</p>
                    <p className="text-xs">"Make a shopping plan from my pantry list."</p>
                </div>
            )}
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none shadow-sm'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {loading && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-white border-t border-stone-200 space-y-3">
            {keyMissing && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Add your OpenAI key in Settings to unlock Sous Chef.
              </div>
            )}
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setMode('assist')}
                className={`px-3 py-1.5 rounded-full border ${mode === 'assist' ? 'bg-primary text-white border-primary' : 'border-stone-200 text-stone-600'}`}
              >
                General help
              </button>
              <button
                onClick={() => {
                  setMode('substitute');
                  setInput('Suggest substitutions for missing ingredients and keep flavor similar.');
                }}
                className={`px-3 py-1.5 rounded-full border ${mode === 'substitute' ? 'bg-primary text-white border-primary' : 'border-stone-200 text-stone-600'}`}
              >
                Substitutions
              </button>
              <button
                onClick={() => {
                  setMode('pantry');
                  setInput('Here are the ingredients in my pantry: ');
                }}
                className={`px-3 py-1.5 rounded-full border ${mode === 'pantry' ? 'bg-primary text-white border-primary' : 'border-stone-200 text-stone-600'}`}
              >
                Pantry audit
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <label className="inline-flex items-center gap-1 border border-stone-200 rounded-full px-3 py-1.5">
                Diet:
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as any)}
                  className="bg-transparent text-stone-700 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-free</option>
                </select>
              </label>
              {process.env.NODE_ENV !== 'production' && (
                <label className="inline-flex items-center gap-1 border border-stone-200 rounded-full px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={stubMode}
                    onChange={(e) => setStubMode(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                  />
                  Stub mode (no API)
                </label>
              )}
            </div>
            {primaryRecipe?.ingredients?.length ? (
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Add the main recipe’s ingredients to your Grocery List.</span>
                <button
                  onClick={handleAddIngredientsToList}
                  className="px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                  disabled={loading}
                >
                  Add ingredients
                </button>
              </div>
            ) : null}
            {suggestedItems.length > 0 && (
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Send Sous Chef’s suggested items to your Grocery List.</span>
                <button
                  onClick={handleAddSuggestedToList}
                  className="px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                  disabled={loading}
                >
                  Add suggested
                </button>
              </div>
            )}
            {autoSuggest && messages.length === 0 && (
              <div className="text-xs text-stone-500 space-y-1">
                <p>Try: “Walk me through this recipe step by step with times.”</p>
                <p>Or: “If I halve this recipe, what are the new amounts?”</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center text-xs text-stone-600">
              <button
                type="button"
                onClick={() => setSpeakReplies((p) => !p)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border ${speakReplies ? 'border-primary text-primary' : 'border-stone-200'}`}
              >
                {speakReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Read answers
              </button>
              <button
                type="button"
                onClick={toggleListening}
                disabled={!speechSupported}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border ${listening ? 'border-primary text-primary' : 'border-stone-200'} ${speechSupported ? '' : 'opacity-50'}`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? 'Listening…' : 'Push to talk'}
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={savedName}
                  onChange={(e) => setSavedName(e.target.value)}
                  placeholder="Session name"
                  className="px-3 py-1.5 border border-stone-200 rounded-full text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveSession}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 hover:border-primary hover:text-primary"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                {savedSessions.length > 0 && (
                  <select
                    className="px-2 py-1.5 border border-stone-200 rounded-full text-xs"
                    onChange={(e) => handleLoadSession(e.target.value)}
                    value=""
                  >
                    <option value="">Load</option>
                    {savedSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={keyMissing ? "Add a key in Settings first" : "Ask a question..."}
                  className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  disabled={keyMissing}
              />
              <button 
                  type="submit" 
                  disabled={loading || !input.trim() || keyMissing}
                  aria-label="Send message"
                  className="p-2 bg-primary text-white rounded-full hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                  <Send className="w-5 h-5" />
              </button>
              {activeTimer && (
                <button
                  type="button"
                  onClick={() => startTimer(activeTimer.remaining + 60, activeTimer.label)}
                  className="p-2 border border-stone-200 rounded-full hover:border-primary"
                  title="Add 1 minute"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </form>
        </div>
    </div>
  );
}
