import api from '@/utils/axiosInstance'

export const getReportBacklogList = async (params = {}) => {
  const res = await api.get('report-backlog/', {
    params
  })

  const response = res.data || {}

  return {
    results: response.results || [],
    count: response.count || 0,
    next: response.next,
    previous: response.previous
  }
}
