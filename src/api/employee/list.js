import api from '@/utils/axiosInstance'

export const getEmployeeList = async (limit = 25, page = 1, search = '') => {
  const response = await api.get('employee-list/', {
    params: {
      page_size: limit,   // ✅ backend expects page_size
      page,               // optional if backend uses it
      search
    }
  })

  return {
    count: response.data.count || 0,
    results: response.data.data?.results || []
  }
}
