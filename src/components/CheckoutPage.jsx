import React, { useState } from "react";
import { ShoppingBag, MapPin, CreditCard, Check, Package, ArrowLeft } from "lucide-react";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

export function CheckoutPage({ cartProducts, onOrderPlaced, onBack, t, user }) {
  const [step, setStep] = useState("form"); // form | processing | success
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
  });
  const [errors, setErrors] = useState({});

  const total = cartProducts.reduce((sum, p) => sum + p.price, 0);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.phone.match(/^\d{10}$/)) errs.phone = "Enter valid 10-digit number";
    if (!form.address.trim()) errs.address = "Required";
    if (!form.city.trim()) errs.city = "Required";
    if (!form.pincode.match(/^\d{6}$/)) errs.pincode = "Enter valid 6-digit pincode";
    if (!form.state.trim()) errs.state = "Required";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep("processing");
    setTimeout(() => {
      const order = {
        id: `NX${Date.now()}`,
        items: cartProducts.map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.image })),
        total,
        address: form,
        paymentMethod,
        status: "Confirmed",
        date: new Date().toISOString(),
      };
      onOrderPlaced(order);
      setStep("success");
    }, 1800);
  };

  const setField = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  if (step === "processing") {
    return (
      <div className="checkout-processing">
        <div className="processing-spinner" />
        <h3>{paymentMethod === "cod" ? "Confirming your order..." : "Processing payment..."}</h3>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="checkout-success">
        <div className="success-icon"><Check size={36} /></div>
        <h2>{t.orderSuccess}</h2>
        <p>{t.orderDesc}</p>
        <div className="order-summary-mini">
          <strong>{t.orderTotal}: {money(total)}</strong>
          <span>Payment: {paymentMethod === "cod" ? t.cod : paymentMethod === "razorpay" ? t.razorpay : t.stripe}</span>
        </div>
        <button className="primary-button" onClick={onBack} style={{ marginTop: 28 }}>{t.continueShopping}</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <h2>{t.checkoutTitle}</h2>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <div className="checkout-section">
            <div className="checkout-section-title"><MapPin size={16} /> Delivery Details</div>
            <div className="form-grid">
              {[
                { field: "name", label: t.fullName, type: "text", placeholder: "Sharvari Pawar" },
                { field: "phone", label: t.phone, type: "tel", placeholder: "9876543210" },
                { field: "address", label: t.address, type: "text", placeholder: "Flat/House No, Street, Area", full: true },
                { field: "city", label: t.city, type: "text", placeholder: "Pune" },
                { field: "pincode", label: t.pincode, type: "text", placeholder: "411001" },
                { field: "state", label: t.state, type: "text", placeholder: "Maharashtra" },
              ].map(({ field, label, type, placeholder, full }) => (
                <div key={field} className={`form-field ${full ? "form-full" : ""} ${errors[field] ? "field-error" : ""}`}>
                  <label>{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => setField(field, e.target.value)}
                    placeholder={placeholder}
                    aria-label={label}
                  />
                  {errors[field] && <span className="error-msg">{errors[field]}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section-title"><CreditCard size={16} /> {t.paymentMethod}</div>
            <div className="payment-options">
              {[
                { val: "cod", label: t.cod, icon: "💵" },
                { val: "razorpay", label: t.razorpay, icon: "🔵" },
                { val: "stripe", label: t.stripe, icon: "💳" },
              ].map(({ val, label, icon }) => (
                <label key={val} className={`payment-option ${paymentMethod === val ? "selected" : ""}`}>
                  <input type="radio" name="payment" value={val} checked={paymentMethod === val} onChange={() => setPaymentMethod(val)} />
                  <span className="payment-icon">{icon}</span>
                  <span>{label}</span>
                  {paymentMethod === val && <Check size={14} className="payment-check" />}
                </label>
              ))}
              {paymentMethod !== "cod" && (
                <div className="payment-demo-note">
                  🔒 Demo mode — No actual payment will be charged
                </div>
              )}
            </div>
          </div>

          <button className="primary-button checkout-btn" type="submit">
            <ShoppingBag size={17} /> {t.placeOrder} ({money(total)})
          </button>
        </form>

        <div className="order-sidebar">
          <div className="checkout-section-title"><Package size={16} /> {t.orderSummary}</div>
          <div className="order-items">
            {cartProducts.map((p) => (
              <div key={p.id} className="order-item">
                <img src={p.image} alt={p.name} loading="lazy" />
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.type}</span>
                </div>
                <strong className="item-price">{money(p.price)}</strong>
              </div>
            ))}
          </div>
          <div className="order-total-row">
            <span>Delivery</span><span style={{ color: "#72e0a7" }}>FREE</span>
          </div>
          <div className="order-total-row grand-total">
            <strong>{t.orderTotal}</strong><strong style={{ color: "var(--violet)" }}>{money(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

