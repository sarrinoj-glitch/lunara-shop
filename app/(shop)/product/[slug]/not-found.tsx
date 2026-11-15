import { EmptyState } from '@/components/shop/states'
import { t } from '@/lib/i18n'

export default function ProductNotFound() {
  return <EmptyState title={t.product.notFoundTitle} text={t.product.notFoundText} cta={{ label: t.product.toCatalog, href: '/catalog' }} />
}
