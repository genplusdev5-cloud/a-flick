'use client'

import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material'

const GlobalDrawer = ({
  open,
  onClose,
  title,
  children,
  width = 380 // 🔥 Same width as your sample drawer
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          p: 4,
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.08)',
          borderRadius: 0
        }
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          {title}
        </Typography>

        <IconButton onClick={onClose}>
          <i className="tabler-x" /> {/* 🔥 Same Vuexy close icon */}
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* BODY CONTENT */}
      <Box sx={{ overflowY: 'auto' }}>
        {children}
      </Box>
    </Drawer>
  )
}

export default GlobalDrawer
