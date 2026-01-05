'use client'

import React, { useEffect, useState } from 'react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { getEmployeeList } from '@/api/employee/list'
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Grid
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'

const MapPageContent = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        // Fetch all employees (limit=100 for now to populate list)
        const res = await getEmployeeList(100, 1, search)
        setEmployees(res.results || [])
      } catch (err) {
        console.error('Failed to load employees', err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchEmployees()
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', gap: 2, p: 2 }}>
      {/* LEFT PANEL: Employee List */}
      <Card sx={{ width: 350, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
            Employees
          </Typography>
          <TextField
            fullWidth
            size='small'
            placeholder='Search employee...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
          {loading ? (
            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Loading...</Typography>
          ) : employees.length === 0 ? (
            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No employees found</Typography>
          ) : (
            employees.map(emp => (
              <ListItem
                key={emp.id}
                button
                selected={selectedId === emp.id}
                onClick={() => setSelectedId(emp.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.light' }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar src={emp.avatar} alt={emp.full_name || emp.name || 'Emp'}>
                    {!emp.avatar && (emp.full_name || emp.name || 'E').charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant='subtitle2' fontWeight={600}>
                      {emp.full_name || emp.name || 'Unknown'}
                    </Typography>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box component='span' sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant='caption' color='text.secondary'>
                        {emp.designation || 'Staff'}
                      </Typography>
                      {/* Status Chip (Mocking status for now as API might not return real-time status) */}
                      <Chip
                        label={emp.status || 'Offline'}
                        size='small'
                        color={emp.status === 'Online' ? 'success' : 'default'}
                        variant='tonal'
                        sx={{ height: 20, fontSize: '0.65rem', alignSelf: 'flex-start' }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Card>

      {/* RIGHT PANEL: Map */}
      <Card sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        <iframe
          src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.800274522733!2d103.819836!3d1.352083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19a9f6a6dbbb%3A0xb6e7a7e7ed1a3c6e!2sSingapore!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin'
          width='100%'
          height='100%'
          style={{ border: 0 }}
          allowFullScreen=''
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
        ></iframe>
      </Card>
    </Box>
  )
}

export default function MapPage() {
  return (
    <PermissionGuard permission='Map'>
      <MapPageContent />
    </PermissionGuard>
  )
}
