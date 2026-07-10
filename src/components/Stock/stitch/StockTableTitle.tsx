import { cn } from '@/utils';

export function StockTableTitle({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <h3
      className={cn(
        'w-full px-0 text-center font-bold uppercase tracking-wide stock-text',
        compact ? 'pb-0 pt-0 text-sm sm:text-base' : 'pb-1 pt-0 text-2xl sm:text-3xl',
      )}
    >
      {children}
    </h3>
  );
}
