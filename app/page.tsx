import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/home/hero"
import { FeaturedProducts } from "@/components/home/featured-products"
import { Categories } from "@/components/home/categories"
import { Editorial } from "@/components/home/editorial"
import { Newsletter } from "@/components/home/newsletter"
import { fetchFeaturedProducts, fetchStoreCategories } from "@/app/actions"

export default async function HomePage() {
  // Get featured products from database
  const [featuredProducts, categories] = await Promise.all([
    fetchFeaturedProducts(4),
    fetchStoreCategories(),
  ])

  // Map products to component format
  const mappedProducts = featuredProducts.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    main_image: p.main_image,
    category_id: p.category_id,
    status: p.status,
    featured: p.featured,
    gallery: p.gallery,
    variants: p.variants,
  }))

  // Map categories to component format
  const mappedCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    description: c.description,
  }))

  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedProducts products={mappedProducts} />
        <Categories categories={mappedCategories} />
        <Editorial />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
