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
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json'
      },
      transformRequest: [data => JSON.stringify(data)]
    })

    return {
      status: 'success',
      file: res.data
    }
  } catch (error) {
    console.error('Service Summary Error:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'Service summary generation failed'
    }
  }
}
