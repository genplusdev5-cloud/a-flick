import api from '@/utils/axiosInstance'

export const getAllEmployees = async (search = '') => {
  let page = 1
  let allResults = []
  let hasNext = true

  while (hasNext) {
    const response = await api.get('employee-list/', {
      params: {
        page_size: 25,
        page,
        search
      }
    })

    const data = response.data.data

    allResults = [...allResults, ...(data?.results || [])]

    hasNext = !!data?.next
    page++
  }

  return allResults
}
