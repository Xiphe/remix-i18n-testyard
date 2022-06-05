import { RemixEntryContext } from './RemixEntryContext';
import type { Context } from 'react';
import { useContext } from 'react';

type ContextType<T extends Context<any>> = Parameters<
  Parameters<T['Consumer']>[0]['children']
>[0];

type RemixEntryContextType = Exclude<
  ContextType<typeof RemixEntryContext>,
  undefined
>;

export function useRemixEntryContext(): RemixEntryContextType {
  const context = useContext(RemixEntryContext);

  if (!context) {
    throw new Error('Could not use remix entry context outside of Remix');
  }
  return context;
}
