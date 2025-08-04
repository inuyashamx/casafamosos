"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-6 max-w-md w-full border border-border/20 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">{getIcon()}</span>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        
        <p className="text-muted-foreground mb-6">{message}</p>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 