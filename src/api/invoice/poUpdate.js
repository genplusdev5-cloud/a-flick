// src/api/invoice/poUpdate.js
import api from '@/utils/axiosInstance'

export const updateContractPO = async (contractId, data) => {
  const res = await api.patch(`/contract-po-update/?contract_id=${contractId}`, data)
  return res.data
}
