import api from '@/utils/axiosInstance'

export const getHolidayDetails = async id => {
  try {
    const res = await api.get(`holidays-list/?id=${id}`)

    if (res?.data?.status === 'success') {
      const resultArray = res?.data?.data?.results
      const data = Array.isArray(resultArray) && resultArray.length ? resultArray[0] : null

      if (!data) {
        return { success: false, message: 'No holiday found with this ID' }
      }

      return { success: true, data }
    }

    return { success: false, message: res?.data?.message || 'Failed to fetch holiday details' }
  } catch (error) {
    console.error('❌ Holiday Details Error:', error.response?.data)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
