import api from '@/utils/axiosInstance'

export const getReportFollowupList = async (params = {}) => {
  const res = await api.get('report-followup/', {
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
