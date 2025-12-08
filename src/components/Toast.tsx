import './Toast.css';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  kind?: ToastKind;
}

type Props = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind ?? 'info'}`}>
          <span className="toast__text">{toast.message}</span>
          <button className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="close">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
