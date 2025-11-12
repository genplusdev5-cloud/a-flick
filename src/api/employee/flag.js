import api from '@/utils/axiosInstance'

// GET employee list based on flags
export const getEmployeeByFlag = async (params) => {
  try {
    // Example: /employee-flag/?is_scheduler=1
    const res = await api.get('/employee-flag/', { params })
    return res.data
  } catch (error) {
    console.error('FLAG API ERROR:', error)
    throw error
  }
}

// Scheduler List
export const getSchedulerList = async () => {
  return await getEmployeeByFlag({ is_scheduler: 1 })
}

// Supervisor List
export const getSupervisorList = async () => {
  return await getEmployeeByFlag({ is_supervisor: 1 })
}
