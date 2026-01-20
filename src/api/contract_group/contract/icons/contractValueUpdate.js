// src/api/contract/icons/contractValueUpdate.js

import api from '@/utils/axiosInstance'

/**
 * Update Contract Value
 * Endpoint:
 * PUT contract-value-update/?contract_id=1780&contract_level_id=1
 */
export const updateContractValueApi = async ({ contractId, contractLevelId = 1, value }) => {
  if (!contractId) {
    throw new Error('Missing Contract ID')
  }

  const url = `contract-value-update/?contract_id=${contractId}&contract_level_id=${contractLevelId}`

  const payload = {
    contract_value: Number(value) || 0
  }

  const res = await api.put(url, payload)
  return res.data
}
