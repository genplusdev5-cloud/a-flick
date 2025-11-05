'use client'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Typography } from '@mui/material'

// ✅ Common Toast Function
export const showToast = (type, message = '') => {
  const icons = {
    success: 'tabler-circle-check',
    delete: 'tabler-trash',
    error: 'tabler-alert-triangle',
    warning: 'tabler-info-circle',
    info: 'tabler-refresh'
  }

  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    delete: '#dc2626',
    warning: '#f59e0b',
    info: '#2563eb'
  }

  toast(
    <div className='flex items-center gap-2'>
      <i
        className={icons[type] || 'tabler-info-circle'}
        style={{
          color: colors[type] || '#2563eb',
          fontSize: '22px'
        }}
      />
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </div>,
    {
      type:
        type === 'delete'
          ? 'error'
          : ['success', 'error', 'warning', 'info'].includes(type)
          ? type
          : 'default',
      autoClose: 2500,
      pauseOnHover: true,
      draggable: false,
      hideProgressBar: false
    }
  )
}

// ✅ Global Toast Container (to include once globally)
export const GlobalToastContainer = () => (
  <ToastContainer
    position='top-right'
    autoClose={2500}
    newestOnTop
    closeOnClick
    pauseOnHover
    draggable={false}
    theme='light'
  />
)
