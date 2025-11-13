'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Portal } from '@/components/ui/portal';
import { CheckCircle, AlertTriangle, Info, X, DollarSign } from 'lucide-react';

interface InputModalProps {
  show: boolean;
  title: string;
  message: string;
  inputLabel: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  inputType?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'success' | 'warning' | 'error' | 'info' | 'money';
}

export function InputModal({
  show,
  title,
  message,
  inputLabel,
  inputPlaceholder = '',
  inputDefaultValue = '',
  inputType = 'text',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'info',
}: InputModalProps) {
  const [inputValue, setInputValue] = useState(inputDefaultValue);

  if (!show) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue);
    }
  };

  const handleCancel = () => {
    setInputValue(inputDefaultValue);
    onCancel();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-16 w-16 text-amber-500" />;
      case 'error':
        return <X className="h-16 w-16 text-red-500" />;
      case 'money':
        return <DollarSign className="h-16 w-16 text-green-500" />;
      default:
        return <Info className="h-16 w-16 text-blue-500" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      case 'money':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleCancel}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            {message}
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="modal-input" className="text-sm font-medium">
                {inputLabel}
              </Label>
              <Input
                id="modal-input"
                type={inputType}
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full mt-1"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={getButtonVariant()}
              onClick={handleConfirm}
              disabled={isLoading || !inputValue.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? 'Procesando...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// Hook para usar el modal de input de forma más sencilla
export function useInputModal() {
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    inputLabel: string;
    inputPlaceholder?: string;
    inputDefaultValue?: string;
    inputType?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'success' | 'warning' | 'error' | 'info' | 'money';
    onConfirm: (value: string) => void;
  }>({
    show: false,
    title: '',
    message: '',
    inputLabel: '',
    onConfirm: () => {},
  });

  const openInputModal = (config: Omit<typeof modalConfig, 'show'>) => {
    setModalConfig({ ...config, show: true });
  };

  const closeInputModal = () => {
    setModalConfig(prev => ({ ...prev, show: false }));
  };

  return {
    modalConfig,
    openInputModal,
    closeInputModal,
  };
}

// Modal simple para mensajes de éxito/error
interface MessageModalProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
  hideButton?: boolean;
}

export function MessageModal({
  show,
  title,
  message,
  onClose,
  type = 'info',
  buttonText = 'OK',
  hideButton = false,
}: MessageModalProps) {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-16 w-16 text-amber-500" />;
      case 'error':
        return <X className="h-16 w-16 text-red-500" />;
      default:
        return <Info className="h-16 w-16 text-blue-500" />;
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>
          {!hideButton && (
            <div className="flex justify-center">
              <Button
                onClick={onClose}
                className="min-w-[100px]"
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}