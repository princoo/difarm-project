import { FC } from 'react';
import { GiCow } from 'react-icons/gi';

interface IconCowProps {
  className?: string;
}

/** Cow icon for cattle keeping — same GiCow used on the dashboard. */
const IconCow: FC<IconCowProps> = ({ className = '' }) => {
  return <GiCow className={`w-5 h-5 shrink-0 ${className}`} />;
};

export default IconCow;
