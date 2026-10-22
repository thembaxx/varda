'use client';

import {useCallback, useEffect, useState} from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Heart, Plus, Quotes, ChatCircle, ArrowUpRight} from '@/components/ui/icons';
import {neighbourPosts} from '@/lib/community';
import {useExperience} from '@/components/ExperienceProvider';
import Dialog from '@/components/ui/Dialog';
import Reveal from '@/components/ui/Reveal';

interface SharedPost {id: string; name: string; title: string; message: string; category: string; likes: number; liked: boolean; createdAt: number}
const categories = ['All', 'Culture', 'Food & drinks', 'Outdoors', 'Work'];
function isPost(value: unknown): value is SharedPost { const post = value as SharedPost | null; return !!post && typeof post.id === 'string' && typeof post.title === 'string' && typeof post.message === 'string' && typeof post.name === 'string' && typeof post.category === 'string'; }

export default function CommunityNotes({onAccount}: {onAccount: () => void}) {
  const {offline, feedback, notify} = useExperience();
  const [filter, setFilter] = useState('All');
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [compose, setCompose] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(async () => {
    if (offline) return;
    try {
      const response = await fetch('/api/community', {cache: 'no-store'});
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (Array.isArray(data.posts) && data.posts.every(isPost)) {
        setPosts(data.posts); setLoadError(false);
        try { localStorage.setItem('varda.community-cache.v1', JSON.stringify(data.posts.map((post: SharedPost) => ({...post, liked: false})))); } catch {}
      }
    } catch { setLoadError(true); }
  }, [offline]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored: unknown = JSON.parse(localStorage.getItem('varda.community-cache.v1') || '[]');
        if (Array.isArray(stored) && stored.every(isPost)) setPosts(stored);
      } catch { /* Storage is optional. */ }
    });
    void load();
    return () => { active = false; };
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || offline) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError('');
    try {
      const response = await fetch('/api/community', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({title: form.get('title'), message: form.get('message'), category: form.get('category')})});
      const data = await response.json();
      if (!response.ok) { if (response.status === 401) { setCompose(false); onAccount(); } else setError(data.message || 'Please try again.'); return; }
      feedback('success'); notify('Your note is on the board. Let the good conversations begin.'); setCompose(false); await load();
    } catch { setError('We couldn’t share your note. Your text is still here.'); }
    finally { setPending(false); }
  }

  async function like(post: SharedPost) {
    if (offline || pending) return;
    setPending(true);
    try {
      const response = await fetch('/api/community', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'like', id: post.id})});
      if (response.status === 401) { onAccount(); return; }
      if (!response.ok) throw new Error();
      feedback(); await load();
    } catch { notify('Couldn’t save that reaction. Please try again.'); }
    finally { setPending(false); }
  }

  const visible = posts.filter(post => filter === 'All' || post.category === filter);
  return <section className="community-section" id="neighbour-notes">
    <Reveal className="section-heading"><div><span className="eyebrow">A few friendly faces</span><h2>Neighbours, then friends.</h2></div><button className="text-button" disabled={offline} onClick={() => { setCompose(true); feedback(); }}><Plus size={18} />Leave a note</button></Reveal>
    <div className="filter-row note-filters" aria-label="Filter community notes">{categories.map(category => <button key={category} className={category === 'Culture' ? 'filter-coral' : category === 'Food & drinks' ? 'filter-yellow' : ''} aria-pressed={filter === category} onClick={() => { setFilter(category); feedback(); }}>{category}</button>)}</div>
    {loadError && !offline && <p className="form-note">We couldn’t refresh the board. <button className="text-button" onClick={() => void load()}>Try again</button></p>}
    {posts.length > 0 ? <div className="notes-grid grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{visible.map((post, index) => <Reveal key={post.id} delay={index * 0.04}><article className="neighbour-card"><div className="note-author"><span className={`avatar ${index % 2 ? 'sage' : 'coral'}`}>{post.name.slice(0, 2).toUpperCase()}</span><span>{post.name}<small>{post.category}</small></span><ChatCircle size={24} /></div><h3>{post.title}</h3><p>{post.message}</p><div className="note-footer"><span>Community note</span><motion.button whileTap={{scale: 0.85}} aria-label={`Like ${post.title}`} aria-pressed={!!post.liked} disabled={offline || pending} onClick={() => void like(post)}><Heart size={22} weight={post.liked ? 'fill' : 'regular'} /><span className="mono">{post.likes}</span></motion.button></div></article></Reveal>)}</div> : <div className="notes-grid grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{neighbourPosts.filter(post => filter === 'All' || post.category === filter).map((post, index) => <Reveal key={post.id} delay={index * 0.04}><article className="neighbour-card starter-card"><div className="note-author"><span className={`avatar ${post.tone}`}><Quotes size={22} /></span><span>A conversation starter<small>{post.category}</small></span><ChatCircle size={25} /></div><h3>{post.title}</h3><p>{post.message}</p><div className="note-footer"><span>Make the first move</span><button aria-label={`Start a note about ${post.category}`} disabled={offline} onClick={() => setCompose(true)}><ArrowUpRight size={22} /></button></div></article></Reveal>)}</div>}
    {(posts.length > 0 && visible.length === 0 || posts.length === 0 && filter === 'Work') && <div className="empty-state"><ChatCircle size={32} /><h3>A quiet corner, for now.</h3><p>Start a conversation and see who joins.</p><button disabled={offline} className="text-button" onClick={() => setCompose(true)}>Write the first note<ArrowRight size={17} /></button></div>}
    {compose && <Dialog title="Start something lovely" onClose={() => setCompose(false)}><p className="dialog-intro">An invitation, a little idea, or a friendly hello. Shared with your name on the community board.</p><form className="account-form" onSubmit={submit}><label>A little headline<input name="title" minLength={3} maxLength={100} required placeholder="Anyone for a morning walk?" /></label><label>Pick a corner<select name="category">{categories.slice(1).map(category => <option key={category}>{category}</option>)}</select></label><label>Your note<textarea name="message" required minLength={10} maxLength={600} rows={4} placeholder="A few words are all it takes…" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={pending || offline} type="submit" className="button button-green">{pending ? 'Sharing…' : 'Put it on the board'}<ArrowRight size={18} /></button></form></Dialog>}
  </section>;
}
