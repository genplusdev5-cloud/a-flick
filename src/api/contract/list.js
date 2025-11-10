import api from '@/utils/axiosInstance'

export const getContractList = async () => {
  const res = await api.get('contract-list/')

  console.log("🔥 RAW CONTRACT LIST → ", res.data)

  // API structure:
  // res.data.data.results = []

  const results = res.data?.data?.results

  if (Array.isArray(results)) {
    return results
  }

  return []
}
