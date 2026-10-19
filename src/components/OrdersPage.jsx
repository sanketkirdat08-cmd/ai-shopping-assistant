import React, { useState } from "react";
import { Package, ChevronRight, ShoppingBag, FileText, Printer, X, Sparkles, CheckCircle2, Truck, Clock, MapPin, Box } from "lucide-react";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

const statusColors = {
  Confirmed: "#72e0a7",
  Processing: "#ffca69",
  Shipped: "#51e4e8",
  Delivered: "#9d7aff",
  Cancelled: "#ff7b7b",
};

export function OrdersPage({ orders, t, onShop }) {
  const [expanded, setExpanded] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <Package size={28} />
        <h3>{t.noOrders}</h3>
        <p>{t.noOrdersDesc}</p>
        <button className="secondary-button" onClick={onShop}>{t.exploreAll}</button>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2 className="page-title">{t.ordersTitle}</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-header" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
              <div className="order-meta">
                <ShoppingBag size={16} />
                <div>
                  <strong>#{order.id}</strong>
                  <span>{new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <div className="order-status" style={{ color: statusColors[order.status] || "#9298ad" }}>
                <span className="status-dot" style={{ background: statusColors[order.status] || "#9298ad" }} />
                {order.status}
              </div>
              <strong className="order-total-tag">{money(order.total)}</strong>
              <ChevronRight size={15} className={`expand-icon ${expanded === order.id ? "expanded" : ""}`} />
            </div>

            {expanded === order.id && (
              <div className="order-detail">
                <div className="order-items-mini">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-mini">
                      <img src={item.image} alt={item.name} loading="lazy" />
                      <span>{item.name}</span>
                      <span>{money(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-detail-meta">
                  <div><strong>Payment:</strong> {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</div>
                  <div><strong>Address:</strong> {order.address.address}, {order.address.city}, {order.address.state} - {order.address.pincode}</div>
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="secondary-button"
                    style={{ padding: "6px 14px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6, color: "var(--cyan)", borderColor: "rgba(6,182,212,0.4)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrackingOrder(order);
                    }}
                  >
                    <Truck size={14} /> {t.trackPackage || "Track Package"}
                  </button>
                  <button
                    className="secondary-button"
                    style={{ padding: "6px 14px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInvoiceOrder(order);
                    }}
                  >
                    <FileText size={14} /> {t.viewInvoice || "View Invoice"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Tax Invoice Modal ── */}
      {invoiceOrder && (
        <div className="modal-backdrop" onClick={() => setInvoiceOrder(null)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-header">
              <div className="invoice-brand">
                <div className="brand-mark"><Sparkles size={17} /></div>
                <div>
                  <h3>NEXA CART</h3>
                  <small>Arvind Gavali College of Engineering • AI Commerce Lab</small>
                </div>
              </div>
              <button className="close-button" onClick={() => setInvoiceOrder(null)} aria-label="Close invoice">
                <X size={16} />
              </button>
            </div>

            <div className="invoice-body">
              <div className="invoice-title-bar">
                <div>
                  <h2>{t.invoiceTitle || "TAX INVOICE"}</h2>
                  <p><strong>{t.orderId || "Order ID"}:</strong> #{invoiceOrder.id}</p>
                  <p><strong>{t.orderDateText || "Date"}:</strong> {new Date(invoiceOrder.date).toLocaleString("en-IN")}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="invoice-status-tag" style={{ background: "rgba(114,224,167,0.15)", color: "#72e0a7", border: "1px solid rgba(114,224,167,0.4)" }}>
                    <CheckCircle2 size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    {invoiceOrder.status}
                  </span>
                  <p style={{ marginTop: 8 }}><strong>{t.paymentMode || "Payment"}:</strong> {invoiceOrder.paymentMethod === "cod" ? (t.cod || "Cash on Delivery") : invoiceOrder.paymentMethod}</p>
                </div>
              </div>

              <div className="invoice-address-box">
                <strong>{t.billTo || "Billed To"}:</strong>
                <p>{invoiceOrder.address.name || "Customer"}</p>
                <p>{invoiceOrder.address.address}, {invoiceOrder.address.city}, {invoiceOrder.address.state} - {invoiceOrder.address.pincode}</p>
                <p>Phone: {invoiceOrder.address.phone}</p>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.name}</strong>
                        <small style={{ display: "block", color: "#8b92aa" }}>{item.type || "Electronics"}</small>
                      </td>
                      <td>1</td>
                      <td style={{ textAlign: "right" }}>{money(item.price)}</td>
                      <td style={{ textAlign: "right" }}>{money(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-summary-box">
                <div className="invoice-summary-row">
                  <span>Subtotal:</span>
                  <strong>{money(invoiceOrder.total)}</strong>
                </div>
                <div className="invoice-summary-row">
                  <span>GST (18% included):</span>
                  <span>{money(Math.round(invoiceOrder.total * 0.18 / 1.18))}</span>
                </div>
                <div className="invoice-summary-row">
                  <span>Delivery Charges:</span>
                  <span style={{ color: "#72e0a7" }}>FREE</span>
                </div>
                <div className="invoice-summary-row grand" style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 4 }}>
                  <strong>Grand Total:</strong>
                  <strong style={{ color: "var(--violet)", fontSize: 16 }}>{money(invoiceOrder.total)}</strong>
                </div>
              </div>

              <div className="invoice-footer">
                <p>Thank you for shopping with Nexa Cart! Developed by Sharvari Pawar.</p>
                <div className="invoice-actions">
                  <button className="primary-button" onClick={() => window.print()}>
                    <Printer size={15} /> {t.printInvoice || "Print Invoice"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Shipment Tracker Modal ── */}
      {trackingOrder && (
        <div className="modal-backdrop" onClick={() => setTrackingOrder(null)}>
          <div className="invoice-modal tracking-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="invoice-header">
              <div className="invoice-brand">
                <div className="brand-mark" style={{ background: "linear-gradient(135deg, #06b6d4, #4f46e5)" }}><Truck size={17} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Live Shipment Tracker</h3>
                  <small style={{ color: "var(--cyan)" }}>BlueDart Express • AWB: NX-{trackingOrder.id.slice(0, 8).toUpperCase()}-IN</small>
                </div>
              </div>
              <button className="close-button" onClick={() => setTrackingOrder(null)} aria-label="Close tracking">
                <X size={16} />
              </button>
            </div>

            <div className="tracking-body" style={{ padding: "20px 24px" }}>
              <div className="tracking-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, border: "1px solid var(--line)", marginBottom: 20 }}>
                <div>
                  <small style={{ color: "#8b92aa", display: "block", fontSize: 11 }}>Status</small>
                  <strong style={{ color: statusColors[trackingOrder.status] || "#72e0a7" }}>● {trackingOrder.status}</strong>
                </div>
                <div>
                  <small style={{ color: "#8b92aa", display: "block", fontSize: 11 }}>Estimated Delivery</small>
                  <strong style={{ color: "var(--text)" }}>In 2-3 Business Days</strong>
                </div>
                <div>
                  <small style={{ color: "#8b92aa", display: "block", fontSize: 11 }}>Destination</small>
                  <strong style={{ color: "var(--text)" }}>{trackingOrder.address.city || "Satara"}, {trackingOrder.address.state || "MH"}</strong>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="tracking-timeline" style={{ padding: "8px 0" }}>
                {[
                  { step: "Order Confirmed", desc: "Order verified & inventory allocated", done: true, icon: CheckCircle2, time: "Day 1, 10:30 AM" },
                  { step: "Quality Packed", desc: "Inspection passed at Nexa Fulfillment Hub", done: true, icon: Box, time: "Day 1, 04:15 PM" },
                  { step: "In Transit", desc: "Dispatched via Express Surface courier", done: trackingOrder.status !== "Confirmed", icon: Truck, time: "Day 2, 08:00 AM", current: trackingOrder.status === "Shipped" || trackingOrder.status === "Processing" },
                  { step: "Out for Delivery", desc: "Courier partner reaching your doorstep", done: trackingOrder.status === "Delivered", icon: MapPin, time: "Pending", current: trackingOrder.status === "Delivered" }
                ].map((st, idx, arr) => (
                  <div key={idx} className={`timeline-item ${st.done ? "done" : ""} ${st.current ? "current" : ""}`} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: idx < arr.length - 1 ? 22 : 0 }}>
                    <div className="timeline-icon-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: st.done ? "#72e0a7" : st.current ? "#51e4e8" : "rgba(255,255,255,0.08)",
                        color: st.done || st.current ? "#0f172a" : "#64748b",
                        display: "grid", placeItems: "center", fontWeight: 700, zIndex: 2
                      }}>
                        <st.icon size={16} />
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: st.done ? "#72e0a7" : "rgba(255,255,255,0.1)", margin: "4px 0", minHeight: 22 }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <strong style={{ fontSize: 13, color: st.done || st.current ? "var(--text)" : "#64748b" }}>{st.step}</strong>
                        <small style={{ color: "#8b92aa", fontSize: 11 }}>{st.time}</small>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b92aa" }}>{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 22, textAlign: "center" }}>
                <button className="primary-button" style={{ width: "100%", justifyContent: "center" }} onClick={() => setTrackingOrder(null)}>
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
