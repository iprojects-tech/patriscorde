"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Upload, X, Trash2, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAdminCategories, getAdminProducts } from "@/app/actions/admin"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")
  const [image, setImage] = useState<string | null>(null)
  
  // Products management
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productCount, setProductCount] = useState(0)

const [allProducts, setAllProducts] = useState<any[]>([])

  // Load category data from server actions
  useEffect(() => {
    const fetchData = async () => {
      const [cats, prods] = await Promise.all([
        getAdminCategories(),
        getAdminProducts(),
      ])
      setAllProducts(prods)
      const category = cats.find((c: any) => c.id === categoryId)
      if (category) {
        setName(category.name)
        setSlug(category.slug)
        setDescription(category.description || "")
        setStatus(category.status || "active")
        setImage(typeof category.image === "string" ? category.image : null)
        setCategoryProducts(prods.filter((p: any) => p.category_id === categoryId))
      } else {
        toast.error("Category not found")
        router.push("/admin/categories")
      }
      setIsLoading(false)
    }
    fetchData()
  }, [categoryId, router])
  
  // Available products to add (not in this category)
  const availableProducts = allProducts.filter(
    p => p.category_id !== categoryId && 
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  )

  const handleAddProduct = (product: Product) => {
    setCategoryProducts(prev => [...prev, { ...product, category_id: categoryId }])
    toast.success(`Added "${product.name}" to category`)
  }

  const handleRemoveProduct = (productId: string) => {
    setCategoryProducts(prev => prev.filter(p => p.id !== productId))
    toast.success("Product removed from category")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug from name
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Please enter a category name")
      return
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug")
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    toast.success("Category updated successfully")
    router.push("/admin/categories")
  }

  const handleDelete = async () => {
    if (categoryProducts.length > 0) {
      toast.error(`Cannot delete: ${categoryProducts.length} products in this category`)
      return
    }
    
    setIsDeleting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    toast.success("Category deleted")
    router.push("/admin/categories")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Categories
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Edit Category</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {categoryProducts.length} product{categoryProducts.length !== 1 ? "s" : ""} in this category
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              disabled={categoryProducts.length > 0}
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                {categoryProducts.length > 0 
                  ? `This category has ${categoryProducts.length} products. Please remove them first.`
                  : `Are you sure you want to delete "${name}"? This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
              {categoryProducts.length === 0 && (
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-6"
            >
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Outerwear"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/collections/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="e.g. outerwear"
                      className="h-10 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={5}
                  className="resize-none"
                />
              </div>
            </motion.div>

            {/* Products Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                  Products in Category ({categoryProducts.length})
                </h2>
                <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                      <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Product to Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        <Input
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="pl-9 h-10"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {availableProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            {productSearchQuery ? "No products found" : "All products are already in this category"}
                          </p>
                        ) : (
                          availableProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-3 border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                handleAddProduct(product)
                                setProductSearchQuery("")
                              }}
                            >
                              {typeof product.main_image === "string" && (
                                <div className="relative w-12 h-12 bg-muted flex-shrink-0">
                                  <Image
                                    src={product.main_image || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {categoryProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No products in this category</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 h-8 text-xs bg-transparent"
                    onClick={() => setIsAddProductDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                    Add First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {categoryProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 p-3 border border-border group"
                      >
                        {typeof product.main_image === "string" && (
                          <div className="relative w-14 h-14 bg-muted flex-shrink-0">
                            <Image
                              src={product.main_image || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/admin/products/${product.id}`}
                            className="text-sm font-medium hover:underline underline-offset-4"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-red-600" strokeWidth={1.5} />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-6"
            >
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                Status
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="status">Category Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-6"
            >
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                Category Image
              </h2>
              
              {image ? (
                <div className="relative w-full aspect-[16/9] bg-muted">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium">Upload image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1600x900px
                  </p>
                  <Button variant="outline" className="mt-4 h-9 text-xs bg-transparent">
                    Choose File
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="h-10 w-full bg-foreground text-background hover:bg-foreground/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full bg-transparent"
                onClick={() => router.push("/admin/categories")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
