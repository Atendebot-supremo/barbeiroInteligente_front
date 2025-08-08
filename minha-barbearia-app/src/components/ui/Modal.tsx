import React from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="bg-bg-secondary text-text-secondary border border-border rounded-lg shadow-xl">
          {title && (
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            </div>
          )}
          <div className="px-5 py-4">
            {children}
          </div>
          {footer && (
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

