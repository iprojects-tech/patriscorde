import { notFound } from "next/navigation"
import { fetchProductBySlug, fetchStoreProducts, fetchStoreCategories } from "@/app/actions"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductDetail } from "./product-detail"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)
  
  if (!product) {
    notFound()
  }

  // Get related products from same category
  const relatedProducts = product.category_id 
    ? await fetchStoreProducts({ 
        categorySlug: product.category?.slug,
        limit: 5
      })
    : []
  
  const filteredRelated = relatedProducts
    .filter(p => p.id !== product.id)
    .slice(0, 4)

  return (
    <>
      <Header />
      <ProductDetail 
        product={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price,
          main_image: product.main_image,
          gallery: product.gallery,
          category_id: product.category_id,
          category: product.category,
          variants: product.variants,
        }}
        relatedProducts={filteredRelated.map(p => ({
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
        }))}
      />
      <Footer />
    </>
  )
}
