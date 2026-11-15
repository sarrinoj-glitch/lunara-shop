import { RevealLines, Stagger, FadeItem } from '@/components/motion/reveal'
import { t } from '@/lib/i18n'

/** «Как заказать» 01/02/03 — нумерованные карточки (skincareagents). */
export function HowToOrder() {
  return (
    <section id="how" className="grain bg-terracotta text-ivory">
      <div className="relative z-[2] mx-auto max-w-[1440px] px-4 py-20 md:px-8 md:py-28">
        <RevealLines className="display mb-14 text-4xl md:text-6xl" lines={[t.home.stepsTitle]} />
        <Stagger className="grid gap-12 md:grid-cols-3 md:gap-8" stagger={0.15}>
          {t.home.steps.map((s, i) => (
            <FadeItem key={s.title} className="border-t border-ivory/30 pt-6">
              <span className="display block text-[96px] leading-none text-transparent [-webkit-text-stroke:1px_var(--ivory)] md:text-[120px]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 text-xl uppercase tracking-[0.12em]">{s.title}</h3>
              <p className="mt-3 max-w-xs leading-relaxed text-ivory/85">{s.text}</p>
            </FadeItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
