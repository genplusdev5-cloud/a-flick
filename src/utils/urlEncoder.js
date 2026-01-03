/**
 * URL-safe Base64 Encoding/Decoding Utilities
 * Used to encode sensitive IDs in URLs for security
 */

/**
 * Encode a numeric ID to Base64 (URL-safe)
 * @param {number|string} id - The ID to encode
 * @returns {string} Base64 encoded string
 */
export const encodeId = (id) => {
  if (!id) return ''
  
  try {
    // Convert to string and encode to Base64
    const base64 = btoa(String(id))
    
    // Make URL-safe by replacing characters
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    console.error('Error encoding ID:', error)
    return ''
  }
}

/**
 * Decode a Base64 string back to the original ID
 * @param {string} encodedId - The Base64 encoded ID
 * @returns {number|null} Decoded ID or null if invalid
 */
export const decodeId = (encodedId) => {
  if (!encodedId) return null
  
  try {
    // Restore Base64 padding
    let base64 = encodedId.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Decode from Base64
    const decoded = atob(base64)
    
    // Convert to number
    const id = parseInt(decoded, 10)
    
    // Validate it's a valid number
    if (isNaN(id)) {
      console.error('Decoded value is not a valid number:', decoded)
      return null
    }
    
    return id
  } catch (error) {
    console.error('Error decoding ID:', error)
    return null
  }
}

/**
 * Validate if a string is a valid encoded ID
 * @param {string} encodedId - The encoded ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEncodedId = (encodedId) => {
  const decoded = decodeId(encodedId)
  return decoded !== null && decoded > 0
}
