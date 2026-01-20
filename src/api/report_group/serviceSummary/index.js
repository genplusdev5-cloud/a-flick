import api from '@/utils/axiosInstance'

/**
 * GET report-dropdown/ (supports filters)
 */
export const getReportDropdown = async (params = {}) => {
  try {
    const res = await api.get('report-dropdown/', { params })

    return {
      status: res.data?.status,
      message: res.data?.message,
      data: res.data?.data?.data || {}
    }
  } catch (error) {
    console.error('Dropdown API Error:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'Unable to load dropdown data'
    }
  }
}

export const generateServiceSummary = async (payload, customerId) => {
  try {
    const url = `service-summary/${customerId ? `?customer_id=${customerId}` : ''}`

    const res = await api.post(url, payload, {
      responseType: 'blob'
    })

    const contentType = res.headers['content-type']

    if (contentType && contentType.includes('application/json')) {
      const text = await res.data.text()
      const json = JSON.parse(text)
      return {
        status: 'failed',
        message: json.message || 'Invalid response from server'
      }
    }
    return {
      status: 'success',
      file: res.data
    }
  } catch (error) {
    let message = 'Service summary generation failed'

    if (error.response?.data) {
      try {
        const text = await error.response.data.text()
        const json = JSON.parse(text)
        message = json.message || message
      } catch {}
    }

    return {
      status: 'failed',
      message
    }
  }
}
