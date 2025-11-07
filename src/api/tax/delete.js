import api from '@/utils/axiosInstance'

// ✅ Backend expects PATCH method with ?id= query param
export const deleteTax = async (id) => {
  if (!id) throw new Error('Tax ID is missing!')

  const { data } = await api.patch(`tax-delete/?id=${id}`)
  return data
}
