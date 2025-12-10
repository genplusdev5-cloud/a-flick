// src/api/service_request/report.js

import api from '@/utils/axiosInstance'

// 👉 Ticket Report List API
export const getTicketReportList = async (params = {}) => {
  const response = await api.get('/ticket-report/', { params })
  return response.data.data // Only data return
}

// 👉 Report Dropdown (Customer-wise Contract Fetch)
export const getReportDropdowns = async (params = {}) => {
  const response = await api.get('/report-dropdown/', { params })
  return response.data // Full response return
}
