import { GridSkeleton } from '@/components/shop/states'

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8" aria-busy="true">
      <div className="mb-10 grid gap-8 md:grid-cols-2">
        <div className="space-y-4 pt-10">
          <div className="h-16 w-3/4 animate-pulse bg-sand" />
          <div className="h-16 w-1/2 animate-pulse bg-sand" />
          <div className="h-16 w-2/3 animate-pulse bg-sand" />
        </div>
        <div className="arch mx-auto aspect-[4/5] w-3/4 animate-pulse bg-sand" />
      </div>
      <GridSkeleton count={4} />
    </div>
  )
}
