// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Styled Box for Dropzone
const DropzoneWrapper = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4), // p: 5 equivalent
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main
  },
  '&.active': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}))

const FileUploaderSingle = ({ onFileSelect }) => {
  // States
  const [files, setFiles] = useState([])

  // Hooks
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
      setFiles(newFiles)
      // Notify parent
      if (onFileSelect && newFiles.length > 0) {
        onFileSelect(newFiles[0])
      }
    }
  })

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => files.forEach(file => URL.revokeObjectURL(file.preview))
  }, [files])

  const file = files[0]

  return (
    <Box>
      <DropzoneWrapper 
        {...getRootProps()} 
        className={isDragActive ? 'active' : ''}
        sx={{ minHeight: 200 }} // Ensure some height
      >
        <input {...getInputProps()} />
        {file ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             {/* Preview Image or File Icon */}
             {file.type.startsWith('image/') ? (
                <img 
                  key={file.name} 
                  alt={file.name} 
                  src={file.preview} 
                  style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain', marginBottom: 16 }} 
                  onLoad={() => { URL.revokeObjectURL(file.preview) }}
                />
             ) : (
                <Typography variant='h6' sx={{ mb: 2 }}>
                  {file.name}
                </Typography>
             )}
            <Typography variant='body2' color='textSecondary'>
              Click or drag to replace
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar variant='rounded' sx={{ width: 48, height: 48, mb: 2, bgcolor: 'action.selected' }}>
              <CloudUploadIcon sx={{ color: 'text.primary' }} />
            </Avatar>
            <Typography variant='h6' sx={{ mb: 1 }}>
              Drop files here or click to upload.
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              Allowed *.jpeg, *.jpg, *.png, *.gif, *.pdf
            </Typography>
          </Box>
        )}
      </DropzoneWrapper>
    </Box>
  )
}

export default FileUploaderSingle
