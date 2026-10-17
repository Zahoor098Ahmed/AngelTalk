import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className={`relative w-full ${maxWidthClass} max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-4 sm:p-6 z-10 transition-all overflow-hidden`}>
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0 gap-3">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 sm:mt-4 overflow-y-auto flex-1 min-h-0 pr-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
};

