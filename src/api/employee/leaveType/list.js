import api from '@/utils/axiosInstance'

export const getLeaveTypeList = async (page = 1, pageSize = 10, search = '') => {
  const res = await api.get('leavetype-list/', {
    params: {
      page,
      page_size: pageSize,
      search
    }
  })

  return res.data
}
