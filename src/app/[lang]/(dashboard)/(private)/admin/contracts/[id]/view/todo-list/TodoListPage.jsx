'use client'

import { useState } from 'react'
import { Box, Card, CardHeader, TextField, Typography, Divider } from '@mui/material'
import GlobalButton from '@/components/common/GlobalButton'

export default function TodoListPage() {
  const [todo, setTodo] = useState('')

  const handleSave = () => {
    console.log('Saved Todo:', todo)
    alert('Todo Saved!')
    setTodo('')
  }

  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3 }}>
        {/* HEADER */}
        <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
          TO-DO LIST
        </Typography>

        <Divider sx={{ mb: 5 }} />

        {/* FORM BLOCK */}
        <Box sx={{ mt: 4 }}>
          <Typography variant='subtitle1' sx={{ mb: 1 }}>
            Todo Item
          </Typography>

          {/* INPUT */}
          <TextField
            fullWidth
            value={todo}
            onChange={e => setTodo(e.target.value)}
            placeholder='Enter todo item...'
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 50
              }
            }}
          />

          {/* SAVE BUTTON */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <GlobalButton variant='contained' color='primary' onClick={handleSave} sx={{ px: 4 }}>
              Save
            </GlobalButton>
          </Box>
        </Box>
      </Card>
    </Box>
  )
}
