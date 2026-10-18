// localStorage helpers for persistence

const KEYS = {
  USER: "nexa_user",
  USERS: "nexa_users",
  WISHLIST: "nexa_wishlist",
  CART: "nexa_cart",
  ORDERS: "nexa_orders",
  PRODUCTS: "nexa_products_v4",
  LANG: "nexa_lang",
  CHAT: "nexa_chat",
  THEME: "nexa_theme",
};

export const storage = {
  get: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: (key) => localStorage.removeItem(key),
};

const DEFAULT_USERS = [
  {
    id: 1,
    name: "Sharvari Pawar (Admin)",
    email: "admin@nexa.com",
    password: "admin123",
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Demo Customer",
    email: "user@nexa.com",
    password: "user123",
    role: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

// Helper to get all users with default users pre-seeded
function getStoredUsers() {
  const stored = storage.get(KEYS.USERS) || [];
  let merged = [...stored];
  for (const defU of DEFAULT_USERS) {
    if (!merged.some((u) => u.email.toLowerCase() === defU.email.toLowerCase())) {
      merged.push(defU);
    }
  }
  return merged;
}

// Auth helpers
export const auth = {
  getUser: () => storage.get(KEYS.USER),
  setUser: (user) => storage.set(KEYS.USER, user),
  logout: () => storage.remove(KEYS.USER),
  register: (email, password, name) => {
    const users = getStoredUsers();
    const cleanEmail = (email || "").trim().toLowerCase();
    if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
      return { error: "Email already exists" };
    }
    const user = {
      id: Date.now(),
      email: cleanEmail,
      password,
      name: name || "Customer",
      role: cleanEmail === "admin@nexa.com" ? "admin" : "user",
      createdAt: new Date().toISOString(),
    };
    storage.set(KEYS.USERS, [...users, user]);
    const safeUser = { ...user };
    delete safeUser.password;
    storage.set(KEYS.USER, safeUser);
    return { user: safeUser };
  },
  login: (email, password) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Direct guarantee for demo admin
    if (cleanEmail === "admin@nexa.com" && cleanPass === "admin123") {
      const adminUser = {
        id: 1,
        name: "Sharvari Pawar (Admin)",
        email: "admin@nexa.com",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      storage.set(KEYS.USER, adminUser);
      // Ensure it's in users list too
      const users = getStoredUsers();
      storage.set(KEYS.USERS, users);
      return { user: adminUser };
    }

    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
    );

    if (!user) return { error: "Invalid email or password" };

    const safeUser = { ...user };
    delete safeUser.password;
    storage.set(KEYS.USER, safeUser);
    storage.set(KEYS.USERS, users);
    return { user: safeUser };
  },
  getAllUsers: () => {
    const users = getStoredUsers();
    return users.map((u) => {
      const s = { ...u };
      delete s.password;
      return s;
    });
  },
};

// Per-user data helpers
export const userData = {
  getWishlist: (userId) => storage.get(`${KEYS.WISHLIST}_${userId}`) || [],
  setWishlist: (userId, list) => storage.set(`${KEYS.WISHLIST}_${userId}`, list),
  getCart: (userId) => storage.get(`${KEYS.CART}_${userId}`) || [],
  setCart: (userId, list) => storage.set(`${KEYS.CART}_${userId}`, list),
  getOrders: (userId) => storage.get(`${KEYS.ORDERS}_${userId}`) || [],
  addOrder: (userId, order) => {
    const orders = storage.get(`${KEYS.ORDERS}_${userId}`) || [];
    const updated = [order, ...orders];
    storage.set(`${KEYS.ORDERS}_${userId}`, updated);
    return updated;
  },
  getChat: (userId) => storage.get(`${KEYS.CHAT}_${userId}`) || [],
  setChat: (userId, msgs) => storage.set(`${KEYS.CHAT}_${userId}`, msgs),
};

// Admin product management
export const adminProducts = {
  get: (defaultProducts) => {
    const saved = storage.get(KEYS.PRODUCTS);
    if (!saved || !Array.isArray(saved) || saved.length < defaultProducts.length) {
      storage.set(KEYS.PRODUCTS, defaultProducts);
      return defaultProducts;
    }
    return saved;
  },
  save: (products) => storage.set(KEYS.PRODUCTS, products),
};

// Global settings
export const settings = {
  getLang: () => storage.get(KEYS.LANG) || "en",
  setLang: (lang) => storage.set(KEYS.LANG, lang),
  getTheme: () => storage.get(KEYS.THEME) || "dark-neon",
  setTheme: (theme) => storage.set(KEYS.THEME, theme),
};

// Get all orders across all users (admin)
export const getAllOrders = () => {
  const users = storage.get(KEYS.USERS) || [];
  let all = [];
  users.forEach((u) => {
    const orders = storage.get(`${KEYS.ORDERS}_${u.id}`) || [];
    orders.forEach((o) => all.push({ ...o, userName: u.name, userEmail: u.email }));
  });
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
};

