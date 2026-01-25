'use client'

import React, { useState } from 'react'
import { Grid, Typography, Divider, Button, IconButton, FormControlLabel, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material'
import { showToast } from '@/components/common/Toasts'

const Step4Permissions = ({ form, setField }) => {
    const [previewOpen, setPreviewOpen] = useState(false)
    const [signaturePreview, setSignaturePreview] = useState(null)
    
     const handleFileChange = e => {
        const file = e.target.files[0]
        if (!file) return

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
        if (!validTypes.includes(file.type)) {
            showToast('error', 'Only JPG and PNG files are allowed')
            e.target.value = ''
            return
        }

        if (file.size > 500 * 1024) {
            showToast('error', 'File size must be less than 500KB')
            e.target.value = ''
            return
        }

        setField('signature', file)
        const url = URL.createObjectURL(file)
        setSignaturePreview(url)
    }

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Permissions & Access </Divider>
      </Grid>
      
       <Grid item xs={12}>
            <Grid container spacing={4}>
            {[
                ['isScheduler', 'Scheduler'],
                ['isSupervisorFlag', 'Is Supervisor'],
                ['isForeigner', 'Is Foreigner'],
                ['isGps', 'GPS'],
                ['isPhoto', 'Photo'],
                ['isQr', 'QR'],
                ['isSign', 'Signature'],
                ['isSales', 'Is Sales'],
                ['isTechnician', 'Is Technician']
            ].map(([key, label]) => (
                <Grid item key={key}>
                <FormControlLabel
                    control={<Checkbox checked={form[key]} onChange={e => setField(key, e.target.checked)} />}
                    label={label}
                />
                </Grid>
            ))}
            </Grid>
        </Grid>
        
        <Grid item xs={12}>
             <Typography variant='subtitle2' sx={{ mb: 2 }}>Signature Upload</Typography>
             
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant='outlined' component='label' sx={{ height: 56 }}>
                  {form.signature ? form.signature.name : 'Upload Signature'}
                  <input type='file' hidden onChange={handleFileChange} accept='.jpg,.jpeg,.png' />
                </Button>
                {(form.signature || (form.existingSignature && form.existingSignature !== '')) && (
                  <IconButton
                    color='info'
                    onClick={() => setPreviewOpen(true)}
                    sx={{
                      bgcolor: 'info.lighter',
                      '&:hover': { bgcolor: 'info.light' }
                    }}
                  >
                    <i className='tabler-eye' />
                  </IconButton>
                )}
              </Box>
        </Grid>
        
          {/* Signature Preview Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth='md'>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Signature Preview
            <IconButton onClick={() => setPreviewOpen(false)} size='small'>
                <i className='tabler-x' />
            </IconButton>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', p: 4 }}>
            <img
                src={
                signaturePreview ||
                (form.existingSignature?.startsWith('http')
                    ? form.existingSignature
                    : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/', '')}${form.existingSignature}`)
                }
                alt='Signature'
                style={{ maxWidth: '100%', maxHeight: '70vh', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogActions>
        </Dialog>

    </Grid>
  )
}

export default Step4Permissions
