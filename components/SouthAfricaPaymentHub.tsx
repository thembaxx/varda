'use client';

import {useState} from 'react';
import {ArrowRight, ArrowUpRight, Bank, CreditCard, Trash, WifiSlash, LockKey, Wallet, CheckCircle, Receipt} from '@/components/ui/icons';
import {useExperience} from '@/components/ExperienceProvider';
import {useLocalState} from '@/hooks/useLocalState';
import type {VardaOrder} from '@/components/SpacesPanel';
import Reveal from '@/components/ui/Reveal';

interface PaymentIntent extends VardaOrder {id: string; savedAt: string}
const isIntents = (value: unknown): value is PaymentIntent[] => Array.isArray(value) && value.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.description === 'string' && typeof item.amountZar === 'number' && Number.isFinite(item.amountZar) && item.amountZar > 0 && typeof item.savedAt === 'string');
const money = (value: number) => `R ${value.toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

export default function SouthAfricaPaymentHub({selectedOrder}: {selectedOrder: VardaOrder}) {
  const {offline, feedback, notify} = useExperience();
  const [provider, setProvider] = useState<'payfast' | 'ozow'>('payfast');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [intents, setIntents] = useLocalState('varda.payment-intents.v2', [] as PaymentIntent[], isIntents);
  const [review, setReview] = useState<PaymentIntent | null>(null);
  const order = review || selectedOrder;

  function saveIntent() {
    setIntents(current => [{...order, id: crypto.randomUUID(), savedAt: new Date().toISOString()}, ...current].slice(0, 30));
    feedback('success'); notify('Saved for review. No payment has been made.');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || offline) return;
    const form = new FormData(event.currentTarget); setPending(true); setError('');
    try {
      const response = await fetch('/api/payments/checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({provider, itemName: order.name, itemDescription: order.description, amountZar: order.amountZar, buyerName: form.get('name'), buyerEmail: form.get('email')})});
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'We couldn’t open checkout. Please try again.'); return; }
      const gateway = provider === 'payfast' ? data.payfast : data.ozow;
      if (!gateway || !['https://sandbox.payfast.co.za/eng/process', 'https://pay.ozow.com/'].includes(gateway.processUrl)) throw new Error('Checkout isn’t available yet.');
      const gatewayForm = document.createElement('form'); gatewayForm.method = 'POST'; gatewayForm.action = gateway.processUrl;
      for (const [key, value] of Object.entries(gateway.fields)) { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = String(value); gatewayForm.appendChild(input); }
      document.body.appendChild(gatewayForm); feedback(); gatewayForm.submit();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Couldn’t connect to checkout. Please try again.'); }
    finally { setPending(false); }
  }

  return <div className="wallet-page"><Reveal className="page-title"><span className="eyebrow">The practical little things</span><h1>More living.<br /><em>Less life admin.</em></h1><p>Your shared spaces and greener-home plans, with room to review before you decide.</p></Reveal><div className="wallet-grid"><Reveal className="wallet-checkout"><div className="wallet-heading"><span className="quick-icon sage"><Wallet size={25} weight="duotone" /></span><div><h2>Your next little plan</h2><span>Review, then make it happen.</span></div></div><div className="order-summary"><span className="eyebrow">Selected for you to review</span><h3>{order.name}</h3><p>{order.description}</p><strong className="mono">{money(order.amountZar)}</strong>{review && <button className="text-button" onClick={() => setReview(null)}>Return to current selection</button>}</div><div className="checkout-notice"><LockKey size={20} /><p><strong>Sandbox checkout</strong>Payment providers need to be configured by your host. No booking is confirmed here. Saved plans are never charged automatically.</p></div><form className="account-form" onSubmit={submit}><div className="payment-methods">{([{id: 'payfast', label: 'PayFast', detail: 'Card & instant EFT', icon: CreditCard}, {id: 'ozow', label: 'Ozow', detail: 'Bank transfer', icon: Bank}] as const).map(({id, label, detail, icon: Icon}) => <button key={id} type="button" aria-pressed={provider === id} onClick={() => { setProvider(id); feedback(); }}><Icon size={24} weight="duotone" /><span>{label}<small>{detail}</small></span>{provider === id && <CheckCircle size={17} weight="fill" />}</button>)}</div><label>Your name<input name="name" autoComplete="name" required maxLength={80} placeholder="Your full name" /></label><label>Email for your receipt<input name="email" autoComplete="email" type="email" required placeholder="you@example.com" /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="button button-green" disabled={pending || offline} type="submit">{pending ? 'Opening secure checkout…' : 'Continue to sandbox checkout'}<ArrowUpRight size={18} /></button><button type="button" className="button button-outline" onClick={saveIntent}>{offline ? <WifiSlash size={18} /> : <Receipt size={18} />}Save for later</button>{offline && <p className="form-note">You’re offline. Save your plan now and review it when you reconnect.</p>}</form></Reveal><Reveal className="wallet-saved" delay={0.08}><div className="wallet-heading"><span className="quick-icon yellow"><Receipt size={25} weight="duotone" /></span><div><h2>Saved for a little later</h2><span>Plans, never completed payments.</span></div></div>{intents.length === 0 ? <div className="empty-state"><Receipt size={42} weight="duotone" /><h3>No rush. Make room for later.</h3><p>Save a plan and come back when you’re ready.</p></div> : <ul className="intent-list">{intents.map(intent => <li key={intent.id}><span><strong>{intent.name}</strong><small className="mono">{money(intent.amountZar)}</small><small>Saved on this device · unpaid</small></span><button className="icon-button" aria-label={`Review ${intent.name}`} onClick={() => { setReview(intent); window.scrollTo({top: 0, behavior: 'smooth'}); feedback(); }}><ArrowRight size={19} /></button><button className="icon-button" aria-label={`Remove ${intent.name}`} onClick={() => { setIntents(current => current.filter(item => item.id !== intent.id)); if (review?.id === intent.id) setReview(null); notify('Plan removed. A little more room.'); }}><Trash size={17} /></button></li>)}</ul>}<p className="form-note">Your saved plans stay in this browser. Reconnecting makes checkout available; it never processes your saved plans automatically.</p></Reveal></div></div>;
}
