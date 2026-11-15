import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="display text-[30vw] leading-none text-terracotta md:text-[16vw]">404</p>
      <p className="display text-2xl">Такой страницы нет</p>
      <p className="max-w-md text-muted-foreground">Возможно, товар сняли с продажи или ссылка устарела. Загляните в каталог — там много ароматов.</p>
      <Link href="/catalog" className="rounded-full border border-espresso px-8 py-3 text-xs uppercase tracking-[0.2em] hover:border-terracotta hover:bg-terracotta hover:text-ivory">
        В каталог
      </Link>
    </main>
  )
}
