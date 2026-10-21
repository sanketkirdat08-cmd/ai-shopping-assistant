import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight, BarChart3, Bell, Bot, Camera, Check, ChevronRight, ChevronLeft,
  ChevronsLeft, ChevronsRight, Heart, LayoutDashboard, Menu, MessageSquare,
  Package, Search, Send, Settings, ShoppingBag, Sparkles,
  Star, UserRound, X, Zap, Shield, ArrowUpDown,
  LogIn, Globe, Trash2, Mic, MicOff, Share2,
  ExternalLink, Sun, Moon, Volume2, VolumeX, Download, MessageCircle, Truck
} from "lucide-react";
import "./styles.css";

import { products as defaultProducts, categories } from "./data/products.js";
import { strings, SUPPORTED_LANGS } from "./data/i18n.js";
import { storage, userData, adminProducts, settings, auth } from "./data/storage.js";
import { LoginPage, SignupPage } from "./components/AuthPages.jsx";
import { ComparePage } from "./components/ComparePage.jsx";
import { CheckoutPage } from "./components/CheckoutPage.jsx";
import { OrdersPage } from "./components/OrdersPage.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { SettingsPage } from "./components/SettingsPage.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

// ─── Format AI message text with bold highlights ─────────────────────────────
function formatAiText(text) {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} style={{ color: "var(--cyan)" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ─── Intelligent Budget Parser (Bilingual: Marathi & English) ────────────────
function parseBudget(text) {
  if (!text) return null;
  const s = text.toLowerCase().replace(/[०-९]/g, (d) => "०१२३४५६७८९".indexOf(d));

  // 1. "k" format e.g. "90k", "50k", "40 k", "₹50k"
  const kMatch = s.match(/(?:under|below|max|upto|within|budget|च्या\s*आत|च्या\s*खाली|पर्यंत|मध्ये)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i) ||
                 s.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = Math.round(parseFloat(kMatch[1]) * 1000);
    if (val >= 500 && val <= 5000000) return val;
  }

  // 2. Marathi word numbers + हजार e.g. "चाळीस हजार", "पन्नास हजार"
  const marathiNumberWords = {
    "एक": 1, "दोन": 2, "तीन": 3, "चार": 4, "पाच": 5, "सहा": 6, "सात": 7, "आठ": 8, "नऊ": 9, "दहा": 10,
    "पंधरा": 15, "वीस": 20, "पंचवीस": 25, "तीस": 30, "पस्तीस": 35, "चाळीस": 40, "पंचेचाळीस": 45, "पन्नास": 50,
    "साठ": 60, "सत्तर": 70, "ऐंशी": 80, "नव्वद": 90, "शंभर": 100
  };
  for (const [w, n] of Object.entries(marathiNumberWords)) {
    if (s.includes(`${w} हजार`) || s.includes(`${w} हजारात`)) {
      return n * 1000;
    }
  }

  // 3. Digits + हजार e.g. "50 हजार"
  const hazarMatch = s.match(/(\d+)\s*(?:हजार|hazar)/i);
  if (hazarMatch) {
    return parseInt(hazarMatch[1], 10) * 1000;
  }

  // 4. Lakh e.g. "1 लाख", "दीड लाख"
  if (s.includes("दीड लाख")) return 150000;
  if (s.includes("सव्वा लाख")) return 125000;
  const lakhMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:लाख|lakh|lac)/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  // 5. Standard currency numbers: "50000", "50,000", "₹40,000", "under 40000", "40000 च्या आत"
  const numMatches = s.match(/(?:under|below|max|upto|within|budget|at most|च्या\s*आत|च्या\s*खाली|पर्यंत|मध्ये|चा)?\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d{4,7})/gi);
  if (numMatches) {
    for (const raw of numMatches) {
      const cleanNum = parseInt(raw.replace(/[^\d]/g, ""), 10);
      if (cleanNum >= 500 && cleanNum <= 5000000) {
        return cleanNum;
      }
    }
  }

  const directMatch = s.match(/(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d{4,7})/i) ||
                      s.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,7})\b/);
  if (directMatch) {
    const val = parseInt(directMatch[1].replace(/,/g, ""), 10);
    if (val >= 500 && val <= 5000000) return val;
  }

  return null;
}

// ─── Intelligent Category Detector (Bilingual) ────────────────────────────────
function detectCategory(text) {
  if (!text) return null;
  const s = text.toLowerCase();
  
  // 1. Audio first (because "headphone" contains "phone" and "हेडफोन" contains "फोन")
  if (s.includes("headphone") || s.includes("earbud") || s.includes("earphone") || s.includes("airpod") || s.includes("audio") || s.includes("speaker") || s.includes("हेडफोन") || s.includes("इअरबड") || s.includes("इअरफोन") || s.includes("स्पीकर") || s.includes("साउंड") || s.includes("गाणी")) {
    return "Audio";
  }
  // 2. Laptops
  if (s.includes("laptop") || s.includes("लॅपटॉप") || s.includes("notebook") || s.includes("computer") || s.includes("कम्प्युटर") || s.includes("संगणक")) {
    return "Laptops";
  }
  // 3. Wearables / Smartwatches
  if (s.includes("watch") || s.includes("smartwatch") || s.includes("wearable") || s.includes("घड्याळ") || s.includes("स्मार्टवॉच") || s.includes("वॉच") || s.includes("फिटनेस")) {
    return "Wearables";
  }
  // 4. Smartphones / Mobiles
  if (s.includes("smartphone") || s.includes("mobile") || s.includes("मोबाईल") || s.includes("स्मार्टफोन") || s.includes("iphone") || s.includes("galaxy") || s.includes("redmi") || s.includes("oneplus") || (s.includes("phone") && !s.includes("headphone") && !s.includes("earphone")) || (s.includes("फोन") && !s.includes("हेडफोन") && !s.includes("इअरफोन"))) {
    return "Smartphones";
  }
  // 5. Cameras
  if (s.includes("camera") || s.includes("कॅमेरा") || s.includes("dslr") || s.includes("lens") || s.includes("लेन्स") || s.includes("photography")) {
    return "Cameras";
  }
  // 6. Gaming
  if (s.includes("game") || s.includes("gaming") || s.includes("गेमिंग") || s.includes("गेम") || s.includes("ps5") || s.includes("xbox") || s.includes("कन्सोल") || s.includes("console")) {
    return "Gaming";
  }
  // 7. Fashion & Clothing
  if (s.includes("fashion") || s.includes("cloth") || s.includes("dress") || s.includes("saree") || s.includes("shirt") || s.includes("suit") || s.includes("jeans") || s.includes("कपडे") || s.includes("शर्ट") || s.includes("साडी") || s.includes("ड्रेस") || s.includes("सूट") || s.includes("कुर्ती") || s.includes("men") || s.includes("women") || s.includes("पुरुष") || s.includes("महिला")) {
    return "Fashion";
  }
  // 8. Shoes
  if (s.includes("shoe") || s.includes("sneaker") || s.includes("boot") || s.includes("footwear") || s.includes("शूज") || s.includes("बूट") || s.includes("चप्पल")) {
    return "Fashion";
  }
  // 9. Home & Kitchen
  if (s.includes("home") || s.includes("kitchen") || s.includes("vacuum") || s.includes("घर") || s.includes("किचन")) {
    return "Home & Kitchen";
  }
  return null;
}

