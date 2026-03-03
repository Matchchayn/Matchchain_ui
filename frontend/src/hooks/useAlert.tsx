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

  const showConfirm = async (title: string, text: string = '', confirmButtonText: string = 'Yes', cancelButtonText: string = 'Cancel') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      background: '#1a1a2e',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#303030',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl border border-purple-500/20'
      }
    }).then((result) => result.isConfirmed)
  }

  return { showAlert, showConfirm, alert: null, closeAlert: () => { } }
}
