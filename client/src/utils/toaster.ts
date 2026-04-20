export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (toasts: Toast[]) => void;

class Toaster {
  private toasts: Toast[] = [];
  private listeners: ToastListener[] = [];
  private nextId = 0;

  subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = this.nextId++;
    const newToast: Toast = { id, message, type };
    
    this.toasts = [...this.toasts, newToast];
    this.notify();

    setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
      this.notify();
    }, duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }
}

export const toaster = new Toaster();
