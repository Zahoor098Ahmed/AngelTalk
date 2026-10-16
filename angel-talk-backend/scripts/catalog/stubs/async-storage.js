// In-memory AsyncStorage: the catalog export runs the app's own seeding code as a fresh install.
const store = {};
const AsyncStorage = {
  getItem: async (k) => (k in store ? store[k] : null),
  setItem: async (k, v) => {
    store[k] = v;
  },
  removeItem: async (k) => {
    delete store[k];
  },
  getAllKeys: async () => Object.keys(store),
  multiGet: async (keys) => keys.map((k) => [k, k in store ? store[k] : null]),
  multiSet: async (pairs) => pairs.forEach(([k, v]) => (store[k] = v)),
  multiRemove: async (keys) => keys.forEach((k) => delete store[k]),
  clear: async () => Object.keys(store).forEach((k) => delete store[k]),
};
module.exports = { __esModule: true, default: AsyncStorage, ...AsyncStorage };
