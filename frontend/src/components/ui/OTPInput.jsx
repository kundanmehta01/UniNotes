import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const OTPInput = ({ 
  length = 6, 
  value = '', 
  onChange, 
  onComplete,
  disabled = false,
  className = '',
  error = false,
  autoFocus = false
}) => {
  const [otp, setOtp] = useState(value.split(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    setOtp(value.split(''));
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, digit) => {
    if (disabled) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Move to next input if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when OTP is fully entered
    if (otpString.length === length && !otpString.includes('')) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    // Handle backspace
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current input
        handleChange(index, '');
      } else if (index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        handleChange(index - 1, '');
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Handle paste
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const pastedOtp = text.replace(/\D/g, '').slice(0, length).split('');
        const newOtp = [...pastedOtp];
        // Fill remaining with empty strings
        while (newOtp.length < length) {
          newOtp.push('');
        }
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
        
        // Focus on the next empty input or the last input
        const nextEmptyIndex = newOtp.findIndex(digit => !digit);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
        inputRefs.current[focusIndex]?.focus();

        // Call onComplete if OTP is fully entered
        if (pastedOtp.length === length) {
          onComplete?.(newOtp.join(''));
        }
      });
    }
    // Only allow numbers
    else if (!/\d/.test(e.key) && !['Tab', 'Enter', 'Delete'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleFocus = (index) => {
    // Select all text when focusing
    inputRefs.current[index]?.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedOtp = pastedData.replace(/\D/g, '').slice(0, length).split('');
    
    const newOtp = [...pastedOtp];
    // Fill remaining with empty strings
    while (newOtp.length < length) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    onChange?.(newOtp.join(''));
    
    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();

    // Call onComplete if OTP is fully entered
    if (pastedOtp.length === length) {
      onComplete?.(newOtp.join(''));
    }
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-12 text-center text-lg font-semibold border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors duration-200',
            {
              'border-red-500 focus:ring-red-500': error,
              'border-gray-300 hover:border-gray-400': !error && !disabled,
              'bg-gray-100 cursor-not-allowed opacity-50': disabled,
              'bg-white': !disabled,
            }
          )}
        />
      ))}
    </div>
  );
};

export default OTPInput;
