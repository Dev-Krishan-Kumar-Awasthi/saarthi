import React from 'react';
import { useSaarthiStore } from '../store/saarthiStore';

export default function Toast() {
  const { toasts } = useSaarthiStore();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
