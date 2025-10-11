import { useEffect } from 'react'

interface AlertProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Alert({ message, type = 'info', onClose }: AlertProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const backgroundColor =
    type === 'success' ? '#4caf50' :
    type === 'error' ? '#f44336' :
    '#2196F3'

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        minWidth: '300px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          marginLeft: '16px',
          padding: '0',
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
