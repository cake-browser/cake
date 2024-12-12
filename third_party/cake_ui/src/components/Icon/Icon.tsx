import { icons } from './icons';
import { cn } from '../../utils/cn';

const baseClass = 'icon';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type IconButtonShape = 'square' | 'rounded' | 'circular';

const strokeMap = {
  sm: 1,
  md: 1.5,
  lg: 2,
};

export type IconProps = {
  name: keyof typeof icons;
  className?: string;
  style?: React.CSSProperties;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  shape?: IconButtonShape;
  stroke?: number;
};

export const Icon = ({
  name,
  className,
  style = {},
  stroke,
  size = 'sm',
  variant = 'primary',
  shape = 'circular',
}: IconProps) => {
  const IconComponent = icons[name] || <span></span>;

  const classes = cn(
    baseClass,
    className,
    `${baseClass}--${size}`,
    `${baseClass}--${variant}`,
    `${baseClass}--${shape}`
  );

  return (
    <div className={classes} style={style}>
      <IconComponent stroke={stroke || strokeMap[size]} />
    </div>
  );
};
