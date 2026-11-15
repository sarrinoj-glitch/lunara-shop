import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RevealLines, FadeIn } from '@/components/motion/reveal'
import { DrawLine } from '@/components/motion/draw-line'
import { Parallax } from '@/components/motion/parallax'
import { Magnetic } from '@/components/motion/magnetic'
import { ProductImage } from '@/components/shop/product-image'
import { t } from '@/lib/i18n'

/** Манифест: коллаж из арок + линия, рисующаяся при скролле. */
export function Manifesto({ images }: { images: (string | null)[] }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <DrawLine className="absolute inset-x-0 top-10 h-[80%] w-full text-terracotta/50" />
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className="md:col-span-7 md:col-start-1 md:pt-20">
          <RevealLines
            className="display text-[9vw] md:text-[4.6vw] xl:text-7xl"
            lines={[
              t.home.manifestoLines[0],
              <span key="1" className="md:pl-[10%]">{t.home.manifestoLines[1]}</span>,
              <span key="2" className="accent-serif text-terracotta md:pl-[30%]">{t.home.manifestoLines[2]}</span>,
            ]}
          />
          <FadeIn delay={0.2} className="mt-10 flex flex-col gap-8 md:flex-row md:items-center md:pl-[10%]">
            <p className="max-w-md leading-relaxed text-muted-foreground">{t.home.manifestoText}</p>
            <Magnetic>
              <Link
                href="/catalog?category=telo"
                className="group grid size-28 shrink-0 place-items-center rounded-full bg-espresso text-center text-[11px] uppercase tracking-[0.18em] text-ivory transition-colors duration-500 hover:bg-terracotta"
              >
                <span className="flex flex-col items-center gap-1.5 px-3">
                  {t.home.manifestoCta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Magnetic>
          </FadeIn>
        </div>
        <div className="relative h-[110vw] md:col-span-5 md:h-[640px]">
          <Parallax offset={40} className="arch absolute right-0 top-0 h-[70%] w-[62%] overflow-hidden">
            <ProductImage src={images[0]} alt="" sizes="30vw" className="h-full w-full" imgClassName="p-[12%]" />
          </Parallax>
          <Parallax offset={90} className="absolute bottom-0 left-0 h-[48%] w-[46%] overflow-hidden">
            <ProductImage src={images[1]} alt="" sizes="25vw" className="h-full w-full bg-clay/40" imgClassName="p-[10%]" />
          </Parallax>
          <Parallax offset={20} className="arch absolute bottom-[12%] right-[8%] h-[34%] w-[30%] overflow-hidden border-4 border-cream">
            <ProductImage src={images[2]} alt="" sizes="15vw" className="h-full w-full" imgClassName="p-[10%]" />
          </Parallax>
        </div>
      </div>
    </section>
  )
}
