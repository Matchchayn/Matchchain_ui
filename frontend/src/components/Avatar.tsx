import { useEffect, useState } from 'react'
import { supabase } from '../client'

interface AvatarProps {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}

export default function Avatar({ uid, url, size, onUpload }: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) {
          throw error
        }

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      onUpload(filePath)
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar image"
          style={{ height: size, width: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div
          className="avatar no-image"
          style={{ height: size, width: size, borderRadius: '50%', backgroundColor: '#ccc' }}
        />
      )}
      <div style={{ width: size, marginTop: '10px' }}>
        <label className="button primary block" htmlFor="single" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', padding: '8px', backgroundColor: '#3ecf8e', color: 'white', borderRadius: '4px' }}>
          {uploading ? 'Uploading ...' : 'Upload'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  )
}