// ─── Extract recommended products mentioned by AI (STRICT BUDGET ENFORCED) ───
function findRecommendedProducts(aiText, userMsg, catalog) {
  const found = [];
  const combinedText = ((userMsg || "") + " " + (aiText || "")).toLowerCase();
  const maxBudget = parseBudget(userMsg) || parseBudget(aiText);
  const detectedCat = detectCategory(userMsg) || detectCategory(aiText);

  // Helper to ensure product does not exceed user's maximum budget
  const fitsBudget = (p) => !maxBudget || p.price <= maxBudget;

  // 1. Check for bold names **Product Name** from AI response
  const boldMatches = aiText.match(/\*\*(.*?)\*\*/g)?.map((m) => m.replace(/\*\*/g, "").trim()) || [];
  for (const bName of boldMatches) {
    if (bName.length < 3) continue;
    const match = catalog.find(
      (p) =>
        (p.name.toLowerCase().includes(bName.toLowerCase()) ||
         bName.toLowerCase().includes(p.name.toLowerCase())) &&
        fitsBudget(p)
    );
    if (match && !found.some((f) => f.id === match.id)) {
      found.push(match);
      if (found.length >= 3) break;
    }
  }

  // 2. Check catalog products mentioned by full name in the text (that fit budget)
  if (found.length < 3) {
    for (const p of catalog) {
      if (found.length >= 3) break;
      if (p.name.length > 5 && combinedText.includes(p.name.toLowerCase()) && fitsBudget(p) && !found.some((f) => f.id === p.id)) {
        found.push(p);
      }
    }
  }

  // 3. Fallback to category products that STRICTLY fit the budget
  if (found.length < 3) {
    let pool = catalog;
    if (detectedCat) {
      const catMatches = pool.filter((p) => p.type === detectedCat);
      if (catMatches.length > 0) pool = catMatches;
    }
    // Filter by budget strictly
    if (maxBudget) {
      const budgetMatches = pool.filter((p) => p.price <= maxBudget);
      if (budgetMatches.length > 0) pool = budgetMatches;
    }

    // Sort pool: products closest to the budget or highest rated
    pool.sort((a, b) => {
      if (maxBudget) {
        const diffA = Math.abs(maxBudget - a.price);
        const diffB = Math.abs(maxBudget - b.price);
        return diffA - diffB || b.rating - a.rating;
      }
      return b.rating - a.rating;
    });

    for (const p of pool) {
      if (found.length >= 3) break;
      if (fitsBudget(p) && !found.some((f) => f.id === p.id)) {
        found.push(p);
      }
    }
  }

  return found.slice(0, 3);
}

// ─── Ultra-Smart Dynamic Local Engine (100% Budget & Category Compliant) ─────
function generateSmartLocalReply(userMessage, candidates, maxBudget, detectedCat, lang) {
  const p1 = candidates[0];
  const p2 = candidates[1];

  if (!p1) {
    if (lang === "mr") {
      return maxBudget
        ? `क्षमस्व! ₹${maxBudget.toLocaleString("en-IN")} च्या आत सध्या या श्रेणीत मॉडेल उपलब्ध नाही. कृपया बजेट थोडे वाढवा किंवा इतर श्रेणी शोधा!`
        : `मी नेक्सा आहे! तुमचे बजेट (उदा. 'लॅपटॉप ₹50,000 च्या आत') आणि हवी असलेली वस्तू सांगा, मी लगेच शोधून देईन!`;
    }
    return maxBudget
      ? `Sorry! We currently don't have models under ₹${maxBudget.toLocaleString("en-IN")} in this category. Consider slightly adjusting your budget or exploring other categories!`
      : `I'm Nexa! Tell me what you're looking for and your budget (e.g. 'laptop under ₹50,000'), and I'll find the best options!`;
  }

  const price1Str = `₹${p1.price.toLocaleString("en-IN")}`;
  const spec1 = p1.specs?.[0] || p1.type;

  if (lang === "mr") {
    if (maxBudget) {
      let reply = `तुमच्या ₹${maxBudget.toLocaleString("en-IN")} च्या बजेटमध्ये **${p1.name}** (${price1Str}) हा ${spec1} सह सर्वोत्तम पर्याय आहे!`;
      if (p2 && p2.price <= maxBudget) {
        reply += ` तसेच **${p2.name}** (₹${p2.price.toLocaleString("en-IN")}) हा दुसरा उत्तम पर्याय उपलब्ध आहे.`;
      }
      return reply;
    }
    let reply = `तुमच्यासाठी **${p1.name}** (${price1Str}) हा ${spec1} सह सर्वोत्तम पर्याय आहे!`;
    if (p2) {
      reply += ` तसेच **${p2.name}** (₹${p2.price.toLocaleString("en-IN")}) देखील पाहू शकता.`;
    }
    return reply;
  } else {
    if (maxBudget) {
      let reply = `Within your budget of ₹${maxBudget.toLocaleString("en-IN")}, I recommend the **${p1.name}** at ${price1Str} featuring ${spec1}!`;
      if (p2 && p2.price <= maxBudget) {
        reply += ` Another great choice is **${p2.name}** at ₹${p2.price.toLocaleString("en-IN")}.`;
      }
      return reply;
    }
    let reply = `I recommend the **${p1.name}** at ${price1Str} featuring ${spec1}!`;
    if (p2) {
      reply += ` You can also check out **${p2.name}** at ₹${p2.price.toLocaleString("en-IN")}.`;
    }
    return reply;
  }
}

