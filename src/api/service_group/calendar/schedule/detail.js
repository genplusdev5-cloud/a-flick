import api from '@/utils/axiosInstance'

export const getScheduleDetail = async ticket_id => {
  const res = await api.get('schedule-detail/', {
    params: { ticket_id }
  })
  return res.data
}
