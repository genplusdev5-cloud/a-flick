import api from '@/utils/axiosInstance'

export const getSlotList = async (page = 1, pageSize = 50, search = '') => {
  return api.get('slot-list/', {
    params: {
      page,
      page_size: pageSize,
      search
    }
  })
}
