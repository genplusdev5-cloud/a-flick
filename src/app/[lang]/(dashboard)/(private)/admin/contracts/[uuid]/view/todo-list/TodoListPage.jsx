'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import { Box, Card, Typography, Divider, Chip } from '@mui/material'

// Custom Components
import GlobalButton from '@/components/common/GlobalButton'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

// API
import { updateContractTodo } from '@/api/contract/details/todo/Todo'

// Todo Options
const TODO_OPTIONS = [
  { id: 1, label: 'Site Inspection' },
  { id: 2, label: 'Chemical Spray' },
  { id: 3, label: 'Follow-up Visit' },
  { id: 4, label: 'Report Submission' },
  { id: 5, label: 'Client Confirmation' }
]

// (optional) fixed todo example
const fixedOptions = [] // ex: [{ id: 1, label: 'Site Inspection' }]

export default function TodoListPage() {
  const [value, setValue] = useState([...fixedOptions])
  const [loading, setLoading] = useState(false)

  const CONTRACT_ID = 1000

  const handleSave = async () => {
    if (!value.length) {
      alert('Please select at least one todo')
      return
    }

    setLoading(true)

    const payload = {
      contract_id: CONTRACT_ID,
      // backend format: "1,2,3"
      todo_list: value.map(v => v.id).join(',')
    }

    const res = await updateContractTodo(payload)

    setLoading(false)

    if (res.status === 'success') {
      alert(res.message || 'Todo saved successfully')
      setValue([...fixedOptions])
    } else {
      alert(res.message || 'Failed to save todo')
    }
  }

  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3 }}>
        {/* HEADER */}
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
          TO-DO LIST
        </Typography>

        <Divider sx={{ mb: 5 }} />

        {/* AUTOCOMPLETE MULTI SELECT */}
        <CustomAutocomplete
          multiple
          value={value}
          options={TODO_OPTIONS}
          id='todo-multiple-select'
          getOptionLabel={option => option.label || ''}
          disabled={loading}
          onChange={(event, newValue) => {
            setValue([
              ...fixedOptions,
              ...newValue.filter(option => fixedOptions.indexOf(option) === -1)
            ])
          }}
          renderInput={params => (
            <CustomTextField {...params} label='Todo Items' placeholder='Select todo items' />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                label={option.label}
                {...getTagProps({ index })}
                disabled={fixedOptions.indexOf(option) !== -1}
                key={option.id}
                size='small'
              />
            ))
          }
        />

        {/* SAVE BUTTON */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <GlobalButton
            variant='contained'
            color='primary'
            onClick={handleSave}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {loading ? 'Saving...' : 'Save'}
          </GlobalButton>
        </Box>
      </Card>
    </Box>
  )
}
