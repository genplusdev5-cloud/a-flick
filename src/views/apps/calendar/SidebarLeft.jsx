'use client'

import { useEffect, useState } from 'react'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import CustomTextField from '@core/components/mui/TextField'

import classnames from 'classnames'
import { selectedEvent } from '@/redux-store/slices/calendar'
import { getAllEmployees } from '@/api/employee/getAllEmployees'

const SidebarLeft = ({
  mdAbove,
  leftSidebarOpen,
  dispatch,
  handleLeftSidebarToggle,
  handleAddEventSidebarToggle,
  searchText,
  setSearchText,
  selectedEmployee,
  setSelectedEmployee
}) => {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const list = await getAllEmployees() // <-- USE THIS
        setEmployees(list)
      } catch (err) {
        console.error('Failed to load employees', err)
      }
    })()
  }, [])

  const filteredEmployees = employees.filter(emp => emp?.name?.toLowerCase().includes((searchText || '').toLowerCase()))

  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant={mdAbove ? 'permanent' : 'temporary'}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        className: classnames('items-start is-[280px] shadow-none rounded', {
          static: mdAbove
        })
      }}
      sx={{ zIndex: 3 }}
    >
      <div style={{ width: '100%', padding: '16px 16px 0 16px' }}>
        <CustomTextField
          fullWidth
          size='small'
          placeholder='Search Employee'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 2
            }
          }}
        />
      </div>

      <Divider sx={{ mb: 3 }} />

      <div className='p-4 is-full'>
        <Typography variant='h5' className='mb-4'>
          Employees
        </Typography>

        <List dense sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {filteredEmployees.map(emp => (
            <ListItemButton
              key={emp.id}
              selected={selectedEmployee?.id === emp.id}
              onClick={() => {
                console.log('EMPLOYEE SELECTED:', emp)
                setSelectedEmployee(emp)
              }}
            >
              <ListItemAvatar>
                <Avatar src='/images/avatars/1.png' alt={emp.name} />
              </ListItemAvatar>

              <ListItemText primary={emp.name} />
            </ListItemButton>
          ))}

          {filteredEmployees.length === 0 && (
            <Typography variant='body2' color='textSecondary'>
              No employees found.
            </Typography>
          )}
        </List>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
