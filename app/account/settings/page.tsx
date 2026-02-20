"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCustomerAuth } from "@/store/customer-auth"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, updateProfile, updatePassword, updateEmail } = useCustomerAuth()
  
  // Profile form
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [address, setAddress] = useState(user?.address || "")
  const [city, setCity] = useState(user?.city || "")
  const [country, setCountry] = useState(user?.country || "")
  const [postalCode, setPostalCode] = useState(user?.postal_code || "")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Email form
  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    
    const result = await updateProfile({
      name: name || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      postal_code: postalCode || null,
    })
    
    setIsSavingProfile(false)
    
    if (result.success) {
      toast.success("Profile updated successfully")
    } else {
      toast.error(result.error || "Failed to update profile")
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail.trim()) {
      toast.error("Please enter a new email")
      return
    }
    if (!emailPassword.trim()) {
      toast.error("Please enter your password")
      return
    }
    
    setIsSavingEmail(true)
    const result = await updateEmail(newEmail, emailPassword)
    setIsSavingEmail(false)
    
    if (result.success) {
      toast.success("Email updated. Please check your new email for verification.")
      setNewEmail("")
      setEmailPassword("")
    } else {
      toast.error(result.error || "Failed to update email")
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword.trim()) {
      toast.error("Please enter your current password")
      return
    }
    if (!newPassword.trim()) {
      toast.error("Please enter a new password")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    setIsSavingPassword(true)
    const result = await updatePassword(currentPassword, newPassword)
    setIsSavingPassword(false)
    
    if (result.success) {
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(result.error || "Failed to update password")
    }
  }

  return (
    <div className="space-y-10">
      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: premiumEasing }}
      >
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-6">
          Profile Information
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium tracking-[0.1em] uppercase">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-11 bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-medium tracking-[0.1em] uppercase">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-11 bg-transparent"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs font-medium tracking-[0.1em] uppercase">
              Address
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className="h-11 bg-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs font-medium tracking-[0.1em] uppercase">
                City
              </Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="h-11 bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-xs font-medium tracking-[0.1em] uppercase">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
                className="h-11 bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-xs font-medium tracking-[0.1em] uppercase">
                Country
              </Label>
              <Input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="h-11 bg-transparent"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingProfile}
              className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase"
            >
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.section>

      <Separator />

      {/* Email Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: premiumEasing }}
      >
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-2">
          Email Address
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Current email: {user?.email}
        </p>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail" className="text-xs font-medium tracking-[0.1em] uppercase">
                New Email
              </Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="h-11 bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailPassword" className="text-xs font-medium tracking-[0.1em] uppercase">
                Confirm Password
              </Label>
              <Input
                id="emailPassword"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Your current password"
                className="h-11 bg-transparent"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingEmail}
              variant="outline"
              className="h-11 px-6 text-xs font-medium tracking-[0.15em] uppercase bg-transparent"
            >
              {isSavingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Email"
              )}
            </Button>
          </div>
        </form>
      </motion.section>

      <Separator />

      {/* Password Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ease: premiumEasing }}
      >
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-6">
          Change Password
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-xs font-medium tracking-[0.1em] uppercase">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-11 pr-11 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-medium tracking-[0.1em] uppercase">
                New Password
              </Label>
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-11 bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium tracking-[0.1em] uppercase">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="h-11 bg-transparent"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingPassword}
              variant="outline"
              className="h-11 px-6 text-xs font-medium tracking-[0.15em] uppercase bg-transparent"
            >
              {isSavingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </motion.section>
    </div>
  )
}
