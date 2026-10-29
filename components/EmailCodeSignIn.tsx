'use client';

import {useState} from 'react';
import {ArrowRight} from '@/components/ui/icons';
import {authClient} from '@/lib/auth-client';

export default function EmailCodeSignIn({offline, onSuccess}: {offline: boolean; onSuccess: () => void}) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || offline) return;
    setBusy(true);
    setError('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({email: email.trim(), type: 'sign-in'});
      if (result.error) throw new Error(result.error.message || 'Could not send a code.');
      setCode('');
      setSent(true);
    } catch {
      setError('We could not send a code. Check your email address or try password sign-in.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || offline || !/^\\d{6}$/.test(code)) return;
    setBusy(true);
    setError('');
    try {
      const result = await authClient.signIn.emailOtp({email: email.trim(), otp: code});
      if (result.error) throw new Error(result.error.message || 'Code not accepted.');
      setCode('');
      onSuccess();
    } catch {
      setError('The code is invalid or has expired. Check it or request another code.');
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <p className="dialog-intro">{sent ? `We sent a six-digit code to ${email}.` : 'We’ll email you a one-time code. No password needed.'}</p>
    <form className="account-form" onSubmit={sent ? verify : send}>
      {!sent ? <label>Email address<input name="code-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} /></label>
        : <label>Six-digit email code<input name="email-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="000000" /></label>}
      {offline && <p className="form-note">Reconnect to sign in with an email code.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button button-green" disabled={busy || offline}>{busy ? 'One moment…' : sent ? 'Verify and sign in' : 'Send sign-in code'}<ArrowRight size={18} /></button>
    </form>
    {sent && <div className="flex flex-wrap gap-3">
      <button type="button" className="text-button" disabled={busy || offline} onClick={() => { setSent(false); setCode(''); setError(''); }}>Use another email</button>
      <button type="button" className="text-button" disabled={busy || offline} onClick={() => { void send({preventDefault() {}} as React.FormEvent<HTMLFormElement>); }}>Resend code</button>
    </div>}
    <p className="account-security">Codes expire after five minutes and can be used only once. Never share your code.</p>
  </div>;
}
