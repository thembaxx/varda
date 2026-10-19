'use client';
import Link from 'next/link';
export default function ErrorPage({reset}: {reset: () => void}) {
  return <main className="app-main"><div className="empty-state"><h1>A little pause.</h1><p>Something didn’t quite load. Let’s give it another go.</p><button className="button button-green" onClick={reset}>Try again</button><Link className="text-button" href="/">Back home</Link></div></main>;
}
