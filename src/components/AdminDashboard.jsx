import React, { useState } from "react";
import { LayoutDashboard, Package, ShoppingBag, Users, Plus, Edit3, Trash2, Check, X, TrendingUp } from "lucide-react";
import { categories } from "../data/products.js";
import { getAllOrders, auth } from "../data/storage.js";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;
const COLORS = ["violet", "cyan", "pink", "orange"];

const emptyProduct = () => ({
  id: Date.now(),
  name: "",
  type: "Laptops",
  price: 0,
  oldPrice: 0,
  rating: 4.5,
  reviews: 0,
  tag: "New",
  badge: "New arrival",
  image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
  images: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85"
  ],
  color: "violet",
  description: "",
  specs: [],
  stock: 10,
  warranty: "1 Year",
  isNew: true,
});

export function AdminDashboard({ products, onSaveProducts, t, allOrders }) {
  const [tab, setTab] = useState("overview");
  const [editProduct, setEditProduct] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [specsInput, setSpecsInput] = useState("");

  const orders = getAllOrders();
  const users = auth.getAllUsers();
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  const startAdd = () => {
    const ep = emptyProduct();
    setEditProduct(ep);
    setSpecsInput("");
    setIsAdding(true);
  };

  const startEdit = (p) => {
    setEditProduct({ ...p });
    setSpecsInput(p.specs.join(", "));
    setIsAdding(false);
  };

  const cancelEdit = () => { setEditProduct(null); setSpecsInput(""); setIsAdding(false); };

  const saveProduct = () => {
    const updated = { ...editProduct, specs: specsInput.split(",").map((s) => s.trim()).filter(Boolean) };
    if (!updated.name) return;
    if (isAdding) {
      onSaveProducts([...products, updated]);
    } else {
      onSaveProducts(products.map((p) => p.id === updated.id ? updated : p));
    }
    cancelEdit();
  };

  const deleteProduct = (id) => {
    if (window.confirm("Delete this product?")) {
      onSaveProducts(products.filter((p) => p.id !== id));
    }
  };

  const setField = (field, val) => setEditProduct((p) => ({ ...p, [field]: val }));

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "products", label: "Products", icon: Package },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>{t.adminTitle}</h2>
        <div className="admin-tabs">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`admin-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="admin-overview">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <Package size={22} />
              <strong>{products.length}</strong>
              <span>{t.totalProducts}</span>
            </div>
            <div className="admin-stat-card">
              <ShoppingBag size={22} />
              <strong>{orders.length}</strong>
              <span>{t.totalOrders}</span>
            </div>
            <div className="admin-stat-card">
              <Users size={22} />
              <strong>{users.length}</strong>
              <span>{t.totalUsers}</span>
            </div>
            <div className="admin-stat-card accent">
              <TrendingUp size={22} />
              <strong>{money(revenue)}</strong>
              <span>{t.revenue}</span>
            </div>
          </div>

          <div className="admin-recent">
            <h3>Recent Orders</h3>
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="admin-order-row">
                <span className="order-id">#{o.id}</span>
                <span>{o.userName || "Guest"}</span>
                <span style={{ color: "#72e0a7" }}>{money(o.total)}</span>
                <span className="status-tag">{o.status}</span>
              </div>
            ))}
            {orders.length === 0 && <p style={{ color: "#767d94", fontSize: 12 }}>No orders yet.</p>}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="admin-products">
          <div className="admin-toolbar">
            <span>{products.length} products</span>
            <button className="primary-button small-btn" onClick={startAdd}><Plus size={14} /> {t.addProduct}</button>
          </div>

          {editProduct && (
            <div className="product-form-card">
              <h3>{isAdding ? t.addProduct : t.editProduct}</h3>
              <div className="product-form-grid">
                <label>{t.productName}<input value={editProduct.name} onChange={e => setField("name", e.target.value)} placeholder="Product name" /></label>
                <label>{t.productType}
                  <select value={editProduct.type} onChange={e => setField("type", e.target.value)}>
                    {categories.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                  </select>
                </label>
                <label>{t.productPrice}<input type="number" value={editProduct.price} onChange={e => setField("price", Number(e.target.value))} /></label>
                <label>{t.productOldPrice}<input type="number" value={editProduct.oldPrice} onChange={e => setField("oldPrice", Number(e.target.value))} /></label>
                <label>Rating<input type="number" min="1" max="5" step="0.1" value={editProduct.rating} onChange={e => setField("rating", Number(e.target.value))} /></label>
                <label>{t.productStock}<input type="number" value={editProduct.stock} onChange={e => setField("stock", Number(e.target.value))} /></label>
                <label>{t.productWarranty}<input value={editProduct.warranty} onChange={e => setField("warranty", e.target.value)} placeholder="1 Year" /></label>
                <label>Tag<input value={editProduct.tag} onChange={e => setField("tag", e.target.value)} placeholder="AI Pick" /></label>
                <label>Badge<input value={editProduct.badge} onChange={e => setField("badge", e.target.value)} placeholder="Best value" /></label>
                <label>Color
                  <select value={editProduct.color} onChange={e => setField("color", e.target.value)}>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-full">{t.productImage}<input value={editProduct.image} onChange={e => setField("image", e.target.value)} placeholder="https://..." /></label>
                <label className="form-full">{t.productDesc}<textarea rows={2} value={editProduct.description} onChange={e => setField("description", e.target.value)} placeholder="Description" /></label>
                <label className="form-full">{t.productSpecs}<input value={specsInput} onChange={e => setSpecsInput(e.target.value)} placeholder="32GB RAM, 1TB SSD, OLED Display" /></label>
              </div>
              <div className="form-actions">
                <button className="primary-button small-btn" onClick={saveProduct}><Check size={14} /> {t.save}</button>
                <button className="secondary-button small-btn" onClick={cancelEdit}><X size={14} /> {t.cancel}</button>
              </div>
            </div>
          )}

          <div className="admin-product-list">
            {products.map((p) => (
              <div key={p.id} className="admin-product-row">
                <img src={p.image} alt={p.name} loading="lazy" />
                <div className="admin-product-info">
                  <strong>{p.name}</strong>
                  <span>{p.type} • {money(p.price)} • Stock: {p.stock}</span>
                </div>
                <div className="admin-product-actions">
                  <button className="icon-btn" onClick={() => startEdit(p)} aria-label="Edit"><Edit3 size={14} /></button>
                  <button className="icon-btn danger" onClick={() => deleteProduct(p.id)} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="admin-orders">
          <h3>All Orders ({orders.length})</h3>
          {orders.length === 0 && <p style={{ color: "#767d94", fontSize: 12 }}>No orders placed yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="admin-order-card">
              <div className="admin-order-head">
                <span className="order-id">#{o.id}</span>
                <span>{o.userName} ({o.userEmail})</span>
                <span>{new Date(o.date).toLocaleDateString("en-IN")}</span>
                <span style={{ color: "#72e0a7" }}>{money(o.total)}</span>
                <span className="status-tag">{o.status}</span>
              </div>
              <div className="admin-order-items">
                {o.items && o.items.map((item) => (
                  <span key={item.id}>{item.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="admin-users">
          <h3>Users ({users.length})</h3>
          {users.length === 0 && <p style={{ color: "#767d94", fontSize: 12 }}>No registered users yet.</p>}
          {users.map((u) => (
            <div key={u.id} className="admin-user-row">
              <div className="user-avatar-small">{u.name?.[0] || "U"}</div>
              <div>
                <strong>{u.name}</strong>
                <span>{u.email}</span>
              </div>
              <span className={`role-tag ${u.role === "admin" ? "admin-role" : ""}`}>{u.role}</span>
              <span style={{ color: "#767d94", fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

