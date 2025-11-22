import api from '@/utils/axiosInstance'

export const getCustomerList = async (page = 1, pageSize = 25) => {
  const res = await api.get('customer-list/', {
    params: {
      page,
      page_size: pageSize
    }
  })

  return res.data
}
