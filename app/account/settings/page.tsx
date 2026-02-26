"use client"

import React from "react"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCustomerAuth } from "@/store/customer-auth"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

function extractMxPhone(raw: string | null | undefined) {
  const digits = String(raw || "").replace(/\D/g, "")
  if (digits.startsWith("52")) return digits.slice(2, 12)
  return digits.slice(0, 10)
}

function parseAddressLines(rawAddress: unknown) {
  if (!rawAddress) return { line1: "", line2: "" }

  if (typeof rawAddress === "string") {
    const [line1 = "", line2 = ""] = rawAddress.split(/\r?\n/, 2)
    return { line1, line2 }
  }

  if (typeof rawAddress === "object") {
    const value = rawAddress as Record<string, unknown>
    return {
      line1: String(value.line1 ?? value.address ?? ""),
      line2: String(value.line2 ?? value.apartment ?? ""),
    }
  }

  return { line1: "", line2: "" }
}

interface PostalLocation {
  state: string
  city: string
  neighborhood: string
}

export default function SettingsPage() {
  const { user, updateProfile, updatePassword, updateEmail } = useCustomerAuth()

  const parsedAddress = parseAddressLines(user?.address)

  // Profile form
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(extractMxPhone(user?.phone || ""))
  const [addressLine1, setAddressLine1] = useState(parsedAddress.line1)
  const [addressLine2, setAddressLine2] = useState(parsedAddress.line2)
  const [city, setCity] = useState(user?.city || "")
  const [stateName, setStateName] = useState(user?.state || "")
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "")
  const [postalCode, setPostalCode] = useState(String(user?.postal_code || "").replace(/\D/g, "").slice(0, 5))
  const [locationRecords, setLocationRecords] = useState<PostalLocation[]>([])
  const [isLoadingCities, setIsLoadingCities] = useState(false)
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

  const stateOptions = useMemo(
    () => Array.from(new Set(locationRecords.map((item) => item.state))),
    [locationRecords],
  )

  const cityOptions = useMemo(
    () => Array.from(new Set(locationRecords.filter((item) => item.state === stateName).map((item) => item.city))),
    [locationRecords, stateName],
  )

  const neighborhoodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          locationRecords
            .filter((item) => item.state === stateName && item.city === city)
            .map((item) => item.neighborhood),
        ),
      ),
    [locationRecords, stateName, city],
  )

  useEffect(() => {
    const nextParsedAddress = parseAddressLines(user?.address)
    setName(user?.name || "")
    setPhone(extractMxPhone(user?.phone || ""))
    setAddressLine1(nextParsedAddress.line1)
    setAddressLine2(nextParsedAddress.line2)
    setCity(user?.city || "")
    setStateName(user?.state || "")
    setNeighborhood(user?.neighborhood || "")
    setPostalCode(String(user?.postal_code || "").replace(/\D/g, "").slice(0, 5))
    setLocationRecords([])
  }, [user?.id])

  useEffect(() => {
    const normalizedPostalCode = postalCode.replace(/\D/g, "").slice(0, 5)
    if (!normalizedPostalCode || normalizedPostalCode.length !== 5) {
      setLocationRecords([])
      return
    }

    const controller = new AbortController()
    setIsLoadingCities(true)

    fetch(`/api/location/mx-postal-code?postalCode=${normalizedPostalCode}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return []
        const data = await response.json()
        return Array.isArray(data?.locations) ? data.locations : []
      })
      .then((locations: PostalLocation[]) => {
        setLocationRecords(locations)
      })
      .catch(() => {
        setLocationRecords([])
      })
      .finally(() => {
        setIsLoadingCities(false)
      })

    return () => controller.abort()
  }, [postalCode])

  useEffect(() => {
    if (stateOptions.length === 0) return
    setStateName((previous) => (stateOptions.includes(previous) ? previous : stateOptions[0]))
  }, [stateOptions])

  useEffect(() => {
    if (cityOptions.length === 0) return
    setCity((previous) => (cityOptions.includes(previous) ? previous : cityOptions[0]))
  }, [cityOptions])

  useEffect(() => {
    if (neighborhoodOptions.length === 0) return
    setNeighborhood((previous) => (neighborhoodOptions.includes(previous) ? previous : neighborhoodOptions[0]))
  }, [neighborhoodOptions])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10)
    const cleanPostalCode = postalCode.replace(/\D/g, "").slice(0, 5)
    const fullAddress = [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join("\n")

    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error("El teléfono debe tener 10 dígitos para México")
      return
    }
    if (cleanPostalCode && cleanPostalCode.length !== 5) {
      toast.error("El código postal debe tener 5 dígitos")
      return
    }
    if (cleanPostalCode.length === 5 && stateOptions.length > 0 && !stateName) {
      toast.error("Selecciona un estado")
      return
    }
    if (cleanPostalCode.length === 5 && cityOptions.length > 0 && !city) {
      toast.error("Selecciona una ciudad")
      return
    }
    if (cleanPostalCode.length === 5 && neighborhoodOptions.length > 0 && !neighborhood) {
      toast.error("Selecciona una colonia")
      return
    }

    setIsSavingProfile(true)

    const result = await updateProfile({
      name: name || null,
      phone: cleanPhone ? `+52${cleanPhone}` : null,
      address: fullAddress || null,
      city: city || null,
      state: stateName || null,
      neighborhood: neighborhood || null,
      country: "Mexico",
      postal_code: cleanPostalCode || null,
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
              <div className="flex h-11 overflow-hidden rounded-md border border-input bg-transparent">
                <div className="flex items-center border-r border-input px-3 text-sm text-muted-foreground">
                  +52
                </div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="5512345678"
                  className="h-11 border-0 rounded-none bg-transparent shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs font-medium tracking-[0.1em] uppercase">
              Address Line 1
            </Label>
            <Input
              id="address"
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street and number"
              className="h-11 bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2" className="text-xs font-medium tracking-[0.1em] uppercase">
              Address Line 2
            </Label>
            <Input
              id="addressLine2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, interior, reference (optional)"
              className="h-11 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-xs font-medium tracking-[0.1em] uppercase">
                Postal Code
              </Label>
              <Input
                id="postalCode"
                type="text"
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="52004"
                className="h-11 bg-transparent w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-xs font-medium tracking-[0.1em] uppercase">
                State
              </Label>
              <Select
                value={stateName}
                onValueChange={setStateName}
                disabled={stateOptions.length === 0 || isLoadingCities}
              >
                <SelectTrigger id="state" className="h-11! bg-transparent w-full">
                  <SelectValue
                    placeholder={isLoadingCities ? "Loading states..." : "Select a state"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs font-medium tracking-[0.1em] uppercase">
                City
              </Label>
              <Select
                value={city}
                onValueChange={setCity}
                disabled={cityOptions.length === 0 || isLoadingCities}
              >
                <SelectTrigger id="city" className="!h-11 bg-transparent w-full">
                  <SelectValue
                    placeholder={isLoadingCities ? "Loading cities..." : "Select a city"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {cityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-xs font-medium tracking-[0.1em] uppercase">
                Neighborhood
              </Label>
              <Select
                value={neighborhood}
                onValueChange={setNeighborhood}
                disabled={neighborhoodOptions.length === 0 || isLoadingCities}
              >
                <SelectTrigger id="neighborhood" className="!h-11 bg-transparent w-full">
                  <SelectValue
                    placeholder={isLoadingCities ? "Loading neighborhoods..." : "Select a neighborhood"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoodOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
