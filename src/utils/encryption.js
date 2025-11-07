export const encryptId = id => {
  try {
    return btoa(String(id))
  } catch (err) {
    console.error('Encryption error:', err)
    return ''
  }
}

export const decryptId = encrypted => {
  try {
    return encrypted ? parseInt(atob(encrypted)) : null
  } catch (err) {
    console.error('Decryption error:', err)
    return null
  }
}
