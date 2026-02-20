"use client"

import Link from "next/link"
import { Plus, X, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAdminCategories, getAdminProducts } from "@/app/actions/admin"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [cats, prods] = await Promise.all([
        getAdminCategories(),
        getAdminProducts(),
      ])
      setCategories(cats)
      setProducts(prods)
      setIsLoading(false)
    }
    fetchData()
  }, [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setSlug(category.slug)
      setDescription(category.description || "")
      setStatus(category.status)
    } else {
      setEditingCategory(null)
      setName("")
      setSlug("")
      setDescription("")
      setStatus("active")
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setName("")
    setSlug("")
    setDescription("")
    setStatus("active")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!editingCategory) {
      // Auto-generate slug from name
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Please enter a category name")
      return
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug")
      return
    }

    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name, slug, description, status: status as "active" | "draft" | "archived" }
          : c
      ))
      toast.success("Category updated")
    } else {
      // Create new category
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name,
        slug,
        description,
        status: status as "active" | "draft" | "archived",
        image: null,
      }
      setCategories([...categories, newCategory])
      toast.success("Category created")
    }
    
    handleCloseDialog()
  }

  const handleDelete = (categoryId: string) => {
    const productsInCategory = products.filter(p => p.category_id === categoryId)
    if (productsInCategory.length > 0) {
      toast.error(`Cannot delete: ${productsInCategory.length} products in this category`)
      return
    }
    setCategories(categories.filter(c => c.id !== categoryId))
    toast.success("Category deleted")
  }

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {categories.length} categories in catalog
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="h-10 bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const productCount = getProductCount(category.id)
          const imageUrl = typeof category.image === "string"
            ? category.image
            : null

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: premiumEasing }}
              onClick={() => router.push(`/admin/categories/${category.id}`)}
              className="border border-border bg-background overflow-hidden group cursor-pointer hover:border-foreground/30 transition-colors"
            >
              {/* Image or Placeholder */}
              <div className="relative aspect-[16/9] bg-muted">
                {imageUrl ? (
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">{category.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      /{category.slug}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium flex-shrink-0 ${
                      category.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : category.status === "draft"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {category.status}
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  {productCount} product{productCount !== 1 ? "s" : ""}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="border border-dashed border-border p-12 text-center">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm text-muted-foreground mt-4">No categories yet</p>
          <Button 
            onClick={() => handleOpenDialog()}
            variant="outline" 
            className="mt-4 bg-transparent"
          >
            Create your first category
          </Button>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. outerwear"
                className="h-10 font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
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
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
