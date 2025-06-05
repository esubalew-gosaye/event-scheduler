"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function ProfileView() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Note: This would require an update profile endpoint in your API
      // For now, we'll just show a success message
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
    })
    setIsEditing(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your account settings and personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>
          </div>

          <div className="flex justify-between">
            {isEditing ? (
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}

            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
