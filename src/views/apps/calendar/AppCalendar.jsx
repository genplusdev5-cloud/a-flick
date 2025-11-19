'use client'

import { useState } from 'react'
import { useMediaQuery } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

const calendarsColor = {
  Personal: 'error',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info',
  lunch: 'info',
  ticket: 'primary'
}

const AppCalendar = () => {
  const [calendarApi, setCalendarApi] = useState(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])

  const dispatch = useDispatch()
  const calendarStore = useSelector(state => state.calendarReducer)
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))

  return (
    <>
      <SidebarLeft
        mdAbove={mdAbove}
        leftSidebarOpen={leftSidebarOpen}
        handleLeftSidebarToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        searchText={searchText}
        setSearchText={setSearchText}
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
      />

      <div className='p-6 pbe-0 flex-grow overflow-visible bg-backgroundPaper rounded'>
        <Calendar
          dispatch={dispatch}
          calendarApi={calendarApi}
          calendarStore={calendarStore}
          setCalendarApi={setCalendarApi}
          calendarsColor={calendarsColor}
          handleLeftSidebarToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
          handleAddEventSidebarToggle={() => setAddEventSidebarOpen(!addEventSidebarOpen)}
          selectedEmployees={selectedEmployees}
        />
      </div>

      <AddEventSidebar
        dispatch={dispatch}
        calendarApi={calendarApi}
        calendarStore={calendarStore}
        addEventSidebarOpen={addEventSidebarOpen}
        handleAddEventSidebarToggle={() => setAddEventSidebarOpen(!addEventSidebarOpen)}
      />
    </>
  )
}

export default AppCalendar
