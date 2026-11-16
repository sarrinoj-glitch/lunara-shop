import { CountUp } from '@/components/motion/count-up'
import { Stagger, FadeItem } from '@/components/motion/reveal'
import { t } from '@/lib/i18n'

/** «LUNARA в цифрах»: числа набегают при появлении. */
export function BrandStats({ values }: { values: Record<string, number> }) {
  return (
    <section aria-label={t.home.statsTitle} className="mx-auto max-w-[1440px] px-4 py-14 md:px-8 md:py-20">
      <Stagger className="grid grid-cols-2 gap-y-10 border-y border-line py-10 md:grid-cols-4" stagger={0.1}>
        {t.home.stats.map((s) => (
          <FadeItem key={s.key} className="flex flex-col items-center gap-2 text-center">
            <span className="display text-6xl text-terracotta md:text-8xl">
              <CountUp value={values[s.key] ?? 0} prefix={'prefix' in s ? s.prefix : ''} suffix={'suffix' in s ? s.suffix : ''} />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
          </FadeItem>
        ))}
      </Stagger>
    </section>
  )
}
