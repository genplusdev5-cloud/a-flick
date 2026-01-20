import api from '@/utils/axiosInstance'

// 🔹 GET FILTER DROPDOWNS
export const getProposalFilters = async () => {
  const res = await api.get('/proposal/')
  return res.data
}
