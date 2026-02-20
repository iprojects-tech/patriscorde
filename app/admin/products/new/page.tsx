"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft, Upload, X, Plus } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { getAdminCategories } from "@/app/actions/admin"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

export default function NewProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getAdminCategories()
      setCategories(cats)
    }
    fetchCategories()
  }, [])
  
  // Form state
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [status, setStatus] = useState("draft")
  
  // Variants
  const [sizes, setSizes] = useState<string[]>([])
  const [newSize, setNewSize] = useState("")
  const [colors, setColors] = useState<Array<{ name: string; value: string }>>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorValue, setNewColorValue] = useState("#000000")

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
    if (!categoryId) {
      toast.error("Please select a category")
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    toast.success("Product created successfully")
    router.push("/admin/products")
  }

  return (
    <div className="max-w-3xl">
      {/* Back Link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Products
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new product to your catalog
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price (EUR)</Label>
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
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {categories.filter((c: any) => c.status === "active").map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
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
          </div>
        </motion.div>

        {/* Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: premiumEasing }}
          className="border border-border bg-background p-6 space-y-6"
        >
          <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
            Media
          </h2>
          
          <div className="border-2 border-dashed border-border p-8 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium">Upload product images</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop or click to browse
            </p>
            <Button variant="outline" className="mt-4 h-9 text-xs bg-transparent">
              Choose Files
            </Button>
          </div>
        </motion.div>

        {/* Variants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: premiumEasing }}
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
            </div>
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Add size (e.g. S, M, L)"
                className="h-9 max-w-[200px]"
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
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name"
                className="h-9 max-w-[150px]"
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-transparent"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-10 bg-foreground text-background hover:bg-foreground/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
