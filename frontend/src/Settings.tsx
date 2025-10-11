import type { Session } from '@supabase/supabase-js'
import ProfileSettings from './components/ProfileSettings'

interface SettingsProps {
  session: Session
}

export default function Settings({ session }: SettingsProps) {
  return <ProfileSettings user={session.user} />
}
