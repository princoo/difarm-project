declare module '@hookform/resolvers/zod' {
  import type { FieldValues, Resolver } from 'react-hook-form';
  import type { z } from 'zod';

  export function zodResolver<T extends z.ZodTypeAny>(
    schema: T,
    schemaOptions?: Partial<z.ParseParams>,
    resolverOptions?: { mode?: 'async' | 'sync'; raw?: boolean },
  ): Resolver<z.infer<T> extends FieldValues ? z.infer<T> : FieldValues>;
}
