import { useGoogleLogin } from '@react-oauth/google'
import { clearProfileCache } from '../../../utils/userProfileService'
import { useAlert } from '../../../hooks/useAlert'
import { API_BASE_URL } from '../../../config';
import { safeLocalStorageSet } from '../../../utils/storageUtils';

interface GoogleAuthProps {
    onSuccess: () => void
    setIsLoading: (loading: boolean) => void
    onBeforeLogin?: () => boolean
}

export default function GoogleAuth({ onSuccess, setIsLoading, onBeforeLogin }: GoogleAuthProps) {
    const { showAlert } = useAlert()

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoading(true)
                showAlert('Verifying Google account...', 'info')

                const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                })

                const data = await response.json()
                if (!response.ok) throw new Error(data.message || 'Google login failed')

                clearProfileCache()
                safeLocalStorageSet('token', data.token)
                safeLocalStorageSet('user', data.user)

                showAlert('Google login successful', 'success')
                onSuccess()
            } catch (error: any) {
                showAlert(error.message, 'error')
            } finally {
                setIsLoading(false)
            }
        },
        onError: () => {
            showAlert('Google Login Failed', 'error')
        },
        // Force account chooser + ensures consistency 
        prompt: 'select_account',
        flow: 'implicit',
    })

    return (
        <button
            type="button"
            onClick={() => {
                if (onBeforeLogin && !onBeforeLogin()) return
                handleGoogleLogin()
            }}
            className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-100 rounded-full border border-gray-300 transition-all active:scale-95 shadow-lg"
            title="Continue with Google"
        >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6 c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
        </button>
    )
}
