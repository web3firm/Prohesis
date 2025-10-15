// Lightweight shim for @react-native-async-storage/async-storage used in some SDKs
// For browser usage we implement a simple in-memory/localStorage-backed API
const isLocalStorageAvailable = (() => {
  try {
    return typeof localStorage !== 'undefined'
  } catch (e) {
    return false
  }
})();

const AsyncStorage = {
  async getItem(key) {
    if (isLocalStorageAvailable) return localStorage.getItem(key)
    return null
  },
  async setItem(key, value) {
    if (isLocalStorageAvailable) return localStorage.setItem(key, value)
  },
  async removeItem(key) {
    if (isLocalStorageAvailable) return localStorage.removeItem(key)
  },
};

export default AsyncStorage;
