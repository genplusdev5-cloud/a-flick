'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      router.replace('/en/login')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-h-screen'>
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}
