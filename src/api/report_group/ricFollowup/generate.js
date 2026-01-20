import api from '@/utils/axiosInstance'

export const generateRICReport = async payload => {
  try {
    const response = await api.post(`/ric-followup/?customer_id=${payload.customer_id || ''}`, payload, {
      responseType: 'blob'
    })

    return { status: 'success', file: response.data }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}
