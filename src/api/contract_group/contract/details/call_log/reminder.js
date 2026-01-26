import api from '@/utils/axiosInstance'

// Call Log Reminder API
const callLogReminder = async (data) => {
  try {
    const response = await api.post('call_log-reminder/', data)

    return response.data
  } catch (error) {
    console.error('Call Log Reminder Error:', error)
    throw error
  }
}

export default callLogReminder