// ─── Gemini AI helper (Advanced with memory, strict budget & verified models) ─
async function askGemini(userMessage, products, lang, history = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const maxBudget = parseBudget(userMessage);
  const detectedCat = detectCategory(userMessage);

  // 1. Filter catalog items specifically tailored to user's intent & budget
  let relevant = products;
  if (detectedCat) {
    const catMatches = relevant.filter((p) => p.type === detectedCat);
    if (catMatches.length > 0) relevant = catMatches;
  }
  if (maxBudget) {
    const budgetFiltered = relevant.filter((p) => p.price <= maxBudget);
    if (budgetFiltered.length > 0) {
      relevant = budgetFiltered;
    }
  }

  // Sort by rating and proximity to budget
  relevant.sort((a, b) => {
    if (maxBudget) {
      return Math.abs(maxBudget - a.price) - Math.abs(maxBudget - b.price) || b.rating - a.rating;
    }
    return b.rating - a.rating;
  });

  const sampleProducts = relevant.slice(0, 20);
  const catalogList = sampleProducts.map((p) =>
    `- ${p.name} (Brand: ${p.brand || ""}, Category: ${p.type}, Price: ₹${p.price.toLocaleString("en-IN")}, Rating: ${p.rating}★, Specs: ${p.specs.slice(0, 2).join(", ")})`
  ).join("\n");

  const budgetRule = maxBudget
    ? `STRICT BUDGET CONSTRAINT: The user's maximum budget is ₹${maxBudget.toLocaleString("en-IN")}. You MUST ONLY recommend products from the catalog that cost LESS THAN OR EQUAL TO ₹${maxBudget.toLocaleString("en-IN")}. NEVER recommend any product priced above ₹${maxBudget.toLocaleString("en-IN")}.`
    : `No specific budget was given. Recommend top-rated value-for-money options.`;

  const systemInstruction = `You are Nexa, an elite AI Shopping Assistant developed by Sharvari Pawar (Arvind Gavli College of Engineering - AI Commerce Lab).
Available Verified Store Catalog:
${catalogList}

${budgetRule}

Rules:
1. Always recommend 1 to 2 exact products from the provided catalog above. Write the exact product name in bold like **ProductName** along with its exact price in ₹.
2. If the user asks in Marathi (मराठी) or lang is 'mr', reply in natural, fluent, grammatically correct Marathi. If English, reply in professional English.
3. Be concise (2-3 sentences). Highlight key specifications and why it is the best choice for the user's budget.
4. If the user asks about laptops, phones, headphones, or smartwatches, directly answer with the best matched product from the catalog.`;

  // 2. Try Gemini API with verified model endpoints: gemini-3.5-flash-lite, then gemini-3.5-flash
  if (apiKey) {
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
    for (const model of modelsToTry) {
      try {
        const contents = [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\nUser is now chatting with you.` }]
          },
          {
            role: "model",
            parts: [{ text: lang === "mr" ? "मी नेक्सा आहे, तुमचा AI खरेदी सहाय्यक. मी कशी मदत करू?" : "I am Nexa, your AI shopping assistant. How can I assist you today?" }]
          },
          ...history.slice(-4).map((m) => ({
            role: m.from === "user" ? "user" : "model",
            parts: [{ text: m.text }]
          })),
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && reply.trim()) return reply.trim();
        }
      } catch (err) {
        console.warn(`Gemini API call (${model}) failed, trying next:`, err);
      }
    }
  }

  // 3. Ultra-Smart Local Fallback Engine (Dynamic & 100% Budget-Compliant)
  return generateSmartLocalReply(userMessage, sampleProducts, maxBudget, detectedCat, lang);
}

// ─── Sort helper ───────────────────────────────────────────────────────────────
function sortProducts(products, sortKey) {
  const copy = [...products];
  switch (sortKey) {
    case "priceLow": return copy.sort((a, b) => a.price - b.price);
    case "priceHigh": return copy.sort((a, b) => b.price - a.price);
    case "rating": return copy.sort((a, b) => b.rating - a.rating);
    case "popular": return copy.sort((a, b) => b.reviews - a.reviews);
    case "newArrivals": return copy.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    case "discount": return copy.sort((a, b) => ((b.oldPrice - b.price) / b.oldPrice) - ((a.oldPrice - a.price) / a.oldPrice));
    default: return copy;
  }
}

// ─── ProductCard (Add/Remove from Cart + Buy Now + Top Compare) ────────────────
function ProductCard({ product, liked, inCart, compared, onLike, onCart, onRemoveFromCart, onBuyNow, onCompare, onDetails, t }) {
  return (
    <article className="product-card" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onDetails()} aria-label={product.name}>
      <div 
        className={`product-image image-${product.color}`}
        onClick={onDetails}
        style={{ cursor: "pointer" }}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className={`product-tag tag-${product.color}`}>{product.tag}</span>
        {product.isNew && <span className="new-badge">NEW</span>}
        {product.images && product.images.length > 1 && (
          <span className="gallery-count-badge" title={`${product.images.length} photos available`}>
            <Camera size={11} /> {product.images.length}
          </span>
        )}

        <div className="card-top-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`compare-icon-btn ${compared ? "compared" : ""}`}
            onClick={onCompare}
            title={compared ? t.added : t.compare}
            aria-label={compared ? "Remove from compare" : "Add to compare"}
          >
            <BarChart3 size={15} />
          </button>
          <button
            className={`heart-button ${liked ? "liked" : ""}`}
            onClick={onLike}
            title={liked ? "Wishlisted" : "Add to wishlist"}
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="quick-view" onClick={onDetails} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onDetails()} aria-label="Quick view">
          {t.quickView} <ArrowUpRight size={14} />
        </div>
        {product.stock === 0 && <div className="out-of-stock-overlay">{t.outOfStock}</div>}
      </div>

      <div className="product-info">
        <div className="product-title-row">
          <div onClick={onDetails} style={{ cursor: "pointer" }}>
            <h3>{product.name}</h3>
            <p>
              {product.type} <span>•</span> {product.brand || product.badge}
              {product.gender && product.gender !== "Unisex" && (
                <span className="gender-badge-inline">{product.gender}</span>
              )}
            </p>
          </div>
          <div className="rating"><Star size={13} fill="currentColor" /> {product.rating}</div>
        </div>
        <div className="price-row">
          <strong>{money(product.price)}</strong>
          <del>{money(product.oldPrice)}</del>
          <span className="discount">{Math.round((1 - product.price / product.oldPrice) * 100)}% {t.off}</span>
        </div>

        <div className="product-actions-stacked">
          {inCart ? (
            <button
              className="cart-toggle-btn in-cart"
              onClick={onRemoveFromCart}
              aria-label={t.removeFromCart || "Remove from cart"}
            >
              <Trash2 size={15} /> {t.removeFromCart || "Remove"}
            </button>
          ) : (
            <button
              className={`cart-toggle-btn ${product.stock === 0 ? "disabled" : ""}`}
              onClick={onCart}
              disabled={product.stock === 0}
              aria-label={t.addToCart || "Add to cart"}
            >
              <ShoppingBag size={15} /> {t.addToCart || "Add to cart"}
            </button>
          )}

          <button
            className={`buy-now-btn ${product.stock === 0 ? "disabled" : ""}`}
            onClick={onBuyNow}
            disabled={product.stock === 0}
            aria-label={t.buyNow || "Buy Now"}
          >
            <Zap size={15} /> {t.buyNow || "Buy Now"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [lang, setLang] = useState(settings.getLang);
  const t = strings[lang] || strings.en;

  const [theme, setTheme] = useState(() => settings.getTheme() || "dark-neon");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [notificationsList, setNotificationsList] = useState(() => [
    {
      id: 1,
      title: "🎉 " + (lang === "mr" ? "आजची खास ऑफर!" : lang === "hi" ? "आज का विशेष ऑफर!" : lang === "gu" ? "આજની વિશેષ ઑફર!" : "Flash Sale: 15% OFF!"),
      desc: lang === "mr" ? "Apple, Samsung व Dell उत्पादनांवर 15% अतिरिक्त सूट." : lang === "hi" ? "Apple, Samsung व Dell उत्पादों पर 15% अतिरिक्त छूट।" : lang === "gu" ? "Apple, Samsung અને Dell ઉત્પાદનો પર 15% વધારાની છૂટ." : "Extra 15% off on Apple, Samsung & Dell devices today.",
      time: "10m ago",
      read: false,
      icon: "🔥",
      page: "Dashboard"
    },
    {
      id: 2,
      title: "📦 " + (lang === "mr" ? "ऑर्डर इन ट्रॅन्झिट" : lang === "hi" ? "ऑर्डर रास्ते में है" : lang === "gu" ? "ઓર્ડર ટ્રાન્ઝિટમાં છે" : "Order Dispatched"),
      desc: lang === "mr" ? "ऑर्डर #ORD-8492 BlueDart एक्सप्रेस द्वारे पाठवली आहे." : lang === "hi" ? "ऑर्डर #ORD-8492 BlueDart एक्सप्रेस से रवाना हो गया है।" : lang === "gu" ? "ઓર્ડર #ORD-8492 BlueDart એક્સપ્રેસ દ્વારા રવાના થઈ ગયો છે." : "Order #ORD-8492 dispatched via BlueDart Express.",
      time: "1h ago",
      read: false,
      icon: "🚚",
      page: "Orders"
    },
    {
      id: 3,
      title: "✨ " + (lang === "mr" ? "Nexa AI शिफारस" : lang === "hi" ? "Nexa AI सिफारिश" : lang === "gu" ? "Nexa AI ભલામણ" : "Nexa AI Recommendation"),
      desc: lang === "mr" ? "तुमच्या आवडीनुसार ₹50,000 मधील 5G फोन्सची यादी तयार आहे." : lang === "hi" ? "₹50,000 के अंदर 5G स्मार्टफोन्स की नई सूची उपलब्ध है।" : lang === "gu" ? "₹50,000 માં 5G સ્માર્ટફોનની નવી યાદી ઉપલબ્ધ છે." : "5G camera smartphones under ₹50,000 curated for you.",
      time: "3h ago",
      read: false,
      icon: "🤖",
      page: "AI Assistant"
    },
  ]);

  const [user, setUser] = useState(auth.getUser);
  const [authPage, setAuthPage] = useState(null); // null | "login" | "signup"

  const [products, setProducts] = useState(() => adminProducts.get(defaultProducts));
  const [activePage, setActivePage] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(400000);
  const [sortKey, setSortKey] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);
  const [wishlist, setWishlist] = useState(() => user ? userData.getWishlist(user.id) : []);
  const [cart, setCart] = useState(() => user ? userData.getCart(user.id) : []);
  const [compare, setCompare] = useState([]);
  const [orders, setOrders] = useState(() => user ? userData.getOrders(user.id) : []);
  const [chat, setChat] = useState(() => user ? userData.getChat(user.id) : [{ from: "ai", text: t.aiGreeting }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const chatEndRef = useRef(null);

  // Listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      showToast(lang === "mr" ? "Chrome मेन्यू (⋮) वरून 'Install app' निवडा" : "Use Chrome menu (⋮) -> 'Install app'");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const speakText = (text, idx) => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech audio not supported on this browser");
      return;
    }
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, "").replace(/₹/g, "Rupees ").replace(/[#_*~`]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const shareOnWhatsApp = (product) => {
    const text = `🛍️ *${product.name}*\n💰 Price: ${money(product.price)} (Rating: ${product.rating}★)\n🛒 Discover on Nexa AI Shopping Assistant:\n${window.location.origin}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Reset active image index when product changes
  useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedProduct]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    settings.setTheme(theme);
  }, [theme]);

  // Persist language
  useEffect(() => { settings.setLang(lang); }, [lang]);

  // Close language and notification dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleQuickTheme = () => {
    const nextTheme = theme === "clean-light" ? "dark-neon" : "clean-light";
    setTheme(nextTheme);
    showToast(`Theme: ${nextTheme === "clean-light" ? "Light Mode ☀️" : "Dark Neon 🌙"}`);
  };

  // Sync wishlist/cart/chat to localStorage when user logs in
  useEffect(() => {
    if (user) {
      setWishlist(userData.getWishlist(user.id));
      setCart(userData.getCart(user.id));
      setOrders(userData.getOrders(user.id));
      const savedChat = userData.getChat(user.id);
      setChat(savedChat.length ? savedChat : [{ from: "ai", text: t.aiGreeting }]);
    } else {
      setWishlist([]); setCart([]); setOrders([]);
      setChat([{ from: "ai", text: t.aiGreeting }]);
    }
  }, [user]);

  // Persist wishlist
  useEffect(() => { if (user) userData.setWishlist(user.id, wishlist); }, [wishlist, user]);
  // Persist cart
  useEffect(() => { if (user) userData.setCart(user.id, cart); }, [cart, user]);
  // Persist chat
  useEffect(() => { if (user && chat.length > 1) userData.setChat(user.id, chat); }, [chat, user]);
  // Persist products (admin changes)
  useEffect(() => { adminProducts.save(products); }, [products]);
  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, selectedBrand, selectedGender, inStockOnly, maxPrice, sortKey, activePage]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Dynamically extract top brands for selected category
  const availableBrands = useMemo(() => {
    const pool = selectedCategory === "All"
      ? products
      : products.filter((p) => p.type === selectedCategory);
    const brands = Array.from(new Set(pool.map((p) => p.brand).filter(Boolean)));
    return brands.slice(0, 16);
  }, [products, selectedCategory]);

  // Search autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [query, products]);

  // Full filtered product catalog
  const visibleProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchQuery = `${p.name} ${p.type} ${p.brand || ""} ${p.description}`.toLowerCase().includes(query.toLowerCase());
      const matchPage = activePage === "Wishlist" ? wishlist.includes(p.id) : activePage === "Cart" ? cart.includes(p.id) : true;
      const matchCategory = selectedCategory === "All" || p.type === selectedCategory;
      const matchBrand = selectedBrand === "All" || p.brand === selectedBrand;
      const matchGender =
        selectedGender === "All"
          ? true
          : selectedGender === "Men"
          ? p.gender === "Men"
          : selectedGender === "Women"
          ? (p.gender === "Women" || p.gender === "Girls")
          : selectedGender === "Unisex"
          ? (p.gender === "Unisex" || p.gender === "Kids")
          : true;
      const matchStock = inStockOnly ? p.stock > 0 : true;
      return matchQuery && matchPage && p.price <= maxPrice && matchCategory && matchBrand && matchGender && matchStock;
    });
    return sortProducts(list, sortKey);
  }, [query, selectedCategory, selectedBrand, selectedGender, inStockOnly, maxPrice, activePage, wishlist, cart, sortKey, products]);

  // Paginated slice (24 items per page for silky smooth rendering)
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleProducts, currentPage]);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setCurrentPage(p);
    const catalogElem = document.querySelector(".recommendation-heading");
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Browser Speech-to-Text Voice Search
  const startVoiceSearch = (target = "search") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice recognition not supported in this browser", "info");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === "mr" ? "mr-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);
      showToast(t.listening || "Listening...", "info");
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsListening(false);
        if (transcript) {
          if (target === "chat") {
            setChatInput(transcript);
            sendMessage(null, transcript);
          } else {
            setQuery(transcript);
            showToast(`Voice: "${transcript}"`);
          }
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      setIsListening(false);
      console.warn("Speech recognition start failed", err);
    }
  };

  const toggleWishlist = useCallback((id) => {
    if (!user) { setAuthPage("login"); showToast("Please login to use wishlist", "info"); return; }
    setWishlist((cur) => cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]);
  }, [user]);

  const addToCart = useCallback((product) => {
    if (!user) { setAuthPage("login"); showToast("Please login to add to cart", "info"); return; }
    if (product.stock === 0) { showToast("Product out of stock", "error"); return; }
    setCart((cur) => cur.includes(product.id) ? cur : [...cur, product.id]);
    showToast(`${product.name} added to cart!`);
  }, [user]);

  const removeFromCart = useCallback((id) => {
    const prod = products.find((p) => p.id === id);
    setCart((cur) => cur.filter((i) => i !== id));
    showToast(`${prod ? prod.name : "Product"} removed from cart!`, "info");
  }, [products]);

  const handleBuyNow = useCallback((product) => {
    if (!user) {
      setAuthPage("login");
      showToast("Please login to proceed with purchase", "info");
      return;
    }
    if (product.stock === 0) {
      showToast("Product out of stock", "error");
      return;
    }
    setCart((cur) => cur.includes(product.id) ? cur : [...cur, product.id]);
    setActivePage("Checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user]);

  const toggleCompare = useCallback((id) => setCompare((cur) => cur.includes(id) ? cur.filter((i) => i !== id) : cur.length < 3 ? [...cur, id] : (showToast("Max 3 products in compare", "info"), cur)), []);

  const handleOrderPlaced = useCallback((order) => {
    if (user) {
      const updated = userData.addOrder(user.id, order);
      setOrders(updated);
    }
    setCart([]);
    if (user) userData.setCart(user.id, []);
    showToast("Order placed successfully! 🎉");
  }, [user]);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    setAuthPage(null);
    if (loggedUser.role === "admin") {
      setActivePage("Admin");
      showToast(`Welcome Admin, ${loggedUser.name}! 🛡️`);
    } else {
      setActivePage("Dashboard");
      showToast(`Welcome, ${loggedUser.name}! 🎉`);
    }
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    setActivePage("Dashboard");
    showToast("Logged out successfully", "info");
  };

  const sendMessage = async (e, customText) => {
    if (e && e.preventDefault) e.preventDefault();
    const message = (customText || chatInput).trim();
    if (!message || chatLoading) return;
    const newChat = [...chat, { from: "user", text: message }];
    setChat(newChat);
    setChatInput("");
    setChatLoading(true);
    const aiReply = await askGemini(message, products, lang, newChat);
    const recProducts = findRecommendedProducts(aiReply, message, products);
    const finalChat = [...newChat, { from: "ai", text: aiReply, recommendedProducts: recProducts }];
    setChat(finalChat);
    setChatLoading(false);
  };

  const clearChat = () => {
    const fresh = [{ from: "ai", text: t.aiGreeting }];
    setChat(fresh);
    if (user) userData.setChat(user.id, fresh);
    showToast("Chat reset", "info");
  };

  const handleLangChange = (l) => {
    setLang(l);
    setLangDropdownOpen(false);
    const newStrings = strings[l] || strings.en;
    setChat([{ from: "ai", text: newStrings.aiGreeting }]);
    const langInfo = SUPPORTED_LANGS.find((x) => x.key === l);
    showToast(`Language: ${langInfo ? langInfo.label : l}`);
  };

  const navigation = [
    { label: t.nav.dashboard, key: "Dashboard", icon: LayoutDashboard },
    { label: t.nav.aiAssistant, key: "AI Assistant", icon: MessageSquare },
    { label: t.nav.compare, key: "Compare", icon: BarChart3, count: compare.length || null },
    { label: t.nav.wishlist, key: "Wishlist", icon: Heart, count: wishlist.length || null },
    { label: t.nav.cart, key: "Cart", icon: ShoppingBag, count: cart.length || null },
  ];

  const sortOptions = [
    { key: "default", label: t.sorts.default },
    { key: "priceLow", label: t.sorts.priceLow },
    { key: "priceHigh", label: t.sorts.priceHigh },
    { key: "rating", label: t.sorts.rating },
    { key: "popular", label: t.sorts.popular },
    { key: "newArrivals", label: t.sorts.newArrivals },
    { key: "discount", label: t.sorts.discount },
  ];

  // If showing auth pages
  if (authPage === "login") return <LoginPage onLogin={handleLogin} onGoSignup={() => setAuthPage("signup")} onBack={() => setAuthPage(null)} t={t} />;
  if (authPage === "signup") return <SignupPage onLogin={handleLogin} onGoLogin={() => setAuthPage("login")} onBack={() => setAuthPage(null)} t={t} />;

  // Checkout page
  if (activePage === "Checkout") {
    const cartProducts = products.filter((p) => cart.includes(p.id));
    return <CheckoutPage cartProducts={cartProducts} onOrderPlaced={handleOrderPlaced} onBack={() => setActivePage("Cart")} t={t} user={user} />;
  }

  return (
    <div className="app-shell">
      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Sidebar Backdrop (tap side/outside to close) */}
      {mobileNav && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileNav(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}
        aria-label="Navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <span>{t.appName}</span><b>{t.appSub}</b>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="creator-ribbon">
          <span>{t.createdBy}</span>
          <strong>Sharvari Pawar</strong>
          <small>{t.college}</small>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav role="navigation" aria-label="Main navigation">
          {navigation.map(({ label, key, icon: Icon, count }) => (
            <button
              key={key}
              className={`nav-item ${activePage === key ? "active" : ""}`}
              onClick={() => { setActivePage(key); setMobileNav(false); }}
              aria-current={activePage === key ? "page" : undefined}
            >
              <Icon size={17} /><span>{label}</span>{count ? <em aria-label={`${count} items`}>{count}</em> : null}
            </button>
          ))}
        </nav>
        <p className="nav-caption secondary-caption">SYSTEM</p>
        <nav role="navigation" aria-label="System navigation">
          <button className={`nav-item ${activePage === "Orders" ? "active" : ""}`} onClick={() => { setActivePage("Orders"); setMobileNav(false); }}>
            <Package size={17} /><span>{t.nav.orders}</span>
            {orders.length > 0 && <em>{orders.length}</em>}
          </button>
          {user?.role === "admin" && (
            <button className={`nav-item ${activePage === "Admin" ? "active" : ""}`} onClick={() => { setActivePage("Admin"); setMobileNav(false); }}>
              <Shield size={17} /><span>{t.nav.admin}</span>
            </button>
          )}
          <button className={`nav-item ${activePage === "Settings" ? "active" : ""}`} onClick={() => { setActivePage("Settings"); setMobileNav(false); }}>
            <Settings size={17} /><span>{t.nav.settings}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          {user ? (
            <div className="user-profile-card">
              <div className="user-avatar-small">{user.name?.[0]?.toUpperCase() || "U"}</div>
              <div className="user-profile-info">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>
          ) : (
            <button className="login-sidebar-btn" onClick={() => setAuthPage("login")}>
              <LogIn size={15} /> {t.nav.login}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu /></button>
          <div className="breadcrumb">
            <span>Workspace</span><ChevronRight size={14} />
            <strong>{activePage === "Dashboard" ? t.nav.dashboard : activePage}</strong>
          </div>
          <div className="top-actions">
            {/* Quick Theme Switcher */}
            <button
              className="icon-button"
              onClick={toggleQuickTheme}
              title={theme === "clean-light" ? "Switch to Dark Neon" : "Switch to Light Mode"}
              aria-label="Toggle theme"
            >
              {theme === "clean-light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Language Dropdown Selector */}
            <div className="lang-selector-wrap" ref={langDropdownRef}>
              <button
                className="icon-button lang-toggle"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                aria-label="Select language"
                title="Select language"
              >
                <Globe size={18} />
                <span className="lang-label">
                  {(SUPPORTED_LANGS.find((x) => x.key === lang)?.label || "EN").split(" ")[0]}
                </span>
              </button>

              {langDropdownOpen && (
                <div className="lang-dropdown-menu">
                  {SUPPORTED_LANGS.map(({ key, label, flag }) => (
                    <button
                      key={key}
                      type="button"
                      className={`lang-dropdown-item ${lang === key ? "active" : ""}`}
                      onClick={() => handleLangChange(key)}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PWA 1-Tap Install Button */}
            {!isAppInstalled && (
              <button
                type="button"
                className="install-app-pill"
                onClick={handleInstallClick}
                title="Install Nexa App on your phone"
              >
                <Download size={13} />
                <span className="install-pill-text">{lang === "mr" ? "ॲप इन्स्टॉल" : "Install App"}</span>
              </button>
            )}

            {/* Interactive Notification Center */}
            <div className="notification-wrap" ref={notificationsRef}>
              <button
                className="icon-button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label="Notifications"
                title={t.notificationsTitle || "Notifications"}
              >
                <Bell size={19} />
                {notificationsList.filter((n) => !n.read).length > 0 && (
                  <span className="notification-dot" aria-hidden="true" />
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>
                      <Bell size={15} />
                      <span>{t.notificationsTitle || "Notifications"}</span>
                      {notificationsList.filter((n) => !n.read).length > 0 && (
                        <span className="notification-badge">
                          {notificationsList.filter((n) => !n.read).length}
                        </span>
                      )}
                    </h4>
                    {notificationsList.some((n) => !n.read) && (
                      <button
                        type="button"
                        className="notification-mark-all"
                        onClick={() => {
                          setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
                          showToast(t.markAllRead || "All marked as read");
                        }}
                      >
                        {t.markAllRead || "Mark all read"}
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notificationsList.length === 0 ? (
                      <div className="notification-empty">
                        {t.noNotifications || "No notifications"}
                      </div>
                    ) : (
                      notificationsList.map((item) => (
                        <div
                          key={item.id}
                          className={`notification-item ${!item.read ? "unread" : ""}`}
                          onClick={() => {
                            setNotificationsList((prev) =>
                              prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                            );
                            if (item.page) setActivePage(item.page);
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="notification-item-icon">{item.icon}</div>
                          <div className="notification-item-content">
                            <div className="notification-item-title">
                              <span>{item.title}</span>
                              <span className="notification-item-time">{item.time}</span>
                            </div>
                            <p className="notification-item-desc">{item.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {user ? (
              <div className="avatar" title={user.name} aria-label={user.name}>
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            ) : (
              <button className="icon-button" onClick={() => setAuthPage("login")} aria-label="Login">
                <UserRound size={19} />
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          {/* ── Compare Page ── */}
          {activePage === "Compare" && (
            <ComparePage compareIds={compare} allProducts={products} t={t} onRemove={toggleCompare} />
          )}

          {/* ── Orders Page ── */}
          {activePage === "Orders" && (
            <OrdersPage orders={orders} t={t} onShop={() => setActivePage("Dashboard")} />
          )}

          {/* ── Admin Dashboard ── */}
          {activePage === "Admin" && user?.role === "admin" && (
            <AdminDashboard products={products} onSaveProducts={setProducts} t={t} />
          )}

          {/* ── Settings Page ── */}
          {activePage === "Settings" && (
            <SettingsPage
              t={t}
              lang={lang}
              onLangChange={handleLangChange}
              theme={theme}
              onThemeChange={setTheme}
              user={user}
              onLogout={handleLogout}
            />
          )}

          {/* ── Main Shopping Pages (Dashboard, Wishlist, Cart) ── */}
          {["Dashboard", "Wishlist", "Cart"].includes(activePage) && (
            <>
              {/* Hero */}
              <section className="hero-section">
                <div>
                  <div className="eyebrow"><span className="pulse-icon"><Sparkles size={13} /></span> {t.hero.eyebrow}</div>
                  <h1>{t.hero.h1a}<br /><span>{t.hero.h1b}</span></h1>
                  <p>{t.hero.sub}</p>
                  <div className="creator-highlight">
                    <span>{t.hero.designedBy}</span>
                    <strong>Sharvari Pawar</strong>
                    <em>{t.hero.college2}</em>
                  </div>
                </div>
                <div className="hero-orb" aria-hidden="true">
                  <div className="orb-ring ring-one" />
                  <div className="orb-ring ring-two" />
                  <div className="orb-core"><Bot size={35} /></div>
                  <span className="orb-label">AI ONLINE</span>
                </div>
              </section>

              {/* Stats */}
              <section className="stats-row" aria-label="Statistics">
                {[["12K+", t.stats[0]], ["98%", t.stats[1]], ["4.9/5", t.stats[2]], ["24/7", t.stats[3]]].map(([val, label]) => (
                  <div key={label}><strong>{val}</strong><span>{label}</span></div>
                ))}
              </section>

              {/* Search */}
              <section className="search-panel" aria-label="Search" ref={searchWrapRef} style={{ position: "relative" }}>
                <div className="search-input-wrap">
                  <Search size={20} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={t.search.placeholder}
                    aria-label={t.search.placeholder}
                  />
                  <button
                    type="button"
                    className={`voice-search-btn ${isListening ? "listening" : ""}`}
                    onClick={() => startVoiceSearch("search")}
                    title={isListening ? (t.listening || "Listening...") : (t.voiceSearch || "Voice Search")}
                    aria-label={t.voiceSearch || "Voice search"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <kbd aria-hidden="true">⌘ K</kbd>
                </div>
                <button className="primary-button" onClick={() => setActivePage("AI Assistant")} aria-label={t.search.btn}>
                  <Sparkles size={17} aria-hidden="true" /> {t.search.btn}
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-autocomplete">
                    <div className="autocomplete-header">Suggested Products ({searchSuggestions.length})</div>
                    {searchSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="autocomplete-item"
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowSuggestions(false);
                        }}
                      >
                        <img src={item.image} alt={item.name} className="autocomplete-thumb" />
                        <div className="autocomplete-info">
                          <div className="autocomplete-name">{item.name}</div>
                          <div className="autocomplete-meta">
                            <span>{item.brand || item.type}</span>
                            <span>•</span>
                            <span>★ {item.rating}</span>
                          </div>
                        </div>
                        <div className="autocomplete-price">{money(item.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <div className="quick-prompts" aria-label="Quick search suggestions">
                <span>{t.search.tryAsking}</span>
                <button onClick={() => setQuery("MacBook Pro")}>MacBook Pro <ArrowUpRight size={13} /></button>
                <button onClick={() => setQuery("iPhone 15")}>iPhone 15 <ArrowUpRight size={13} /></button>
                <button onClick={() => setQuery("Sony Alpha")}>Sony Alpha <ArrowUpRight size={13} /></button>
                <button onClick={() => setQuery("Sabyasachi")}>Sabyasachi <ArrowUpRight size={13} /></button>
              </div>

              {/* Categories */}
              <div className="section-heading">
                <div>
                  <p className="section-kicker">{t.explore}</p>
                  <h2>{t.shopByCategory}</h2>
                </div>
                <button className="text-button" onClick={() => { setSelectedCategory("All"); setSelectedBrand("All"); setSelectedGender("All"); setMaxPrice(400000); setActivePage("Dashboard"); }}>
                  {t.viewAll} <ArrowUpRight size={15} />
                </button>
              </div>
              <section className="category-grid" aria-label="Categories">
                {categories.map((cat, index) => (
                  <button
                    key={cat.label}
                    className={`category-card category-${index % 12}`}
                    onClick={() => { setSelectedCategory(cat.label); setSelectedBrand("All"); setActivePage("Dashboard"); }}
                    aria-label={`Browse ${cat.label}`}
                  >
                    <span className="category-icon" aria-hidden="true">{cat.icon}</span>
                    <strong>{cat.label}</strong>
                    <small>{cat.count}</small>
                    <ChevronRight className="category-arrow" size={16} aria-hidden="true" />
                  </button>
                ))}
              </section>

              {/* Product section heading */}
              <div className="section-heading recommendation-heading">
                <div>
                  <p className="section-kicker">
                    {activePage === "Wishlist" ? t.savedForLater : activePage === "Cart" ? t.readyCheckout : t.curated}
                    <span className="sparkle-line" aria-hidden="true"> ✦</span>
                  </p>
                  <h2>{activePage === "Wishlist" ? t.yourWishlist : activePage === "Cart" ? t.yourCart : t.trendingPicks}</h2>
                </div>
                <div className="filter-tabs" role="group" aria-label="Category filter">
                  <button className={selectedCategory === "All" ? "selected" : ""} onClick={() => { setSelectedCategory("All"); setSelectedBrand("All"); }}>{t.all}</button>
                  {["Laptops", "Smartphones", "Audio", "Wearables", "Cameras", "Gaming", "Fashion"].map((cat) => (
                    <button key={cat} className={selectedCategory === cat ? "selected" : ""} onClick={() => { setSelectedCategory(cat); setSelectedBrand("All"); }}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Target Audience / Gender filter chips */}
              <div className="gender-filter-bar" aria-label="Audience filter">
                <span style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600, marginRight: 6, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center" }}>
                  {t.targetAudience || "Audience"}:
                </span>
                {[
                  { key: "All", label: t.genders?.all || "All" },
                  { key: "Men", label: t.genders?.men || "For Men" },
                  { key: "Women", label: t.genders?.women || "Women & Girls" },
                  { key: "Unisex", label: t.genders?.unisex || "Unisex & All Humans" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`gender-chip ${selectedGender === key ? "active" : ""}`}
                    onClick={() => setSelectedGender(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Brand filter chips */}
              {availableBrands.length > 1 && (
                <div className="brand-filter-bar" aria-label="Brand filter">
                  <button
                    className={`brand-chip ${selectedBrand === "All" ? "active" : ""}`}
                    onClick={() => setSelectedBrand("All")}
                  >
                    {t.allBrands || "All Brands"}
                  </button>
                  {availableBrands.map((b) => (
                    <button
                      key={b}
                      className={`brand-chip ${selectedBrand === b ? "active" : ""}`}
                      onClick={() => setSelectedBrand(selectedBrand === b ? "All" : b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* Toolbar: price + inStock + sort */}
              <div className="catalog-toolbar">
                <div className="toolbar-price-row">
                  <div>
                    <span>{t.priceRange}</span>
                    <strong>{money(1)} — {money(maxPrice)}</strong>
                  </div>
                  <button className="reset-filter" onClick={() => { setMaxPrice(400000); setSelectedCategory("All"); setSelectedBrand("All"); setSelectedGender("All"); setInStockOnly(false); setQuery(""); setSortKey("default"); }}>
                    {t.reset}
                  </button>
                </div>
                <input
                  type="range" min="1" max="400000" step="2500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Max price"
                />
                <div className="toolbar-controls-row">
                  <label className="instock-toggle-label">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span>{t.inStockOnly || "In Stock Only"}</span>
                  </label>
                  <div className="sort-wrap">
                    <ArrowUpDown size={13} aria-hidden="true" />
                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label={t.sortBy} className="sort-select">
                      {sortOptions.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products (Paginated) */}
              <section className="product-grid" aria-label="Products">
                {paginatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    liked={wishlist.includes(p.id)}
                    inCart={cart.includes(p.id)}
                    compared={compare.includes(p.id)}
                    onLike={() => toggleWishlist(p.id)}
                    onCart={() => addToCart(p)}
                    onRemoveFromCart={() => removeFromCart(p.id)}
                    onBuyNow={() => handleBuyNow(p)}
                    onCompare={() => toggleCompare(p.id)}
                    onDetails={() => setSelectedProduct(p)}
                    t={t}
                  />
                ))}
                {visibleProducts.length === 0 && (
                  <div className="empty-state">
                    <Search size={25} />
                    <h3>{activePage === "Wishlist" ? t.wishlistEmpty : activePage === "Cart" ? t.cartEmpty : t.noMatches}</h3>
                    <p>{t.exploreDesc}</p>
                    <button className="secondary-button" onClick={() => { setQuery(""); setSelectedCategory("All"); setSelectedBrand("All"); setSelectedGender("All"); setInStockOnly(false); setMaxPrice(400000); setActivePage("Dashboard"); }}>
                      {t.exploreAll}
                    </button>
                  </div>
                )}
              </section>

              {/* Pagination controls */}
              {visibleProducts.length > ITEMS_PER_PAGE && (
                <div className="pagination-bar" aria-label="Pagination">
                  <div className="pagination-info">
                    {t.showing || "Showing"} <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, visibleProducts.length)}</strong> {t.of || "of"} <strong>{visibleProducts.length.toLocaleString()}</strong> {t.models || "models"}
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="page-btn jump-edge"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      title="First page"
                      aria-label="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Previous page"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} /> {t.prev || "Prev"}
                    </button>

                    {/* Page number buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) {
                          acc.push("ellipsis-" + p);
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item) =>
                        typeof item === "string" ? (
                          <span key={item} className="page-ellipsis">…</span>
                        ) : (
                          <button
                            key={item}
                            className={`page-btn ${currentPage === item ? "active" : ""}`}
                            onClick={() => handlePageChange(item)}
                            aria-label={`Page ${item}`}
                            aria-current={currentPage === item ? "page" : undefined}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Next page"
                      aria-label="Next page"
                    >
                      {t.next || "Next"} <ChevronRight size={16} />
                    </button>
                    <button
                      className="page-btn jump-edge"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last page"
                      aria-label="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Cart strip */}
              {cart.length > 0 && activePage !== "Cart" && (
                <section className="cart-strip" aria-live="polite">
                  <ShoppingBag size={19} aria-hidden="true" />
                  <div>
                    <strong>{cart.length} {t.itemsInCart}</strong>
                    <span>{t.reviewBeforeCheckout}</span>
                  </div>
                  <button className="primary-button" onClick={() => setActivePage("Cart")}>{t.openCart} <ArrowUpRight size={15} /></button>
                </section>
              )}

              {/* Cart checkout button */}
              {activePage === "Cart" && cart.length > 0 && (
                <div style={{ textAlign: "right", marginTop: 18 }}>
                  <div className="cart-total-bar">
                    <span>Total: <strong style={{ color: "var(--violet)" }}>{money(products.filter(p => cart.includes(p.id)).reduce((s, p) => s + p.price, 0))}</strong></span>
                    <button className="primary-button" onClick={() => user ? setActivePage("Checkout") : setAuthPage("login")}>
                      Proceed to Checkout <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Assistant banner */}
              <section className="assistant-banner">
                <div className="assistant-avatar" aria-hidden="true"><Bot size={23} /></div>
                <div>
                  <p className="section-kicker">{t.needHelp}</p>
                  <h3>{t.letNexa}</h3>
                  <p>{t.tellMe}</p>
                </div>
                <button className="primary-button" onClick={() => setActivePage("AI Assistant")}>
                  {t.chatWithNexa} <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ── AI Chat Modal ── */}
      {(activePage === "AI Assistant" || activePage === "Chat") && (
        <div className="modal-backdrop" onClick={() => setActivePage("Dashboard")} role="dialog" aria-modal="true" aria-label="AI Assistant">
          <section className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="online-label"><span className="live-dot" /> {t.onlineLabel}</span>
                <h2>{t.yourShoppingAssistant || t.yourShoppingCopilot}</h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="icon-button" onClick={clearChat} title="Clear conversation" aria-label="Clear chat">
                  <Trash2 size={16} />
                </button>
                <button className="icon-button" onClick={() => setActivePage("Dashboard")} aria-label="Close chat">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="chat-messages" role="log" aria-live="polite">
              {chat.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.from}`}>
                  {msg.from === "ai" && <div className="mini-bot" aria-hidden="true"><Bot size={14} /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, flex: 1 }}>{formatAiText(msg.text)}</p>
                      {msg.from === "ai" && (
                        <button
                          type="button"
                          className={`tts-speak-btn ${speakingIdx === i ? "speaking" : ""}`}
                          onClick={() => speakText(msg.text, i)}
                          title={speakingIdx === i ? "Stop audio" : "Listen to audio response"}
                          aria-label="Listen response"
                        >
                          {speakingIdx === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      )}
                    </div>
                    {msg.from === "ai" && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="chat-products-row">
                        {msg.recommendedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="chat-product-card"
                            onClick={() => setSelectedProduct(p)}
                            title={`Click to view ${p.name}`}
                          >
                            <img src={p.image} alt={p.name} className="chat-product-img" loading="lazy" />
                            <div className="chat-product-info">
                              <span className="chat-product-brand">{p.brand || p.type}</span>
                              <div className="chat-product-name">{p.name}</div>
                              <div className="chat-product-price-row">
                                <span className="chat-product-price">{money(p.price)}</span>
                                <span className="rating" style={{ fontSize: 10 }}>★ {p.rating}</span>
                              </div>
                              <button
                                type="button"
                                className="chat-product-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProduct(p);
                                }}
                              >
                                View Product <ExternalLink size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-message ai">
                  <div className="mini-bot" aria-hidden="true"><Bot size={14} /></div>
                  <p className="typing-dots"><span /><span /><span /></p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick suggestion chips */}
            <div className="chat-chips">
              {(lang === "mr" ? [
                "💻 ₹50,000 च्या आत लॅपटॉप",
                "📱 ₹20,000 च्या आत मोबाईल",
                "🎧 ₹2,000 च्या आत इअरबड्स",
                "⌚ ₹3,000 च्या आत स्मार्टवॉच",
                "🔥 सर्वोत्तम डील्स",
                "⚡ गेमिंग उपकरणे"
              ] : [
                "💻 Laptop under ₹50,000",
                "📱 Smartphone under ₹20,000",
                "🎧 Earbuds under ₹2,000",
                "⌚ Smartwatch under ₹3,000",
                "🔥 Top discount deals",
                "⚡ Gaming gadgets"
              ]).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="chat-chip"
                  onClick={() => sendMessage(null, chip.replace(/^[^\w\u0900-\u097F]+/, ""))}
                >
                  {chip}
                </button>
              ))}
            </div>

            <form className="chat-form" onSubmit={sendMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.chatPlaceholder}
                aria-label={t.chatPlaceholder}
                disabled={chatLoading}
              />
              <button
                type="button"
                className={`voice-search-btn ${isListening ? "listening" : ""}`}
                onClick={() => startVoiceSearch("chat")}
                title={isListening ? "Listening..." : "Voice input"}
                style={{ marginRight: 4 }}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button className="primary-button" type="submit" aria-label={t.send} disabled={chatLoading}>
                <Send size={16} />
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── Product Quick View Modal (Flipkart / Amazon Multi-Image Gallery) ── */}
      {selectedProduct && (() => {
        const productImages = (selectedProduct.images && selectedProduct.images.length > 0)
          ? selectedProduct.images
          : [selectedProduct.image];
        const currentImgUrl = productImages[activeImgIdx] || selectedProduct.image;
        const thumbLabels = ["Front View", "Angle View", "Detail View", "Lifestyle"];

        return (
          <div className="modal-backdrop" onClick={() => setSelectedProduct(null)} role="dialog" aria-modal="true" aria-label={`Quick view: ${selectedProduct.name}`}>
            <section className="product-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-product" onClick={() => setSelectedProduct(null)} aria-label="Close"><X size={18} /></button>

              {/* Flipkart / Amazon Multi-Image Gallery */}
              <div className="product-gallery-section">
                <div className="gallery-main-wrap">
                  <img src={currentImgUrl} alt={`${selectedProduct.name} - view ${activeImgIdx + 1}`} className="gallery-main-img" />
                  {productImages.length > 1 && (
                    <>
                      <button 
                        type="button" 
                        className="gallery-nav-btn prev" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImgIdx((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                        }}
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        type="button" 
                        className="gallery-nav-btn next" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImgIdx((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                        }}
                        aria-label="Next photo"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="gallery-counter">
                        {activeImgIdx + 1} / {productImages.length}
                      </div>
                    </>
                  )}
                </div>

                {productImages.length > 1 && (
                  <div className="gallery-thumbnails">
                    {productImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`gallery-thumb-btn ${idx === activeImgIdx ? "active" : ""}`}
                        onClick={() => setActiveImgIdx(idx)}
                        onMouseEnter={() => setActiveImgIdx(idx)}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                        <span className="thumb-label">{thumbLabels[idx] || `View ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-modal-copy">
              <span className={`product-tag tag-${selectedProduct.color}`}>{selectedProduct.tag}</span>
              {selectedProduct.isNew && <span className="new-badge" style={{ marginLeft: 6 }}>NEW</span>}
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <div className="rating"><Star size={14} fill="currentColor" /> {selectedProduct.rating} <span>({selectedProduct.reviews} {t.reviews})</span></div>
              <div className="modal-price">{money(selectedProduct.price)} <del>{money(selectedProduct.oldPrice)}</del></div>
              <div className="spec-list">
                {selectedProduct.specs.map((s) => <span key={s}><Check size={14} /> {s}</span>)}
              </div>
              <div className="modal-stock">
                <span>{t.warranty}: {selectedProduct.warranty}</span>
                <span>{selectedProduct.stock > 0 ? `${selectedProduct.stock} ${t.stock}` : t.outOfStock}</span>
              </div>
              <div className="product-actions-stacked" style={{ marginTop: 16 }}>
                {cart.includes(selectedProduct.id) ? (
                  <button
                    className="cart-toggle-btn in-cart wide-button"
                    onClick={() => { removeFromCart(selectedProduct.id); }}
                  >
                    <Trash2 size={16} /> {t.removeFromCart || "Remove from cart"}
                  </button>
                ) : (
                  <button
                    className="cart-toggle-btn wide-button"
                    onClick={() => { addToCart(selectedProduct); }}
                    disabled={selectedProduct.stock === 0}
                  >
                    <ShoppingBag size={16} /> {t.addToCart || "Add to cart"}
                  </button>
                )}
                <button
                  className="buy-now-btn wide-button"
                  onClick={() => { handleBuyNow(selectedProduct); setSelectedProduct(null); }}
                  disabled={selectedProduct.stock === 0}
                >
                  <Zap size={16} /> {t.buyNow || "Buy Now"}
                </button>
                <button
                  type="button"
                  className="secondary-button wide-button"
                  style={{ marginTop: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  onClick={() => {
                    const text = `${selectedProduct.name} - ${money(selectedProduct.price)} (Nexa Cart, Sharvari Pawar)`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      showToast("Product details copied to clipboard!");
                    }
                  }}
                >
                  <Share2 size={15} /> Copy Details
                </button>
                <button
                  type="button"
                  className="whatsapp-btn wide-button"
                  style={{ marginTop: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#25D366", color: "#ffffff", border: "none", fontWeight: 600, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}
                  onClick={() => shareOnWhatsApp(selectedProduct)}
                >
                  <MessageCircle size={16} /> {lang === "mr" ? "WhatsApp वर शेअर करा" : "Share on WhatsApp"}
                </button>
              </div>
            </div>
          </section>
        </div>
        );
      })()}

      {/* ── Modern Mobile Bottom Navigation Bar (Flipkart / Amazon App style) ── */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Bottom Navigation">
        <button
          type="button"
          className={`mob-nav-btn ${activePage === "Dashboard" ? "active" : ""}`}
          onClick={() => setActivePage("Dashboard")}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={`mob-nav-btn ${activePage === "Wishlist" ? "active" : ""}`}
          onClick={() => setActivePage("Wishlist")}
        >
          <Heart size={20} />
          <span>Saved</span>
          {wishlist.length > 0 && <span className="mob-badge">{wishlist.length}</span>}
        </button>
        <button
          type="button"
          className={`mob-nav-btn ${activePage === "AI Assistant" || activePage === "Chat" ? "active" : ""}`}
          onClick={() => setActivePage("AI Assistant")}
        >
          <div className="mob-ai-bubble">
            <Sparkles size={18} />
          </div>
          <span style={{ color: "var(--cyan)", fontWeight: 700 }}>Ask Nexa</span>
        </button>
        <button
          type="button"
          className={`mob-nav-btn ${activePage === "Orders" ? "active" : ""}`}
          onClick={() => setActivePage("Orders")}
        >
          <Package size={20} />
          <span>Orders</span>
          {orders.length > 0 && <span className="mob-badge">{orders.length}</span>}
        </button>
        <button
          type="button"
          className={`mob-nav-btn ${activePage === "Cart" ? "active" : ""}`}
          onClick={() => setActivePage("Cart")}
        >
          <ShoppingBag size={20} />
          <span>Cart</span>
          {cart.length > 0 && <span className="mob-badge">{cart.length}</span>}
        </button>
      </nav>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
