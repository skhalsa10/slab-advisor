import type { Profile } from '@/types/profile'

interface ProfileSectionProps {
  profile: Profile
  email: string
  memberSince: string
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default function ProfileSection({
  profile,
  email,
  memberSince,
}: ProfileSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border mb-6">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-card-foreground">Profile</h2>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-medium text-orange-800">
              {getInitials(email)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-card-foreground">
              @{profile.username}
            </p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Member since {formatDate(memberSince)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
