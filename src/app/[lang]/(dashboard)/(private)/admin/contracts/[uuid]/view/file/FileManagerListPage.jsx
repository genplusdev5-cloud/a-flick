'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Drawer,
  Grid
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { showToast } from '@/components/common/Toasts'

import styles from '@core/styles/table.module.css'

import { listContractFiles, addContractFile, deleteContractFile } from '@/api/contract/details/contract_file'

export default function FileManagerListPage() {
  const params = useParams()
  const contractId = params?.uuid || params?.id

  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const [formData, setFormData] = useState({ name: '', file: null })

  const loadFiles = async () => {
    try {
      const res = await listContractFiles(contractId)
      const data = res?.data?.data?.results || []
      const formatted = data.map(item => ({
        id: item.id,
        displayName: item.file_name_display || item.name || '',
        name: item.name || '',
        fileUrl: item.file_name,
        createdOn: item.created_on
      }))
      setRows(formatted)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load files')
    }
  }

  useEffect(() => {
    if (contractId) loadFiles()
  }, [contractId])

  const handleFileSelect = e => {
    const f = e.target.files?.[0]
    if (!f) return
    setSelectedFile(f.name)
    setFormData(prev => ({ ...prev, file: f }))
  }

  const handleUpload = async () => {
    if (!formData.name || !formData.file) {
      showToast('warning', 'Please fill required fields')
      return
    }
    const fd = new FormData()
    fd.append('contract_id', contractId)
    fd.append('name', formData.name)
    fd.append('file', formData.file)
    try {
      await addContractFile(fd)
      showToast('success', 'File uploaded successfully')
      setDrawerOpen(false)
      setFormData({ name: '', file: null })
      setSelectedFile(null)
      await loadFiles()
    } catch (err) {
      console.error(err)
      showToast('error', 'Upload failed')
    }
  }

  const handleDownload = row => {
    if (row.fileUrl) {
      window.open(row.fileUrl, '_blank')
      return
    }
    showToast('error', 'No file URL')
  }

  const handleDelete = async id => {
    if (!confirm('Delete this file?')) return
    try {
      await deleteContractFile(id)
      showToast('success', 'File deleted')
      await loadFiles()
    } catch (err) {
      console.error(err)
      showToast('error', 'Delete failed')
    }
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))
  const paginated = filtered.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  return (
    <Box className='mt-2'>
      <Card
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h5' fontWeight={600}>File Manager</Typography>
              <GlobalButton variant='contained' color='primary' startIcon={<RefreshIcon />} onClick={loadFiles}>Refresh</GlobalButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>Export</GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>Upload File</GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 100].map(size => (<MenuItem key={size} value={size}>{size} entries</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              size='small'
              placeholder='Search file name...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon /></InputAdornment>) }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                <tr>{['#', 'Action', 'File Name', 'Last Updated'].map(h => (<th key={h}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {paginated.length ? (
                  paginated.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{pagination.pageIndex * pagination.pageSize + idx + 1}</td>
                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size='small' color='info'><VisibilityIcon /></IconButton>
                          <IconButton size='small' color='primary' onClick={() => handleDownload(row)}><DownloadIcon /></IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                        </Box>
                      </td>
                      <td>{row.displayName}</td>
                      <td>{row.createdOn}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className='text-center py-4'>No results found</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent totalCount={filtered.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 420, p: 4 } }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6'>Upload File</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12}><GlobalTextField label='Name' value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} /></Grid>
          <Grid item xs={12}>
            <Box
              sx={{ border: '1px dashed #ccc', borderRadius: '8px', p: 3, textAlign: 'center', bgcolor: '#fafafa', '&:hover': { borderColor: 'primary.main' } }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) { setSelectedFile(file.name); setFormData(prev => ({ ...prev, file })) }
              }}
            >
              <UploadFileIcon sx={{ fontSize: 45, color: 'primary.main', mb: 1 }} />
              <Typography sx={{ fontWeight: 600, color: '#5e5873', mb: 1 }}>Drag & Drop your file here</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#6e6b7b', mb: 2 }}>or</Typography>
              <GlobalButton variant='contained' onClick={() => fileInputRef.current?.click()} sx={{ textTransform: 'none' }}>Browse</GlobalButton>
              {selectedFile && (<Typography sx={{ mt: 2, fontSize: '0.85rem', color: 'primary.main' }}>{selectedFile}</Typography>)}
            </Box>
            <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
          </Grid>
        </Grid>
        <Box mt={4} display='flex' gap={2}>
          <GlobalButton fullWidth onClick={handleUpload}>Upload</GlobalButton>
          <GlobalButton fullWidth variant='outlined' color='secondary' onClick={() => setDrawerOpen(false)}>Cancel</GlobalButton>
        </Box>
      </Drawer>
    </Box>
  )
}
