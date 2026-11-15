'use client'

import { ErrorState } from '@/components/shop/states'

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined
  return <ErrorState reset={retry} digest={digest} />
}
