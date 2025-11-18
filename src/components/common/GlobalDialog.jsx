'use client'

import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import GlobalButton from '@/components/common/GlobalButton'

const GlobalDialog = ({
  open,
  title,
  children,
  onClose,
  onSave,
  maxWidth = 'md',
  fullWidth = true,
  saveText = 'Save',
  cancelText = 'Close',
  hideActions = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          mt: 8,
          p: 0,
          overflow: 'hidden'
        }
      }}
    >
      {/* TITLE */}
      <DialogTitle
        sx={{
          fontSize: 20,
          fontWeight: 700,
          position: 'relative',
          pb: 1,
          px: 3,
          pt: 3
        }}
      >
        {title}

        {/* CLOSE BUTTON (Vuexy Style) */}
        <IconButton
          onClick={onClose}
          size='small'
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected'
            }
          }}
        >
          <i className='tabler-x' style={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 3
        }}
      >
        {children}
      </DialogContent>

      {/* ACTION BUTTONS */}
      {!hideActions && (
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <GlobalButton variant='tonal' color='secondary' onClick={onClose}>
            {cancelText}
          </GlobalButton>

          <GlobalButton variant='contained' onClick={onSave}>
            {saveText}
          </GlobalButton>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default GlobalDialog
