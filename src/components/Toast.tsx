import React, { useEffect, useState } from 'react';
import { ClearIcon } from '../utils/icons/ClearIcon.tsx'; 

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose(); 
  };
  
  if (!isVisible) return null;

  return (
    <div className='toast-container'>
      <div className='toast toast--error'>
        <p className='toast__message'>{message}</p>
        <button 
          type="button" 
          className='toast__close-btn' 
          onClick={handleClose}
          aria-label="Закрити повідомлення"
        >
          <ClearIcon className='toast__close-icon' />
        </button>
      </div>
    </div>
  );
};