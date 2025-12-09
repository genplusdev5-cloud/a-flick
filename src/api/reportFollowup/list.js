import api from '@/utils/axiosInstance'

export const getReportFollowupList = async (payload = {}) => {
  try {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })

    const res = await api.post('report-followup/', formData) // 🔥 POST + form-data
    const response = res.data || {}

    return {
      status: response.status,
      message: response.message,
      results: response.data?.results || [],
      count: response.data?.count || 0
    }
  } catch (error) {
    console.error('fetch followup error:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'API error'
    }
  }
}
