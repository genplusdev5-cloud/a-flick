import api from '@/utils/axiosInstance'

export const getCustomerList = async (params = {}) => {
  const res = await api.get('customer-list/', {
    params: {
      page: params.page || 1,
      page_size: params.page_size || 25,
      search: params.search || '',
      company: params.company || '',
      myob_status: params.myob_status || ''
    }
  })

  return res.data
}
