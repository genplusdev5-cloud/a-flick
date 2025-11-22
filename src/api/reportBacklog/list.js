import api from '@/utils/axiosInstance'

export const getReportBacklogList = async () => {
  const res = await api.get('report-backlog/')
  return res.data // { message, status, count, data }
}
