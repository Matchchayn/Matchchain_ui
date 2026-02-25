import Swal from 'sweetalert2'

export function useAlert() {
  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#1a1a2e',
      color: '#fff',
      iconColor: type === 'success' ? '#8b5cf6' : type === 'error' ? '#ef4444' : '#3b82f6',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    Toast.fire({
      icon: type,
      title: message
    })
  }

  return { showAlert, alert: null, closeAlert: () => { } }
}
