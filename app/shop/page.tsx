import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Reveal } from "@/components/motion/reveal"
import { fetchStoreProducts, fetchStoreCategories } from "@/app/actions"
import { ShopContent } from "./shop-content"

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    fetchStoreProducts(),
    fetchStoreCategories(),
  ])

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-background border-b border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                The Collection
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight">
                Shop all
              </h1>
            </Reveal>
          </div>
        </section>

        <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading...</div>}>
          <ShopContent initialProducts={products} categories={categories} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
