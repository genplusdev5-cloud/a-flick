import api from '@/utils/axiosInstance'

export const getAttendanceList = async params => {
  const res = await api.get('attendance-list/', {
    params: {
      page: params.page,
      page_size: params.page_size,
      search: params.search ?? '',
      start_date: params.start_date,
      end_date: params.end_date,
      sort_by: params.sort_by,
      sort_order: params.sort_order
    }
  })

  return res.data
}
