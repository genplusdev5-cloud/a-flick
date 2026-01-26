import api from '@/utils/axiosInstance'

// Duplicate Proposal API
export const duplicateProposal = async payload => {
  try {
    const response = await api.post(`proposal-duplicate/`, payload)

    return response.data
  } catch (error) {
    console.error('Duplicate Proposal Error:', error)
    throw error
  }
}
