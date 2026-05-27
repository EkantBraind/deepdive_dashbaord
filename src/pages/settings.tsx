import { useState, type FormEvent } from 'react'
import { Loader2, User, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/contexts/auth-context'

export function SettingsPage() {
  const { user, updateUser } = useAuthContext()

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Manage your account settings and preferences
      </p>

      <div className="grid gap-6 max-w-2xl">
        <ProfileCard
          displayName={user?.user_metadata?.display_name || user?.user_metadata?.full_name || ''}
          updateUser={updateUser}
        />
        <PasswordCard updateUser={updateUser} />
      </div>
    </div>
  )
}

function ProfileCard({
  displayName: initialName,
  updateUser,
}: {
  displayName: string
  updateUser: (attributes: { data?: Record<string, unknown> }) => Promise<{ error: Error | null }>
}) {
  const [displayName, setDisplayName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await updateUser({ data: { display_name: displayName } })
    if (error) {
      toast.error('Failed to update display name', { description: error.message })
    } else {
      toast.success('Display name updated')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <User className="size-5" />
          Profile
        </CardTitle>
        <CardDescription>Update your display name</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordCard({
  updateUser,
}: {
  updateUser: (attributes: { password?: string }) => Promise<{ error: Error | null }>
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await updateUser({ password: newPassword })
    if (error) {
      toast.error('Failed to change password', { description: error.message })
    } else {
      toast.success('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Lock className="size-5" />
          Change Password
        </CardTitle>
        <CardDescription>Enter a new password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
