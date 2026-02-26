"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Trash2,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdminAuth } from "@/store/admin-auth"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

type AdminRole = "admin" | "manager"

interface AdminUser {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  role: AdminRole
  created_at: string
}

const roleConfig: Record<AdminRole, { label: string; icon: React.ElementType; className: string }> = {
  admin: {
    label: "Administrator",
    icon: ShieldAlert,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  manager: {
    label: "Manager",
    icon: ShieldCheck,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
}

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAdminAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formRole, setFormRole] = useState<AdminRole>("manager")
  const [formPassword, setFormPassword] = useState("")

  // Redirect managers - only admins can access this page
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      toast.error("Access denied. Admin role required.")
      router.push("/admin")
    }
  }, [currentUser, router])

  // Fetch users on mount
  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers()
    }
  }, [currentUser])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Failed to load users")
      setUsers(payload?.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormName("")
    setFormEmail("")
    setFormRole("manager")
    setFormPassword("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormPassword("")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)

    try {
      if (editingUser) {
        // Update existing user via API
        const response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            name: formName,
            role: formRole,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        
        toast.success("User updated successfully")
      } else {
        // Create new user via API
        if (!formPassword.trim() || formPassword.length < 6) {
          toast.error("Password must be at least 6 characters")
          setIsSaving(false)
          return
        }

        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            name: formName,
            role: formRole,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)

        toast.success("User created successfully")
      }

      setIsDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save user")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      
      toast.success("User removed from admin access")
      setDeleteUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete user")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin users and permissions
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-10 px-5 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.1em] uppercase"
        >
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-transparent border-border"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-transparent border-border">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, index) => {
            const role = roleConfig[user.role] || roleConfig.manager
            const RoleIcon = role.icon

            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: premiumEasing }}
                onClick={() => openEditDialog(user)}
                className="border border-border bg-background p-5 cursor-pointer hover:border-foreground/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{user.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteUser(user)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" strokeWidth={1.5} />
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] font-medium ${role.className}`}>
                    <RoleIcon className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                    {role.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Added {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-0 gap-0 border-border">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif text-xl">
                {editingUser ? "Edit User" : "Add User"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-[0.1em] uppercase">
                Name
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
                className="h-10 bg-transparent border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-[0.1em] uppercase">
                Email
              </Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={!!editingUser}
                className="h-10 bg-transparent border-border disabled:opacity-60"
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed after creation
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-[0.1em] uppercase">
                Role
              </Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AdminRole)}>
                <SelectTrigger className="h-10 bg-transparent border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label className="text-xs font-medium tracking-[0.1em] uppercase">
                  Password
                </Label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  className="h-10 bg-transparent border-border"
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-border bg-transparent"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-10 bg-foreground text-background hover:bg-foreground/90"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingUser ? (
                  "Save Changes"
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for {deleteUser?.name}? 
              They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && handleDelete(deleteUser)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
