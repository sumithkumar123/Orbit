import React from 'react';
import useSystemState from '../hooks/useSystemState';

export default function SystemBanner() {
  const { running, reason } = useSystemState();
  if (running) return null;
  return (
    <div className="w-full bg-yellow-200 text-yellow-900 text-sm px-3 py-2 text-center">
      System paused by admin{reason ? ` — ${reason}` : ''}. Messaging, broadcast, and calls are disabled.
    </div>
  );
}
