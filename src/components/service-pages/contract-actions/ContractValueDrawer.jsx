'use client'

import Drawer from '@mui/material/Drawer'
import ContractValueDrawerContent from './ContractValueDrawerContent'

export default function ContractValueDrawer({ open, onClose, contractId, initialValue, onValueUpdate }) {
  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <ContractValueDrawerContent
        contractId={contractId}
        initialValue={initialValue}
        onClose={onClose}    // ✅ correct
        onValueUpdate={onValueUpdate}  // <-- replace reload
      />
    </Drawer>
  )
}
