'use client';

import { useEffect, useRef, useState } from 'react';
import s from './landing.module.css';

/**
 * The install command in a compact field: the command scrolls sideways inside it instead of widening the row,
 * and a copy button puts the whole command on the clipboard.
 */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={s.command}>
      {/* Focusable so keyboard users can scroll the command; labelled for screen readers. */}
      <code className={s.commandText} tabIndex={0} aria-label={`Install command: ${command}`}>
        {command}
      </code>
      <button type="button" className={s.copyBtn} onClick={copy} aria-label={copied ? 'Copied' : 'Copy the install command'}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className={s.srOnly} role="status">
        {copied ? 'Command copied to the clipboard' : ''}
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="5.25" y="5.25" width="8" height="8" rx="1.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.75 3.25V3a1.75 1.75 0 0 0-1.75-1.75H4A1.75 1.75 0 0 0 2.25 3v5A1.75 1.75 0 0 0 4 9.75h.25" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
