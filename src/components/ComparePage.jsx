import React, { useState } from "react";
import { BarChart3, Check, X, Trophy } from "lucide-react";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

function pickAIWinner(products) {
  if (!products.length) return null;
  // Score: rating*40 + (discount%)*30 + (stock>0 ? 30 : 0)
  let best = products[0];
  let bestScore = -1;
  products.forEach((p) => {
    const disc = ((p.oldPrice - p.price) / p.oldPrice) * 100;
    const score = p.rating * 40 + disc * 0.5 + (p.stock > 0 ? 30 : 0);
    if (score > bestScore) { bestScore = score; best = p; }
  });
  return best;
}

export function ComparePage({ compareIds, allProducts, t, onRemove }) {
  const compared = allProducts.filter((p) => compareIds.includes(p.id));
  const winner = compared.length > 1 ? pickAIWinner(compared) : null;

  if (compared.length === 0) {
    return (
      <div className="empty-state compare-empty">
        <BarChart3 size={32} />
        <h3>{t.compareEmpty}</h3>
        <p>{t.compareEmptyDesc}</p>
      </div>
    );
  }

  const rows = [
    { label: t.compareFeatures[0], key: "price", render: (p) => <strong style={{ color: "var(--violet)" }}>{money(p.price)}</strong> },
    { label: t.compareFeatures[1], key: "oldPrice", render: (p) => <del style={{ color: "#62697e" }}>{money(p.oldPrice)}</del> },
    { label: "Discount", key: "disc", render: (p) => <span className="discount">{Math.round((1 - p.price / p.oldPrice) * 100)}% {t.off}</span> },
    { label: t.compareFeatures[2], key: "rating", render: (p) => <span style={{ color: "#ffca69" }}>{"★".repeat(Math.round(p.rating))} {p.rating}</span> },
    { label: t.compareFeatures[3], key: "reviews", render: (p) => `${p.reviews} ${t.reviews}` },
    { label: t.compareFeatures[4], key: "type", render: (p) => p.type },
    { label: t.compareFeatures[5], key: "stock", render: (p) => p.stock > 0 ? <span style={{ color: "#72e0a7" }}>{p.stock} {t.stock}</span> : <span style={{ color: "#ff7b7b" }}>{t.outOfStock}</span> },
    { label: t.compareFeatures[6], key: "warranty", render: (p) => p.warranty },
  ];

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h2>{t.compareTitle}</h2>
        {winner && (
          <div className="ai-winner-banner">
            <Trophy size={16} />
            <strong>{t.aiWinner}:</strong> {winner.name}
            <span>— Best overall value based on price, rating & discount</span>
          </div>
        )}
      </div>

      <div className="compare-grid" style={{ gridTemplateColumns: `180px repeat(${compared.length}, 1fr)` }}>
        {/* Header row */}
        <div className="compare-cell compare-label-head" />
        {compared.map((p) => (
          <div key={p.id} className={`compare-cell compare-product-head ${winner && winner.id === p.id ? "winner-col" : ""}`}>
            {winner && winner.id === p.id && <span className="winner-badge"><Trophy size={11} /> AI Pick</span>}
            <img src={p.image} alt={p.name} loading="lazy" />
            <strong>{p.name}</strong>
            <small>{p.type}</small>
            <button className="remove-compare" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.name}`}><X size={13} /></button>
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <React.Fragment key={row.key}>
            <div className="compare-cell compare-row-label">{row.label}</div>
            {compared.map((p) => (
              <div key={p.id} className={`compare-cell compare-data-cell ${winner && winner.id === p.id ? "winner-col" : ""}`}>
                {row.render(p)}
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* Specs row */}
        <div className="compare-cell compare-row-label">Specs</div>
        {compared.map((p) => (
          <div key={p.id} className={`compare-cell compare-data-cell ${winner && winner.id === p.id ? "winner-col" : ""}`}>
            <div className="compare-specs">
              {p.specs.map((s) => <span key={s}><Check size={11} /> {s}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

