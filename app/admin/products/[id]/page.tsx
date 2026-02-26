"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, Upload, X, Plus, Trash2, Loader2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { getAdminProductById, updateAdminProduct, deleteAdminProduct, getAdminCategories } from "@/app/actions/admin"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState("draft")
  const [images, setImages] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [mainImage, setMainImage] = useState<string | null>(null)
  
  // Variants
  const [sizes, setSizes] = useState<string[]>([])
  const [newSize, setNewSize] = useState("")
  const [colors, setColors] = useState<Array<{ name: string; value: string }>>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorValue, setNewColorValue] = useState("#000000")

  // Load product data from server actions
  useEffect(() => {
    const fetchProduct = async () => {
      const product = await getAdminProductById(productId)
      if (product) {
        setName(product.name)
        setSku(product.sku)
        setDescription(product.description || "")
        // Price is stored in centavos, display in pesos
        setPrice((product.price / 100).toString())
        setCategoryId(product.category_id || null)
        setCategoryName(product.category?.name || null)
        setStatus(product.status)
        setMainImage(product.main_image || null)
        // Load gallery images, or main_image if no gallery
        const galleryImages = product.gallery?.filter((img: any): img is string => typeof img === "string") || []
        if (galleryImages.length > 0) {
          setImages(galleryImages)
        } else if (typeof product.main_image === "string") {
          setImages([product.main_image])
        }
        setFeatured(product.featured || false)
        setSizes(product.variants?.sizes || [])
        setColors(product.variants?.colors || [])
      } else {
        toast.error("Product not found")
        router.push("/admin/products")
      }
      setIsLoading(false)
    }
    fetchProduct()
  }, [productId, router])

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()])
      setNewSize("")
    }
  }

  const handleRemoveSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size))
  }

  const handleAddColor = () => {
    if (newColorName.trim() && !colors.find((c) => c.name === newColorName.trim())) {
      setColors([...colors, { name: newColorName.trim(), value: newColorValue }])
      setNewColorName("")
      setNewColorValue("#000000")
    }
  }

  const handleRemoveColor = (colorName: string) => {
    setColors(colors.filter((c) => c.name !== colorName))
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSetMainImage = (index: number) => {
    if (index === 0) return
    const newImages = [...images]
    const [moved] = newImages.splice(index, 1)
    newImages.unshift(moved)
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Please enter a product name")
      return
    }
    if (!price || isNaN(Number(price))) {
      toast.error("Please enter a valid price")
      return
    }
    
    setIsSubmitting(true)
    
    // Convert price from pesos to centavos for storage
    const priceInCentavos = Math.round(Number(price) * 100)
    
    const result = await updateAdminProduct(productId, {
      name: name.trim(),
      sku: sku.trim(),
      description: description.trim() || null,
      price: priceInCentavos,
      status,
      category_id: categoryId,
      main_image: images[0] || null,
      gallery: images.length > 1 ? images : null,
      featured,
      variants: sizes.length > 0 || colors.length > 0 ? { sizes, colors } : null,
    })
    
    if (result.error) {
      toast.error("Error updating product: " + result.error)
      setIsSubmitting(false)
      return
    }
    
    toast.success("Product updated successfully")
    router.push("/admin/products")
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    const result = await deleteAdminProduct(productId)
    
    if (result.error) {
      toast.error("Error deleting product: " + result.error)
      setIsDeleting(false)
      return
    }
    
    toast.success("Product deleted")
    router.push("/admin/products")
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
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Products
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Edit Product</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SKU: {sku}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent">
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
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
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Relaxed Cotton Tee"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. ATL-ESS-001"
                    className="h-10 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (MXN)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="h-10 flex items-center">
                    {categoryName ? (
                      <Badge variant="secondary" className="text-sm font-normal">
                        {categoryName}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No category assigned</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Manage categories in the Categories tab
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Variants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-6"
            >
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                Variants
              </h2>
              
              {/* Sizes */}
              <div className="space-y-3">
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(size)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {sizes.length === 0 && (
                    <span className="text-sm text-muted-foreground">No sizes added</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Add size (e.g. S, M, L)"
                    className="h-9 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSize())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSize}
                    className="h-9 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Colors */}
              <div className="space-y-3">
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <span
                      key={color.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-sm"
                    >
                      <span
                        className="w-4 h-4 border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color.name)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {colors.length === 0 && (
                    <span className="text-sm text-muted-foreground">No colors added</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color name"
                    className="h-9 flex-1"
                  />
                  <input
                    type="color"
                    value={newColorValue}
                    onChange={(e) => setNewColorValue(e.target.value)}
                    className="w-9 h-9 border border-border cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddColor}
                    className="h-9 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Status & Visibility */}
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
                <Label htmlFor="status">Product Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 border-border"
                />
                <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                  Featured product
                </Label>
              </div>
            </motion.div>

            {/* Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: premiumEasing }}
              className="border border-border bg-background p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                  Media
                </h2>
                <span className="text-xs text-muted-foreground">
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
              </div>
              
              {images.length > 0 ? (
                <div className="space-y-3">
                  {/* Main Image */}
                  <div className="relative w-full aspect-[3/4] bg-muted group">
                    <Image
                      src={images[0] || "/placeholder.svg"}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-foreground text-background text-[10px] font-medium tracking-wider uppercase">
                      Main
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(0)}
                      className="absolute top-2 right-2 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Gallery Thumbnails */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.slice(1).map((img, index) => (
                        <div key={`${img}-${index}`} className="relative aspect-square bg-muted group cursor-pointer" onClick={() => handleSetMainImage(index + 1)}>
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`${name} ${index + 2}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(index + 1)
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                            <span className="text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Set Main
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add More Button */}
                  <Button variant="outline" className="w-full h-9 text-xs bg-transparent">
                    <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                    Add More Images
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium">Upload images</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    First image will be the main
                  </p>
                  <Button variant="outline" className="mt-4 h-9 text-xs bg-transparent">
                    Choose Files
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
                onClick={() => router.push("/admin/products")}
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
