"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/features/live/http";

export type SettingsTab =
  | "general"
  | "profile"
  | "notifications"
  | "security"
  | "billing";

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  staffId: string;
  role: string;
  joined: string;
  lastLogin: string;
  avatarUrl: string | null;
}

export interface ActiveSession {
  id: string;
  title: string;
  meta: string;
  deviceType: "desktop" | "mobile" | "laptop";
  isCurrent: boolean;
}

function describeBrowser(): ActiveSession {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "this device";
  const mobile = /Android|iPhone|iPad/.test(ua);
  return { id: "current", title: `${browser} on ${os}`, meta: "This device · Active now", deviceType: mobile ? "mobile" : "desktop", isCurrent: true };
}

export interface InvoiceItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending";
}

const initialInvoices: InvoiceItem[] = [
  {
    id: "inv-1",
    date: "Aug 1, 2026",
    description: "Growth Plan — Monthly",
    amount: "$49.00",
    status: "Paid",
  },
  {
    id: "inv-2",
    date: "Jul 1, 2026",
    description: "Growth Plan — Monthly",
    amount: "$49.00",
    status: "Paid",
  },
  {
    id: "inv-3",
    date: "Jun 1, 2026",
    description: "Growth Plan — Monthly",
    amount: "$49.00",
    status: "Paid",
  },
];

const languages = [
  "English",
  "Khmer (ខ្មែរ)",
  "French (Français)",
  "Chinese (中文)",
];

const timezones = [
  "(UTC+07:00) Phnom Penh",
  "(UTC+07:00) Bangkok, Hanoi, Jakarta",
  "(UTC+08:00) Singapore, Kuala Lumpur",
  "(UTC+00:00) UTC",
];

