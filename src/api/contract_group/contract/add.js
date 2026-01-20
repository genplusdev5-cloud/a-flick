import axios from '@/utils/axiosInstance'

// Get dropdown master data
export const getContractDropdowns = () => {
  return axios.get('/contract/')
}

// Create contract
export const createContract = (payload) => {
  return axios.post('/contract-add/', payload)
}
