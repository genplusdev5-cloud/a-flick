// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'

const UpdateContractValueDialog = ({ open, onClose, currentValue, onSave }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setValue(currentValue || '')
    }
  }, [open, currentValue])

  const handleSave = () => {
    onSave(value)
    onClose()
  }

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby='customized-dialog-title'
      open={open}
      closeAfterTransition={false}
      PaperProps={{ sx: { overflow: 'visible', width: 400 } }}
    >
      <DialogTitle
        id='customized-dialog-title'
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant='h5' component='span'>
          Update Contract Value
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <CustomTextField
          fullWidth
          label='Contract Value'
          type='number'
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
        <Button onClick={onClose} variant='tonal' color='secondary'>
          Close
        </Button>
        <Button onClick={handleSave} variant='contained'>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UpdateContractValueDialog
