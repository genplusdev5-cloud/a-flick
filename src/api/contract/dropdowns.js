// src/api/contract/dropdowns.js
import api from '@/utils/axiosInstance'

export const getAllDropdowns = async () => {
  try {
    const company = typeof window !== 'undefined' ? localStorage.getItem('company') : ''
    const branch = typeof window !== 'undefined' ? localStorage.getItem('branch') : ''

    const res = await api.get('/contract/', {
      params: { company, branch, dropdown: true, page_size: 500 }
    })

    const raw = res?.data?.data?.data || res?.data?.data || {}

    const extractNames = field => {
      if (!field) return []
      if (Array.isArray(field)) return field.map(item => item.name || item)
      if (field.name && Array.isArray(field.name)) {
        return field.name.map(item => item.name || item)
      }
      return []
    }

    return {
      companies:
        raw.company?.name?.map(item => ({
          label: item.name,
          value: item.id
        })) || [],

      customers:
        raw.customer?.name?.map(item => ({
          label: item.name?.trim(),
          value: item.id
        })) || [],

      callTypes: extractNames(raw.calltype),
      billingFreq:
        raw.billing_frequency?.name?.map(item => ({
          label: item.name,
          value: item.id
        })) || [],

      serviceFreq: extractNames(raw.service_frequency),
      pests: extractNames(raw.pest),
      chemicals: [],
      employees: []
    }
  } catch (err) {
    console.error('Dropdown API Error:', err.response?.data || err)
    return {
      companies: [],
      customers: [],
      callTypes: [],
      billingFreq: [],
      serviceFreq: [],
      pests: [],
      chemicals: [],
      employees: []
    }
  }
}
