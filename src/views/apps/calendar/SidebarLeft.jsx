'use client'

import { useEffect, useState } from 'react'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import classnames from 'classnames'
import { loadTechnicians } from '@/api/employee/loadTechnician'

// Fallback colors
const getFallbackColor = name => {
  const colors = [
    '#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8',
    '#4db6ac', '#9575cd', '#4dd0e1', '#f06292', '#7986cb'
  ]
  let index = ((name?.charCodeAt(0) || 0) + (name?.length || 0)) % colors.length
  return colors[index]
}

const SidebarLeft = ({
  mdAbove,
  leftSidebarOpen,
  handleLeftSidebarToggle,
  searchText,
  setSearchText,
  selectedEmployees = [],       // default to [] if not passed
  setSelectedEmployees = () => {}
}) => {
  const [employees, setEmployees] = useState([])

  // Load Technicians
  useEffect(() => {
    ;(async () => {
      try {
        const list = await loadTechnicians()
        const sorted = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setEmployees(sorted)
      } catch (err) {
        console.error('Failed to load technicians', err)
      }
    })()
  }, [])

  const filtered = employees.filter(emp =>
    (emp?.name || '').toLowerCase().includes((searchText || '').toLowerCase())
  )

  // Toggle employee in array safely
  const toggleEmployee = emp => {
    // ensure selectedEmployees is array
    const sel = Array.isArray(selectedEmployees) ? selectedEmployees : []

    const exists = sel.some(e => e.id === emp.id)
    if (exists) {
      setSelectedEmployees(prev => (Array.isArray(prev) ? prev.filter(e => e.id !== emp.id) : []))
    } else {
      setSelectedEmployees(prev => (Array.isArray(prev) ? [...prev, emp] : [emp]))
    }
  }

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
      <div style={{ padding: '16px' }}>
        <CustomTextField
          fullWidth
          size='small'
          placeholder='Search Employee'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Divider sx={{ mb: 3 }} />

      <div className='p-4 is-full'>
        <Typography variant='h5' className='mb-4'>
          Employees
        </Typography>

        <List dense sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {filtered.map(emp => {
            const color = emp?.color_code && emp.color_code.startsWith('#')
              ? emp.color_code
              : getFallbackColor(emp?.name)

            const isSelected = Array.isArray(selectedEmployees) && selectedEmployees.some(e => e.id === emp.id)
            emp.is_technician = true // mark as technician for calendar filtering
            return (
              <ListItemButton
                key={emp.id}
                selected={isSelected}
                onClick={() => toggleEmployee(emp)}
              >
                <Avatar sx={{ bgcolor: color, color: '#fff', width: 36, height: 36 }}>
                  {emp?.name ? emp.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <ListItemText primary={emp?.name || '-'} sx={{ marginLeft: 2 }} />
              </ListItemButton>
            )
          })}
        </List>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
