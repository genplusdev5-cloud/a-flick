import api from '@/utils/axiosInstance'

// Contract Duplicate API
export const duplicateContract = async data => {
  try {
    const response = await api.post('contract-duplicate/', data)

    return response.data
  } catch (error) {
    console.error('Contract Duplicate Error:', error)
    throw error
  }
}
