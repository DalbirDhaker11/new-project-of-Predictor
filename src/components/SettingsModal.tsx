import React from "react";
import { X, Settings, Moon, Sun, Type, Languages, ChevronDown, Palette, Check, Image as ImageIcon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    theme: string;
    accent: string;
    language: string;
    font: string;
    fontSize: string;
    backgroundImage: string;
  };
  setSettings: (settings: any) => void;
}

const ACCENT_OPTIONS: { value: string; label: string; swatch: string }[] = [
  { value: "emerald", label: "Sage", swatch: "#5e6657" },
  { value: "slate", label: "Slate", swatch: "#475569" },
  { value: "coral", label: "Coral", swatch: "#d97757" },
  { value: "midnight", label: "Midnight", swatch: "#3f4a82" },
  { value: "trendex", label: "Trendex", swatch: "#2f80ed" },
  { value: "sage-hr", label: "Sage HR", swatch: "#12924a" },
];

const BACKGROUND_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "None (solid color)" },
  { value: "skyline", label: "City Skyline" },
  { value: "ai", label: "AI Tech" },
  { value: "layoffs", label: "HR Layoffs" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--c1)] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-6 border border-[var(--c4)]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-[var(--c18)] flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--c3)] rounded-full">
            <X className="h-5 w-5 text-[var(--c13)]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Color Theme (accent) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              <Palette className="h-4 w-4" />
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((opt) => {
                const isActive = (settings.accent || "emerald") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, accent: opt.value })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                      isActive ? "border-[var(--c16)] bg-[var(--c3)]" : "border-transparent hover:bg-[var(--c3)]/60"
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: opt.swatch }}
                    >
                      {isActive && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--c16)]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Image */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              <ImageIcon className="h-4 w-4" />
              Background
            </label>
            <select
              value={settings.backgroundImage || "none"}
              onChange={(e) => setSettings({ ...settings, backgroundImage: e.target.value })}
              className="bg-[var(--c2)] text-[var(--c18)] p-2 rounded-xl text-xs font-bold"
            >
              {BACKGROUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Theme (Light/Dark) */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              {settings.theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Light / Dark
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="bg-[var(--c2)] text-[var(--c18)] p-2 rounded-xl text-xs font-bold"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Language */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              <Languages className="h-4 w-4" />
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="bg-[var(--c2)] text-[var(--c18)] p-2 rounded-xl text-xs font-bold"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Font */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              <Type className="h-4 w-4" />
              Font
            </label>
            <select
              value={settings.font}
              onChange={(e) => setSettings({ ...settings, font: e.target.value })}
              className="bg-[var(--c2)] text-[var(--c18)] p-2 rounded-xl text-xs font-bold"
            >
              <option value="sans">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="rounded">Rounded</option>
              <option value="condensed">Condensed</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2 text-[var(--c16)]">
              <Type className="h-4 w-4" />
              Font Size
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
              className="bg-[var(--c2)] text-[var(--c18)] p-2 rounded-xl text-xs font-bold"
            >
              <option value="sm">Small</option>
              <option value="base">Normal</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
