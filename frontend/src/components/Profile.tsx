import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../client'
import type { User } from '@supabase/supabase-js'
import Avatar from './Avatar'
import Alert from './Alert'
import { useAlert } from '../hooks/useAlert'

interface ProfileProps {
  user: User | null
}

export default function Profile({ user }: ProfileProps) {
  const [, setLoading] = useState(true)
  const [first_name, setFirstName] = useState<string | null>(null)
  const [last_name, setLastName] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [dateofbirth, setDateOfBirth] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [relationshipstatus, setRelationshipStatus] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const { alert, showAlert, closeAlert } = useAlert()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('Profile')
        .select(`first_name, last_name, username, dateofbirth, country, city, gender, relationshipstatus, bio, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setUsername(data.username)
        setDateOfBirth(data.dateofbirth)
        setCountry(data.country)
        setCity(data.city)
        setGender(data.gender)
        setRelationshipStatus(data.relationshipstatus)
        setBio(data.bio)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      showAlert('Error loading user data!', 'error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile(newAvatarUrl?: string) {
    try {
      setLoading(true)

      const { error } = await supabase.from('Profile').upsert({
        id: user?.id as string,
        first_name,
        last_name,
        username,
        dateofbirth,
        country,
        city,
        gender,
        relationshipstatus,
        bio,
        avatar_url: newAvatarUrl !== undefined ? newAvatarUrl : avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      showAlert('Profile updated successfully!', 'success')
    } catch (error) {
      showAlert('Error updating profile!', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-widget" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: 'white' }}>
      <Avatar
        uid={user?.id ?? null}
        url={avatar_url}
        size={150}
        onUpload={(url) => {
          setAvatarUrl(url)
          updateProfile(url)
        }}
      />
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="email" style={{ color: '#333' }}>Email</label>
        <input id="email" type="text" value={user?.email} disabled style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label htmlFor="firstName" style={{ color: '#333' }}>First Name</label>
          <input
            id="firstName"
            type="text"
            value={first_name || ''}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="lastName" style={{ color: '#333' }}>Last Name</label>
          <input
            id="lastName"
            type="text"
            value={last_name || ''}
            onChange={(e) => setLastName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label htmlFor="username" style={{ color: '#333' }}>Username</label>
          <input
            id="username"
            type="text"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="dateofbirth" style={{ color: '#333' }}>Date of Birth</label>
          <input
            id="dateofbirth"
            type="date"
            value={dateofbirth || ''}
            onChange={(e) => setDateOfBirth(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label htmlFor="country" style={{ color: '#333' }}>Country</label>
          <input
            id="country"
            type="text"
            value={country || ''}
            onChange={(e) => setCountry(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="city" style={{ color: '#333' }}>City</label>
          <input
            id="city"
            type="text"
            value={city || ''}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label htmlFor="gender" style={{ color: '#333' }}>Gender</label>
          <select
            id="gender"
            value={gender || ''}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="relationshipstatus" style={{ color: '#333' }}>Relationship Status</label>
          <select
            id="relationshipstatus"
            value={relationshipstatus || ''}
            onChange={(e) => setRelationshipStatus(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select...</option>
            <option value="single">Single</option>
            <option value="in_relationship">In a Relationship</option>
            <option value="married">Married</option>
            <option value="complicated">It's Complicated</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="bio" style={{ color: '#333' }}>Bio</label>
        <textarea
          id="bio"
          value={bio || ''}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px', resize: 'vertical', border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>

      <div>
        <button
          className="button primary block"
          onClick={() => updateProfile()}
          style={{ width: '100%', padding: '10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: 1 }}
        >
          Update Profile
        </button>
      </div>

      {alert && <Alert message={alert.message} type={alert.type} onClose={closeAlert} />}
    </div>
  )
}
