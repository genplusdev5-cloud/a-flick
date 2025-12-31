'use client'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Typography } from '@mui/material'

// -------------------------------------------------------------
// 🔥 Global Toast Helper (Unified styling like Action Drawer)
// -------------------------------------------------------------
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

      <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
        {message}
      </Typography>
    </div>,
    {
      type: type === 'delete' ? 'error' : ['success', 'error', 'warning', 'info'].includes(type) ? type : 'default',

      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: 'light',

      // ⭐ Prevent default icon (important!)
      icon: false,

      // ⭐ Custom style
      style: {
        borderRadius: '10px',
        padding: '8px 14px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center'
      }
    }
  )
}


