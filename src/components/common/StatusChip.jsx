'use client'

import Chip from '@mui/material/Chip'
import PropTypes from 'prop-types'

// 🌈 Global Status Colors
const statusColors = {
  Approved: { color: 'success', label: 'Approved' },
  Issued: { color: 'info', label: 'Issued' },
  Completed: { color: 'primary', label: 'Completed' },
  Pending: { color: 'warning', label: 'Pending' },
  Rejected: { color: 'error', label: 'Rejected' },
  Declined: { color: 'error', label: 'Declined' },
  Waiting: { color: 'secondary', label: 'Waiting' },
  Default: { color: 'default', label: 'N/A' }
}

// ✅ Reusable Status Chip
const StatusChip = ({ status, variant = 'filled', size = 'small' }) => {
  const { color, label } = statusColors[status] || statusColors.Default
  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 600,
        borderRadius: '8px',
        textTransform: 'capitalize'
      }}
    />
  )
}

StatusChip.propTypes = {
  status: PropTypes.string,
  variant: PropTypes.oneOf(['filled', 'outlined', 'tonal']),
  size: PropTypes.oneOf(['small', 'medium'])
}

export default StatusChip
