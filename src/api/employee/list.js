import api from '@/utils/axiosInstance'

export const getEmployeeList = async (limit = 25, page = 1, search = '', filters = {}) => {
  const response = await api.get('employee-list/', {
    params: {
      page_size: limit,
      page,
      search,
      ...filters
    }
  })

  return {
    count: response.data.count || 0,
    results: response.data.data?.results || []
  }
}
