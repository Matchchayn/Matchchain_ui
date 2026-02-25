import ProfileSettings from './components/ProfileSettings'

interface SettingsProps {
  session: any
}

export default function Settings({ session }: SettingsProps) {
  return <ProfileSettings user={session.user} />
}
