import { icons } from './icons';
import { cn } from '../../utils/cn';
import { React } from '../../deps/react';

const baseClass = 'ck-icon-button';

export type IconButtonSize = 'tiny' |'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconButtonAttention = 'lowest' | 'low' | 'moderate' | 'high' | 'highest';

export type IconButtonShape = 'square' | 'rounded' | 'circle';

export type IconButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  icon: keyof typeof icons;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  attention?: IconButtonAttention;
};

export const IconButton = ({
  icon,
  className,
  size = 'sm',
  shape = 'circle',
  attention = 'moderate',
  tabIndex = -1,
  ...props
}: IconButtonProps) => {
  const IconComponent = icons[icon] || <span></span>;

  const classes = cn(
    baseClass,
    `${baseClass}--${icon}`,
    `${baseClass}--${size}`,
    `${baseClass}--${shape}`,
    `${baseClass}--${attention}`,
    className ? className : '',
    className ? `${className}--${icon}` : '',
  );

  return (
    <button className={classes} tabIndex={tabIndex} {...props}>
      <IconComponent />
    </button>
  );
};
