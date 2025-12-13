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

export const generateServiceSummary = async payload => {
  try {
    const res = await api.post('service-summary/', payload, {
      responseType: 'blob'
    })

    // இந்த check இல்லைன்னா corrupted file தான் வரும்!
    const contentType = res.headers['content-type']

    if (contentType && contentType.includes('application/json')) {
      // Error JSON வந்திருக்கு – அதை text ஆ convert பண்ணி படிக்கணும்
      const text = await res.data.text()
      const json = JSON.parse(text)
      return {
        status: 'failed',
        message: json.message || 'Invalid response from server'
      }
    }

    // இப்போதான் real Excel file
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
