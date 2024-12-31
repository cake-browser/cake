import { icons } from './icons';
import { cn } from '../../utils/cn';
import { React, forwardRef, useImperativeHandle, useRef } from '../../deps/react';

const baseClass = 'ck-icon';

export type IconSize = 'tiny' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconAttention = 'lowest' | 'low' | 'moderate' | 'high' | 'highest';

export type IconShape = 'square' | 'rounded' | 'circle';

export type IconProps = React.HTMLAttributes<HTMLButtonElement> & {
  icon: keyof typeof icons;
  size?: IconSize;
  shape?: IconShape;
  attention?: IconAttention;
  options?: string[];
};

export type IconHandle = {
  focus: () => void;
};

export const Icon = forwardRef<IconHandle, IconProps>((iconProps, ref) => {
  const {
    icon,
    className,
    options = [],
    size = 'sm',
    shape = 'circle',
    attention = 'moderate',
    tabIndex = -1,
    style = {},
    ...props
  } = iconProps;

  const buttonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => buttonRef.current && buttonRef.current.focus(),
  }));

  if (!options.length) {
    options.push(icon);
  }

  const classes = cn(
    baseClass,
    `${baseClass}--${icon}`,
    `${baseClass}--${size}`,
    `${baseClass}--${shape}`,
    `${baseClass}--${attention}`,
    className ? className : '',
    className ? `${className}--${icon}` : ''
  );

  style.cursor = props.onClick ? 'pointer' : 'default';

  return (
    <button className={classes} tabIndex={tabIndex} style={style} ref={buttonRef} {...props}>
      {options.map((option) => {
        const SvgIcon = icons[option];
        return <SvgIcon key={option} style={{ opacity: option === icon ? 1 : 0 }} />;
      })}
    </button>
  );
});
