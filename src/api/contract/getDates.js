import axios from "@/utils/axiosInstance"

export const getContractDates = async (payload) => {
  return await axios.post("contract-date/", payload)
}
