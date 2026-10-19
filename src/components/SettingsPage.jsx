import React, { useState } from "react";
import { Globe, Bell, UserRound, Moon, Shield, LogOut } from "lucide-react";
import { SUPPORTED_LANGS } from "../data/i18n.js";

export function SettingsPage({ t, lang, onLangChange, theme, onThemeChange, user, onLogout }) {
  const [notifications, setNotifications] = useState({ deals: true, orders: true, wishlist: false });

  const themeList = [
    { key: "dark-neon", label: "Dark Neon (डार्क निऑन)", icon: "✨", desc: "Signature cyberpunk dark obsidian, glowing violet & cyan" },
    { key: "clean-light", label: "Clean Light Mode (लाईट मोड)", icon: "☀️", desc: "Crisp modern light workspace, high-contrast dark text" },
  ];

  return (
    <div className="settings-page">
      <h2 className="page-title">{t.settingsTitle}</h2>

      {/* Account section */}
      <div className="settings-card">
        <div className="settings-card-title"><UserRound size={16} /> {t.account}</div>
        {user ? (
          <div className="settings-account-info">
            <div className="user-avatar-large">{user.name?.[0] || "U"}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span className={`role-tag ${user.role === "admin" ? "admin-role" : ""}`}>{user.role}</span>
            </div>
            <button className="secondary-button logout-btn" onClick={onLogout}>
              <LogOut size={15} /> {t.nav.logout}
            </button>
          </div>
        ) : (
          <p style={{ color: "#767d94", fontSize: 13 }}>Not logged in.</p>
        )}
      </div>

      {/* Language section (Multi-Language) */}
      <div className="settings-card">
        <div className="settings-card-title"><Globe size={16} /> {t.language}</div>
        <div className="lang-options">
          {SUPPORTED_LANGS.map(({ key, label, flag }) => (
            <button
              key={key}
              type="button"
              className={`lang-option ${lang === key ? "selected" : ""}`}
              onClick={() => onLangChange(key)}
            >
              <span>{flag}</span>
              <span>{label}</span>
              {lang === key && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Theme section (Fully Working Multi-Theme) */}
      <div className="settings-card">
        <div className="settings-card-title"><Moon size={16} /> {t.theme}</div>
        <div className="theme-options">
          {themeList.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`theme-option ${theme === item.key ? "selected" : ""}`}
              onClick={() => onThemeChange(item.key)}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <strong>{item.label}</strong>
                <small style={{ display: "block", color: "var(--muted)", fontSize: 10, marginTop: 2 }}>{item.desc}</small>
              </div>
              {theme === item.key && <span style={{ marginLeft: "auto", color: "var(--violet)", fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications section */}
      <div className="settings-card">
        <div className="settings-card-title"><Bell size={16} /> {t.notifications}</div>
        <div className="settings-toggles">
          {[
            { key: "deals", label: "Deal alerts & offers" },
            { key: "orders", label: "Order status updates" },
            { key: "wishlist", label: "Wishlist price drops" },
          ].map(({ key, label }) => (
            <div key={key} className="settings-toggle-row">
              <span>{label}</span>
              <button
                className={`toggle-btn ${notifications[key] ? "on" : "off"}`}
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                aria-label={`Toggle ${label}`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="settings-card">
        <div className="settings-card-title"><Shield size={16} /> Privacy</div>
        <p className="settings-note">All your data is stored locally on your device. No data is sent to any server. Nexa AI uses the Gemini API only for shopping recommendations.</p>
      </div>

      <div className="settings-footer">
        <strong>Nexa AI Shopping Assistant</strong>
        <span>v2.0.0 • Built by Sharvari Pawar</span>
        <span>Arvind Gavli College of Engineering</span>
      </div>
    </div>
  );
}