const dateFormats = ["DD.MM.YYYY", "YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "VK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SettingsPageProps {
  initialTab?: SettingsTab;
  initialEdit?: boolean;
}

export default function SettingsPage({
  initialTab = "general",
  initialEdit = false,
}: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(initialEdit);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function handleSelectTab(tab: SettingsTab) {
    setActiveTab(tab);
    setIsEditingProfile(false);
    if (typeof window !== "undefined") {
      const targetUrl = tab === "general" ? "/settings" : `/settings/${tab}`;
      window.history.pushState(null, "", targetUrl);
    }
  }

  // Profile data state
  const { user } = useAuth();
  const profile: ProfileData = {
    fullName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—",
    email: user?.email || user?.profile?.email || "—",
    phone: user?.phone || user?.profile?.phone || "—",
    staffId: user?.staffId || "—",
    role: user?.role || user?.roles?.[0] || "—",
    joined: user?.profile?.createdAt ? new Date(user.profile.createdAt).toLocaleDateString("en-GB").replace(/\//g, ".") : "—",
    lastLogin: "This session",
    avatarUrl: user?.avatar || user?.profile?.avatar || null,
  };

  // Edit form state
  const [editFullName, setEditFullName] = useState(profile.fullName);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(profile.avatarUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // General settings state
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("(UTC+07:00) Phnom Penh");
  const [dateFormat, setDateFormat] = useState("DD.MM.YYYY");

  // Dropdown states
  const [langOpen, setLangOpen] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [dfOpen, setDfOpen] = useState(false);

  // Notification states matching the screenshot defaults
  const [notifLowStockEmail, setNotifLowStockEmail] = useState(true);
  const [notifPOUpdatesEmail, setNotifPOUpdatesEmail] = useState(true);
  const [notifTransferRequestsEmail, setNotifTransferRequestsEmail] = useState(true);
  const [notifWeeklySummaryEmail, setNotifWeeklySummaryEmail] = useState(false);
  const [notifDesktopInApp, setNotifDesktopInApp] = useState(true);
  const [notifSoundInApp, setNotifSoundInApp] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const tzRef = useRef<HTMLDivElement>(null);
  const dfRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  function playBeepSound() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  }

  function handleToggleSound(nextVal: boolean) {
    setNotifSoundInApp(nextVal);
    if (nextVal) {
      playBeepSound();
    }
    showToast(`Sound alerts ${nextVal ? "enabled" : "disabled"}.`);
  }

  function handleToggleDesktop(nextVal: boolean) {
    setNotifDesktopInApp(nextVal);
    if (nextVal && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    showToast(`Desktop notifications ${nextVal ? "enabled" : "disabled"}.`);
  }

  // Security states matching screenshot
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([describeBrowser()]);
  const [passwordLastChanged, setPasswordLastChanged] = useState("Change it regularly to keep your account safe");

  // Security Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  function handleRevokeSession(id: string, name: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast(`Revoked ${name} session.`);
  }

  function handleRevokeAllOther() {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("Signed out of all other sessions.");
  }

  async function handleSavePassword() {
    if (!currPassword) {
      showToast("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.");
      return;
    }
    try {
      await api.post("auth/change-password", { currentPassword: currPassword, newPassword });
    } catch (e) {
      showToast(e instanceof ApiError && e.message ? e.message : "Couldn't change the password. Check your current password.");
      return;
    }
    setPasswordLastChanged("Last changed just now");
    setShowPasswordModal(false);
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated successfully!");
  }

  function handleVerifyAndEnable2FA() {
    if (twoFactorCode.trim().length < 6) {
      showToast("Please enter the 6-digit verification code.");
      return;
    }
    setIs2FAEnabled(true);
    setShow2FAModal(false);
    setTwoFactorCode("");
    showToast("Two-factor authentication enabled successfully!");
  }

  // Billing states matching screenshot
  const [currentPlan, setCurrentPlan] = useState({
    name: "Growth Plan",
    price: "$49",
    frequency: "/month",
    features: "500 SKUs · 5 warehouses · Unlimited users",
  });
  const [paymentCard, setPaymentCard] = useState({
    brand: "Visa",
    last4: "4242",
    exp: "08/27",
  });
  const [invoices] = useState<InvoiceItem[]>(initialInvoices);

  // Billing Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState("growth");
  const [cardHolder, setCardHolder] = useState("Visal Khem");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("08/27");
  const [cardCvc, setCardCvc] = useState("•••");

  function handleDownloadInvoice(inv: InvoiceItem) {
    showToast(`Downloading invoice for ${inv.date} (${inv.amount})...`);
    const content = `STOCKFLOW INVOICE\n-----------------\nInvoice ID: ${inv.id}\nDate: ${inv.date}\nDescription: ${inv.description}\nAmount: ${inv.amount}\nStatus: ${inv.status}\nCustomer: Visal Khem (visal@stockflow.com)\nPayment Method: Visa ending in ${paymentCard.last4}\nThank you for choosing StockFlow!`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${inv.date.replace(/[\s,]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveCard() {
    const rawNumber = cardNumber.replace(/\s+/g, "");
    const last4 = rawNumber.length >= 4 ? rawNumber.slice(-4) : "4242";
    setPaymentCard((prev) => ({
      ...prev,
      last4,
      exp: cardExpiry || "08/27",
    }));
    setShowCardModal(false);
    showToast("Payment method updated successfully!");
  }

  function handleSelectPlan(planKey: string) {
    setSelectedPlanTier(planKey);
    if (planKey === "starter") {
      setCurrentPlan({
        name: "Starter Plan",
        price: "$29",
        frequency: "/month",
        features: "100 SKUs · 2 warehouses · 3 users",
      });
      showToast("Plan changed to Starter Plan ($29/month).");
    } else if (planKey === "growth") {
      setCurrentPlan({
        name: "Growth Plan",
        price: "$49",
        frequency: "/month",
        features: "500 SKUs · 5 warehouses · Unlimited users",
      });
      showToast("Plan set to Growth Plan ($49/month).");
    } else if (planKey === "enterprise") {
      setCurrentPlan({
        name: "Enterprise Pro",
        price: "$99",
        frequency: "/month",
        features: "Unlimited SKUs · Unlimited warehouses · 24/7 support",
      });
      showToast("Plan upgraded to Enterprise Pro ($99/month).");
    }
    setShowUpgradeModal(false);
  }

  // Close dropdowns on click outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setTzOpen(false);
      }
      if (dfRef.current && !dfRef.current.contains(e.target as Node)) {
        setDfOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const isDarkMode = theme === "dark";

  function handleToggleDarkMode() {
    const next = isDarkMode ? "light" : "dark";
    setTheme(next);
    showToast(`Dark mode ${next === "dark" ? "enabled" : "disabled"}.`);
  }

  function handleStartEdit() {
    setEditFullName(profile.fullName);
    setEditEmail(profile.email);
    setEditPhone(profile.phone);
    setEditAvatarUrl(profile.avatarUrl);
    setIsEditingProfile(true);
  }

  function handleCancelEdit() {
    setEditFullName(profile.fullName);
    setEditEmail(profile.email);
    setEditPhone(profile.phone);
    setEditAvatarUrl(profile.avatarUrl);
    setIsEditingProfile(false);
  }

  function handleSaveProfile() {
    if (!editFullName.trim()) {
      showToast("Full name cannot be empty.");
      return;
    }
    setIsEditingProfile(false);
    showToast("Profile details are managed by an administrator, so nothing was changed.");
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditAvatarUrl(reader.result as string);
      showToast("Photo selected.");
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // VIEW: EDIT PROFILE (Matches User Screenshot)
  // =========================================================================
  if (isEditingProfile) {
    return (
      <div className="settings-page edit-profile-view">
        {/* Toast notification */}
        {toastMessage && (
          <div className="reports-toast" role="status" aria-live="polite">
            <span className="reports-toast-icon">✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hidden file input for Change photo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoChange}
        />

        {/* Header with Breadcrumb and Actions */}
        <div className="edit-profile-header-area">
          <div className="edit-profile-breadcrumb">
            <button
              type="button"
              className="crumb-link"
              onClick={handleCancelEdit}
            >
              Settings
            </button>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Edit Profile</span>
          </div>

          <div className="edit-profile-action-row">
            <h1 className="edit-profile-title">Edit Profile</h1>
            <div className="edit-profile-actions">
              <button
                type="button"
                className="edit-profile-cancel-btn"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-profile-save-btn"
                onClick={handleSaveProfile}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout matching screenshot */}
        <div className="edit-profile-layout">
          {/* Left Card: Edit details */}
          <section className="edit-profile-card">
            {/* Avatar Row */}
            <div className="edit-profile-avatar-row">
              <div className="edit-avatar-circle">
                {editAvatarUrl ? (
                  <img
                    src={editAvatarUrl}
                    alt={editFullName}
                    className="edit-avatar-img"
                  />
                ) : (
                  getInitials(editFullName)
                )}
              </div>
              <div className="edit-avatar-actions">
                <button
                  type="button"
                  className="edit-avatar-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change photo
                </button>
                {editAvatarUrl && (
                  <button
                    type="button"
                    className="edit-avatar-remove-btn"
                    onClick={() => setEditAvatarUrl(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="edit-profile-fields">
              <div className="edit-profile-field-group">
                <label htmlFor="edit-full-name" className="edit-profile-label">
                  Full name
                </label>
                <input
                  id="edit-full-name"
                  type="text"
                  className="edit-profile-input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Visal Khem"
                />
              </div>

              <div className="edit-profile-row-2col">
                <div className="edit-profile-field-group">
                  <label htmlFor="edit-email" className="edit-profile-label">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className="edit-profile-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="visal@stockflow.com"
                  />
                </div>

                <div className="edit-profile-field-group">
                  <label htmlFor="edit-phone" className="edit-profile-label">
                    Phone
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    className="edit-profile-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+855 12 555 019"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right Card: Account info */}
          <aside className="account-info-card">
            <h2 className="account-info-title">Account info</h2>
            <div className="account-info-list">
              <div className="account-info-row">
                <span className="account-info-label">Staff ID</span>
                <span className="account-info-value">{profile.staffId}</span>
              </div>
              <div className="account-info-row">
                <span className="account-info-label">Role</span>
                <span className="role-admin-badge">{profile.role}</span>
              </div>
              <div className="account-info-row">
                <span className="account-info-label">Joined</span>
                <span className="account-info-value">{profile.joined}</span>
              </div>
              <div className="account-info-row">
                <span className="account-info-label">Last login</span>
                <span className="account-info-value">{profile.lastLogin}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: REGULAR SETTINGS PAGE (With Profile Tab Added)
  // =========================================================================
  return (
    <div className="settings-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </div>

      {/* Main Two-Column Layout */}
      <div className="settings-layout">
        {/* Left Column: Subnavigation */}
        <aside className="settings-nav" aria-label="Settings sections">
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "general" ? "active" : ""
            }`}
            onClick={() => handleSelectTab("general")}
          >
            General
          </button>
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "notifications" ? "active" : ""
            }`}
            onClick={() => handleSelectTab("notifications")}
          >
            Notifications
          </button>
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "security" ? "active" : ""
            }`}
            onClick={() => handleSelectTab("security")}
          >
            Security
          </button>
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "billing" ? "active" : ""
            }`}
            onClick={() => handleSelectTab("billing")}
          >
            Billing
          </button>
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => handleSelectTab("profile")}
          >
            Profile
          </button>
        </aside>

        {/* Right Column: Security Tab uses 3 stacked cards */}
        {activeTab === "security" ? (
          <main className="settings-security-col">
            {/* Card 1: Password */}
            <section className="security-card">
              <h2 className="security-card-title">Password</h2>
              <div className="security-card-content">
                <div className="security-item-info">
                  <div className="security-item-title">Password</div>
                  <div className="security-item-sub">{passwordLastChanged}</div>
                </div>
                <button
                  type="button"
                  className="security-btn-outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change password
                </button>
              </div>
            </section>

            {/* Card 2: Two-factor authentication */}
            <section className="security-card">
              <h2 className="security-card-title">Two-factor authentication</h2>
              <div className="security-card-content">
                <div className="security-item-info">
                  <div className="security-title-with-badge">
                    <span className="security-item-title">Authenticator app</span>
                    {is2FAEnabled ? (
                      <span className="badge-2fa enabled">Active</span>
                    ) : (
                      <span className="badge-2fa not-enabled">Not enabled</span>
                    )}
                  </div>
                  <div className="security-item-sub">
                    Require a verification code from your phone when signing in
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    is2FAEnabled ? "security-btn-outline" : "security-btn-purple"
                  }
                  onClick={() => {
                    if (!is2FAEnabled) {
                      setShow2FAModal(true);
                    } else {
                      setIs2FAEnabled(false);
                      showToast("Two-factor authentication disabled.");
                    }
                  }}
                >
                  {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
                </button>
              </div>
            </section>

            {/* Card 3: Active sessions */}
            <section className="security-card">
              <div className="security-card-header-row">
                <h2 className="security-card-title">Active sessions</h2>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    className="security-signout-all-btn"
                    onClick={handleRevokeAllOther}
                  >
                    Sign out of all other sessions
                  </button>
                )}
              </div>

              <div className="security-sessions-list">
                {sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className={`security-session-row ${
                      idx === sessions.length - 1 ? "no-border" : ""
                    }`}
                  >
                    <div className="security-session-left">
                      <div
                        className={`security-device-icon ${
                          session.isCurrent ? "current" : "other"
                        }`}
                      >
                        {session.deviceType === "mobile" ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                          </svg>
                        ) : session.isCurrent ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="4" width="18" height="12" rx="2" />
                            <line x1="2" y1="20" x2="22" y2="20" />
                          </svg>
                        )}
                      </div>
                      <div className="security-session-details">
                        <div className="security-session-device">{session.title}</div>
                        <div className="security-session-meta">{session.meta}</div>
                      </div>
                    </div>

                    <div className="security-session-right">
                      {session.isCurrent ? (
                        <span className="badge-current-session">Current session</span>
                      ) : (
                        <button
                          type="button"
                          className="security-revoke-btn"
                          onClick={() =>
                            handleRevokeSession(session.id, session.title)
                          }
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        ) : activeTab === "billing" ? (
          /* Right Column: Billing Tab uses 3 stacked cards */
          <main className="settings-billing-col">
            {/* Card 1: Current Plan Banner */}
            <section className="billing-plan-card">
              <div className="billing-plan-left">
                <div className="billing-plan-tag">CURRENT PLAN</div>
                <div className="billing-plan-name-row">
                  <span className="billing-plan-name">
                    {currentPlan.name} — {currentPlan.price}
                  </span>
                  <span className="billing-plan-freq">{currentPlan.frequency}</span>
                </div>
                <div className="billing-plan-features">{currentPlan.features}</div>
              </div>
              <button
                type="button"
                className="billing-upgrade-btn"
                onClick={() => setShowUpgradeModal(true)}
              >
                Upgrade plan
              </button>
            </section>

            {/* Card 2: Payment Method */}
            <section className="billing-card">
              <h2 className="billing-card-title">Payment method</h2>
              <div className="billing-payment-row">
                <div className="billing-payment-left">
                  <div className="visa-badge">VISA</div>
                  <div className="billing-payment-details">
                    <div className="billing-payment-card-name">
                      {paymentCard.brand} ending in {paymentCard.last4}
                    </div>
                    <div className="billing-payment-card-exp">
                      Expires {paymentCard.exp}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="billing-update-btn"
                  onClick={() => setShowCardModal(true)}
                >
                  Update
                </button>
              </div>
            </section>

            {/* Card 3: Billing History */}
            <section className="billing-card">
              <h2 className="billing-card-title">Billing history</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="billing-history-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>DATE</th>
                      <th style={{ width: "40%" }}>DESCRIPTION</th>
                      <th style={{ width: "16%" }}>AMOUNT</th>
                      <th style={{ width: "12%" }}>STATUS</th>
                      <th style={{ width: "8%", textAlign: "right" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="billing-td-date">{inv.date}</td>
                        <td className="billing-td-desc">{inv.description}</td>
                        <td className="billing-td-amount">{inv.amount}</td>
                        <td>
                          <span className="badge-paid">{inv.status}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="billing-download-btn"
                            onClick={() => handleDownloadInvoice(inv)}
                            title={`Download invoice for ${inv.date}`}
                            aria-label={`Download invoice for ${inv.date}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        ) : (
          /* Right Column: Standard Single Content Card for General, Profile, Notifications */
          <main className="settings-content-card">
          {/* TAB: GENERAL */}
          {activeTab === "general" && (
            <div className="settings-panel">
              <h2 className="settings-panel-title">General preferences</h2>

              {/* Setting 1: Language */}
              <div className="settings-row" ref={langRef}>
                <div className="settings-label">Language</div>
                <div className="settings-control">
                  <button
                    type="button"
                    className="settings-select-btn"
                    onClick={() => setLangOpen(!langOpen)}
                    aria-expanded={langOpen}
                    aria-label="Select language"
                  >
                    <span>{language}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`settings-select-chevron ${
                        langOpen ? "open" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {langOpen && (
                    <div className="settings-select-dropdown">
                      {languages.map((l) => (
                        <button
                          key={l}
                          type="button"
                          className={`settings-dropdown-opt ${
                            language === l ? "selected" : ""
                          }`}
                          onClick={() => {
                            setLanguage(l);
                            setLangOpen(false);
                            showToast(`Language set to ${l}`);
                          }}
                        >
                          <span>{l}</span>
                          {language === l && (
                            <span className="dropdown-check">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Setting 2: Timezone */}
              <div className="settings-row" ref={tzRef}>
                <div className="settings-label">Timezone</div>
                <div className="settings-control">
                  <button
                    type="button"
                    className="settings-select-btn"
                    onClick={() => setTzOpen(!tzOpen)}
                    aria-expanded={tzOpen}
                    aria-label="Select timezone"
                  >
                    <span>{timezone}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`settings-select-chevron ${
                        tzOpen ? "open" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {tzOpen && (
                    <div className="settings-select-dropdown">
                      {timezones.map((tz) => (
                        <button
                          key={tz}
                          type="button"
                          className={`settings-dropdown-opt ${
                            timezone === tz ? "selected" : ""
                          }`}
                          onClick={() => {
                            setTimezone(tz);
                            setTzOpen(false);
                            showToast(`Timezone set to ${tz}`);
                          }}
                        >
                          <span>{tz}</span>
                          {timezone === tz && (
                            <span className="dropdown-check">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Setting 3: Date format */}
              <div className="settings-row" ref={dfRef}>
                <div className="settings-label">Date format</div>
                <div className="settings-control">
                  <button
                    type="button"
                    className="settings-select-btn"
                    onClick={() => setDfOpen(!dfOpen)}
                    aria-expanded={dfOpen}
                    aria-label="Select date format"
                  >
                    <span>{dateFormat}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`settings-select-chevron ${
                        dfOpen ? "open" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {dfOpen && (
                    <div className="settings-select-dropdown">
                      {dateFormats.map((df) => (
                        <button
                          key={df}
                          type="button"
                          className={`settings-dropdown-opt ${
                            dateFormat === df ? "selected" : ""
                          }`}
                          onClick={() => {
                            setDateFormat(df);
                            setDfOpen(false);
                            showToast(`Date format set to ${df}`);
                          }}
                        >
                          <span>{df}</span>
                          {dateFormat === df && (
                            <span className="dropdown-check">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Setting 4: Dark mode */}
              <div className="settings-row no-border">
                <div className="settings-label-group">
                  <div className="settings-label">Dark mode</div>
                  <div className="settings-sublabel">
                    Follows your device automatically
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDarkMode}
                    className={`settings-toggle-switch ${
                      isDarkMode ? "active" : ""
                    }`}
                    onClick={handleToggleDarkMode}
                    aria-label="Toggle dark mode"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROFILE (User Profile overview with Edit Profile button) */}
          {activeTab === "profile" && (
            <div className="settings-panel">
              <div className="profile-panel-header">
                <div>
                  <h2 className="settings-panel-title" style={{ marginBottom: 4 }}>
                    Personal profile
                  </h2>
                  <p className="profile-panel-sub">
                    Manage your personal details and account credentials.
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={handleStartEdit}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit profile</span>
                </button>
              </div>

              {/* Profile User Badge Card */}
              <div className="profile-user-summary">
                <div className="edit-avatar-circle">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="edit-avatar-img"
                    />
                  ) : (
                    getInitials(profile.fullName)
                  )}
                </div>
                <div className="profile-user-meta">
                  <div className="profile-user-name-row">
                    <span className="profile-user-name">{profile.fullName}</span>
                    <span className="role-admin-badge">{profile.role}</span>
                  </div>
                  <div className="profile-user-id">Staff ID: {profile.staffId}</div>
                </div>
              </div>

              {/* Profile Details Rows */}
              <div className="settings-row">
                <div className="settings-label">Full name</div>
                <div className="profile-field-value">{profile.fullName}</div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Email address</div>
                <div className="profile-field-value">{profile.email}</div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Phone number</div>
                <div className="profile-field-value">{profile.phone}</div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Staff ID</div>
                <div className="profile-field-value font-mono">{profile.staffId}</div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Role</div>
                <div className="settings-control">
                  <span className="role-admin-badge">{profile.role}</span>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Date joined</div>
                <div className="profile-field-value">{profile.joined}</div>
              </div>

              <div className="settings-row no-border">
                <div className="settings-label">Last login</div>
                <div className="profile-field-value">{profile.lastLogin}</div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="settings-panel">
              <h2 className="settings-panel-title" style={{ marginBottom: 4 }}>
                Notification preferences
              </h2>
              <p className="settings-panel-desc">
                Choose what StockFlow lets you know about, and how.
              </p>

              {/* Section 1: Email Notifications */}
              <div className="notif-section-title">EMAIL NOTIFICATIONS</div>

              <div className="settings-row">
                <div className="settings-label-group">
                  <div className="settings-label">Low stock alerts</div>
                  <div className="settings-sublabel">
                    Get notified when inventory drops below its reorder point
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifLowStockEmail}
                    className={`settings-toggle-switch ${
                      notifLowStockEmail ? "active" : ""
                    }`}
                    onClick={() => {
                      const next = !notifLowStockEmail;
                      setNotifLowStockEmail(next);
                      showToast(
                        `Low stock email alerts ${next ? "enabled" : "disabled"}.`
                      );
                    }}
                    aria-label="Toggle low stock alerts"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label-group">
                  <div className="settings-label">Purchase order updates</div>
                  <div className="settings-sublabel">
                    Approvals, receiving, and status changes
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPOUpdatesEmail}
                    className={`settings-toggle-switch ${
                      notifPOUpdatesEmail ? "active" : ""
                    }`}
                    onClick={() => {
                      const next = !notifPOUpdatesEmail;
                      setNotifPOUpdatesEmail(next);
                      showToast(
                        `Purchase order updates ${next ? "enabled" : "disabled"}.`
                      );
                    }}
                    aria-label="Toggle purchase order updates"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label-group">
                  <div className="settings-label">Transfer requests</div>
                  <div className="settings-sublabel">
                    New transfer requests awaiting your approval
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifTransferRequestsEmail}
                    className={`settings-toggle-switch ${
                      notifTransferRequestsEmail ? "active" : ""
                    }`}
                    onClick={() => {
                      const next = !notifTransferRequestsEmail;
                      setNotifTransferRequestsEmail(next);
                      showToast(
                        `Transfer requests notifications ${
                          next ? "enabled" : "disabled"
                        }.`
                      );
                    }}
                    aria-label="Toggle transfer requests"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label-group">
                  <div className="settings-label">Weekly summary report</div>
                  <div className="settings-sublabel">
                    A digest of stock activity every Monday morning
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifWeeklySummaryEmail}
                    className={`settings-toggle-switch ${
                      notifWeeklySummaryEmail ? "active" : ""
                    }`}
                    onClick={() => {
                      const next = !notifWeeklySummaryEmail;
                      setNotifWeeklySummaryEmail(next);
                      showToast(
                        `Weekly summary report ${next ? "enabled" : "disabled"}.`
                      );
                    }}
                    aria-label="Toggle weekly summary report"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Section 2: In-App Notifications */}
              <div className="notif-section-title notif-section-spaced">
                IN-APP NOTIFICATIONS
              </div>

              <div className="settings-row">
                <div className="settings-label-group">
                  <div className="settings-label">Desktop notifications</div>
                  <div className="settings-sublabel">
                    Show browser notifications when StockFlow is in the background
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifDesktopInApp}
                    className={`settings-toggle-switch ${
                      notifDesktopInApp ? "active" : ""
                    }`}
                    onClick={() => handleToggleDesktop(!notifDesktopInApp)}
                    aria-label="Toggle desktop notifications"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="settings-row no-border">
                <div className="settings-label-group">
                  <div className="settings-label">Sound alerts</div>
                  <div className="settings-sublabel">
                    Play a sound for urgent alerts, like a rejected request
                  </div>
                </div>
                <div className="settings-control">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifSoundInApp}
                    className={`settings-toggle-switch ${
                      notifSoundInApp ? "active" : ""
                    }`}
                    onClick={() => handleToggleSound(!notifSoundInApp)}
                    aria-label="Toggle sound alerts"
                  >
                    <span className="settings-toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="security-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div className="security-modal-dialog">
            <h3 className="security-modal-title">Change Password</h3>
            <p className="security-modal-desc">
              Enter your current password and choose a new, strong password.
            </p>
            <div className="security-modal-fields">
              <div>
                <label className="edit-profile-label">Current password</label>
                <input
                  type="password"
                  className="edit-profile-input"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="edit-profile-label">New password</label>
                <input
                  type="password"
                  className="edit-profile-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="edit-profile-label">Confirm new password</label>
                <input
                  type="password"
                  className="edit-profile-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <div className="security-modal-actions">
              <button
                type="button"
                className="edit-profile-cancel-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-profile-save-btn"
                onClick={handleSavePassword}
              >
                Update password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div
          className="security-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShow2FAModal(false);
          }}
        >
          <div className="security-modal-dialog">
            <h3 className="security-modal-title">Set up Two-Factor Authentication</h3>
            <p className="security-modal-desc">
              Scan this QR code with Google Authenticator, 1Password, or Authy, then enter the 6-digit code.
            </p>
            <div style={{ textAlign: "center", margin: "16px 0" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "14px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="28" height="28" fill="#111827" />
                  <rect x="14" y="14" width="20" height="20" fill="#ffffff" />
                  <rect x="18" y="18" width="12" height="12" fill="#111827" />
                  <rect x="62" y="10" width="28" height="28" fill="#111827" />
                  <rect x="66" y="14" width="20" height="20" fill="#ffffff" />
                  <rect x="70" y="18" width="12" height="12" fill="#111827" />
                  <rect x="10" y="62" width="28" height="28" fill="#111827" />
                  <rect x="14" y="66" width="20" height="20" fill="#ffffff" />
                  <rect x="18" y="70" width="12" height="12" fill="#111827" />
                  <rect x="44" y="12" width="8" height="8" fill="#111827" />
                  <rect x="44" y="26" width="8" height="8" fill="#111827" />
                  <rect x="44" y="44" width="12" height="12" fill="#6320ee" />
                  <rect x="62" y="44" width="8" height="14" fill="#111827" />
                  <rect x="76" y="44" width="14" height="8" fill="#111827" />
                  <rect x="44" y="62" width="8" height="14" fill="#111827" />
                  <rect x="62" y="68" width="12" height="8" fill="#111827" />
                  <rect x="78" y="62" width="12" height="28" fill="#111827" />
                </svg>
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "11.5px",
                  fontFamily: "monospace",
                  color: "#6b7280",
                  letterSpacing: "1px",
                }}
              >
                STCK - FLOW - 9204 - 1827
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="edit-profile-label">6-digit verification code</label>
              <input
                type="text"
                maxLength={6}
                className="edit-profile-input"
                style={{
                  textAlign: "center",
                  fontSize: "18px",
                  letterSpacing: "6px",
                  fontWeight: 600,
                }}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
            </div>
            <div className="security-modal-actions">
              <button
                type="button"
                className="edit-profile-cancel-btn"
                onClick={() => setShow2FAModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-profile-save-btn"
                onClick={handleVerifyAndEnable2FA}
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div
          className="security-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpgradeModal(false);
          }}
        >
          <div className="security-modal-dialog" style={{ maxWidth: 560 }}>
            <h3 className="security-modal-title">Select a Plan</h3>
            <p className="security-modal-desc">
              Scale your inventory capacity and multi-warehouse operations.
            </p>
            <div className="plan-cards-grid">
              <div
                className={`plan-option-card ${
                  selectedPlanTier === "starter" ? "selected" : ""
                }`}
                onClick={() => setSelectedPlanTier("starter")}
              >
                <div className="plan-option-name">Starter</div>
                <div className="plan-option-price">$29/mo</div>
                <div className="plan-option-features">
                  100 SKUs<br />2 warehouses<br />3 users
                </div>
              </div>
              <div
                className={`plan-option-card ${
                  selectedPlanTier === "growth" ? "selected" : ""
                }`}
                onClick={() => setSelectedPlanTier("growth")}
              >
                <div className="plan-option-name">Growth</div>
                <div className="plan-option-price">$49/mo</div>
                <div className="plan-option-features">
                  500 SKUs<br />5 warehouses<br />Unlimited users
                </div>
              </div>
              <div
                className={`plan-option-card ${
                  selectedPlanTier === "enterprise" ? "selected" : ""
                }`}
                onClick={() => setSelectedPlanTier("enterprise")}
              >
                <div className="plan-option-name">Enterprise</div>
                <div className="plan-option-price">$99/mo</div>
                <div className="plan-option-features">
                  Unlimited SKUs<br />All warehouses<br />24/7 support
                </div>
              </div>
            </div>
            <div className="security-modal-actions">
              <button
                type="button"
                className="edit-profile-cancel-btn"
                onClick={() => setShowUpgradeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-profile-save-btn"
                onClick={() => handleSelectPlan(selectedPlanTier)}
              >
                Confirm Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Method Modal */}
      {showCardModal && (
        <div
          className="security-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCardModal(false);
          }}
        >
          <div className="security-modal-dialog">
            <h3 className="security-modal-title">Update Payment Method</h3>
            <p className="security-modal-desc">
              Enter your credit or debit card details for recurring billing.
            </p>
            <div className="security-modal-fields">
              <div>
                <label className="edit-profile-label">Cardholder name</label>
                <input
                  type="text"
                  className="edit-profile-input"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Visal Khem"
                />
              </div>
              <div>
                <label className="edit-profile-label">Card number</label>
                <input
                  type="text"
                  className="edit-profile-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="edit-profile-label">Expires</label>
                  <input
                    type="text"
                    className="edit-profile-input"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="edit-profile-label">CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="edit-profile-input"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
            <div className="security-modal-actions">
              <button
                type="button"
                className="edit-profile-cancel-btn"
                onClick={() => setShowCardModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-profile-save-btn"
                onClick={handleSaveCard}
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
