import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/utils';
import { STOCK_TABLE_ACTION_BTN } from './layout';

export function StockTableIconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(STOCK_TABLE_ACTION_BTN, className)}
    >
      {children}
    </button>
  );
}
