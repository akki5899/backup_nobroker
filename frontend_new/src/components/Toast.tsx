'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Raised above the bottom-right ChatBot FAB so toasts never cover it.
          pointer-events-none on the wrapper lets clicks pass through the gaps;
          each toast re-enables pointer events for its close button. */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-toast space-y-2 flex flex-col items-end pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600'
  };

  return (
    <div className={`${colors[toast.type]} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[300px] max-w-md animate-slide-up pointer-events-auto`}>
      {icons[toast.type]}
      <p className="flex-1 font-medium text-sm">{toast.message}</p>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
