import api from '@/utils/axiosInstance'

export const getReportBacklogList = async (payload = {}) => {
  // payload example: { from_date: "2025-01-01", to_date: "2025-01-31" }
  const formData = new FormData()
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) {
      formData.append(k, v)
    }
  })

  const res = await api.post('report-backlog/', formData) // 🔥 form-data
  const response = res.data || {}

  return {
    status: response.status,
    message: response.message,
    results: response.data?.results || [],
    count: response.data?.count || 0
  }
}
