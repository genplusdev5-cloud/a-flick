import api from '@/utils/axiosInstance'

// 📌 Follow-Up Report List API
export const getReportFollowupList = async () => {
  try {
    const res = await api.get('report-followup/')
    return res.data
  } catch (error) {
    console.error('Error fetching followup report:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'API error'
    }
  }
}
