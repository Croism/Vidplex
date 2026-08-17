import './SettingsModal.css'

const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const FONTS = [
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'System UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'System UI' },
  { value: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'Inter' },
  { value: "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'Roboto' },
  { value: "'Open Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'Open Sans' },
  { value: "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'Montserrat' },
  { value: "'Lato', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: 'Lato' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: "'Georgia', serif", label: 'Georgia' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
]

const SettingsModal = ({
  isOpen,
  pendingSettings,
  setPendingSettings,
  onApply,
  onApplyDefaults,
  onDiscard,
}) => {
  if (!isOpen) return null

  const handleChange = (field, value) => {
    setPendingSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="settings-overlay" onClick={onDiscard}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-title">Settings</h2>

        <div className="settings-section">
          <label className="settings-label">Font size</label>
          <div className="settings-options">
            {FONT_SIZES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`settings-chip ${
                  pendingSettings.fontSize === opt.value ? 'active' : ''
                }`}
                onClick={() => handleChange('fontSize', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <label className="settings-label">Font</label>
          <select
            className="settings-select"
            value={pendingSettings.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-section">
          <label className="settings-label">Accent colour</label>
          <div className="settings-accent-row">
            <input
              type="color"
              className="settings-color"
              value={pendingSettings.accentColor}
              onChange={(e) => handleChange('accentColor', e.target.value)}
            />
            <input
              type="text"
              className="settings-color-input"
              value={pendingSettings.accentColor}
              onChange={(e) => {
                let v = e.target.value.trim()
                if (!v.startsWith('#')) v = `#${v}`
                // basic hex validation (#RGB or #RRGGBB)
                const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
                if (hexRegex.test(v)) {
                  handleChange('accentColor', v)
                } else {
                  // still update text so user can edit, but don't commit to settings
                  setPendingSettings((prev) => ({ ...prev, accentColor: v }))
                }
              }}
              maxLength={7}
            />
          </div>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn primary"
            onClick={onApply}
          >
            Apply Changes
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={onApplyDefaults}
          >
            Apply Default
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
