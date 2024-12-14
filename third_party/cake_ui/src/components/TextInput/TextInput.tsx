import { React, useState, useRef, useImperativeHandle, useEffect, useCallback, forwardRef } from '../../deps/react';
import { cn } from '../../utils/cn';
import { key } from '../../utils/keyboard';

const baseClass = 'ck-text-input';

export type TextInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextInputProps = {
  size?: TextInputSize;
  type?: string;
  value?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: boolean;
  spellCheck?: boolean;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onEsc?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  formatter?: (value: string) => string;
  sanitizer?: (value: string, key?: string) => string;
  validator?: (value: string) => boolean;
  isRequired?: boolean;
  updateFromAbove?: boolean;
  validateWhenValueExists?: boolean;
  renderAfter?: (value: string) => React.ReactNode;
}

export type TextInputHandle = {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  validate: () => boolean;
}

export const TextInput = forwardRef<TextInputHandle, TextInputProps>((props, ref) => {
  // Props
  const {
    size = 'sm',
    type = 'text',
    value = '',
    className = '',
    placeholder = '',
    disabled = false,
    autoComplete = false,
    spellCheck = false,
    onChange = () => {},
    onEnter = () => {},
    onEsc = () => {},
    onFocus = () => {},
    onBlur = () => {},
    onArrowUp = () => {},
    onArrowDown = () => {},
    formatter = (value) => value,
    sanitizer = (value) => value,
    validator = (value) => value.trim() !== '',
    isRequired = false,
    updateFromAbove = false,
    validateWhenValueExists = false,
    renderAfter = () => null,
  } = props;

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKey = useRef<string | undefined>(undefined);

  // State
  const [data, setData] = useState({
    value: sanitizer(value),
    isValid: true,
  });

  // Handles
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current && inputRef.current.focus(),
    blur: () => inputRef.current && inputRef.current.blur(),
    getValue: () => data.value,
    validate,
  }));

  // Validate input value on some type of "submission".
  const validate = useCallback((updateState = true) => {
    const performValidation = () => {
      const isValid = validator(data.value);

      if (updateState && isValid !== data.isValid) {
        setData((prevState) => ({ ...prevState, isValid }));
      }

      return isValid;
    };

    if (isRequired) {
      return performValidation();
    }

    if (validateWhenValueExists) {
      return data.value ? performValidation() : true;
    }

    return true;
  }, [data.value, data.isValid, validator, isRequired, validateWhenValueExists]);

  // -- Event handlers -------------

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizer(e.currentTarget.value, lastKey.current);
    setData({ value, isValid: true });
    onChange(value);
  }, [sanitizer, onChange]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    lastKey.current = e.key;

    switch (lastKey.current) {
      case key.ESCAPE:
        onEsc();
        break;
      case key.ARROW_UP:
        onArrowUp();
        break;
      case key.ARROW_DOWN:
        onArrowDown();
        break;
      default:
        break;
    }
  }, [onEsc, onArrowUp, onArrowDown]);

  const onKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (lastKey.current === key.ENTER) {
      onEnter();
    }
  }, [onEnter]);

  // -- Effects -------------

  useEffect(() => {
    if (!updateFromAbove) return;
    const sanitized = sanitizer(value);
    if (value !== data.value) {
      setData((prevState) => ({ ...prevState, value: sanitized }));
    }
  }, [updateFromAbove, value, data.value, sanitizer]);

  const formattedValue = formatter(data.value);

  const classes = cn(
    baseClass,
    `--${size}`,
    !data.isValid ? `${baseClass}--invalid` : '',
    disabled ? `${baseClass}--disabled` : '',
    formattedValue ? `${baseClass}--has-value` : '',
    isRequired ? `${baseClass}--required` : '',
    className,
  );

  const useValue = formattedValue === null ? '' : formattedValue;

  return (
    <div className={classes}>
      <input
        type={type}
        value={useValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete ? 'on' : 'off'}
        spellCheck={spellCheck}
        onChange={(e) => !disabled && handleChange(e)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        ref={inputRef}
      />
      {renderAfter(formattedValue || placeholder || '')}
    </div>
  );
});