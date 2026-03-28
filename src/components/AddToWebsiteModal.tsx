import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ExternalLink, Copy, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AddToWebsiteModalProps {
  profileUrl: string;   // e.g. /u/uid
  displayName: string;
  onClose: () => void;
}

type EmbedType = 'inline' | 'popup-widget' | 'popup-text';

// ── Illustrations ────────────────────────────────────────────────────────────
const InlineIllustration = () => (
  <svg viewBox="0 0 160 110" className="w-full h-full" fill="none">
    <rect width="160" height="110" rx="6" fill="#f1f5f9"/>
    <rect x="8" y="8" width="60" height="6" rx="2" fill="#cbd5e1"/>
    <rect x="8" y="18" width="44" height="4" rx="2" fill="#e2e8f0"/>
    <rect x="8" y="26" width="50" height="4" rx="2" fill="#e2e8f0"/>
    <rect x="8" y="34" width="38" height="4" rx="2" fill="#e2e8f0"/>
    <rect x="80" y="8" width="72" height="94" rx="4" fill="#e2e8f0"/>
    {[0,1,2,3,4].map(row => [0,1,2,3,4,5].map(col => (
      <rect key={`${row}-${col}`} x={84 + col*11} y={14 + row*11} width="8" height="8" rx="2"
        fill={row === 2 && col >= 2 && col <= 4 ? '#3b82f6' : '#cbd5e1'}/>
    )))}
  </svg>
);

const PopupWidgetIllustration = () => (
  <svg viewBox="0 0 160 110" className="w-full h-full" fill="none">
    <rect width="160" height="110" rx="6" fill="#f1f5f9"/>
    <rect x="8" y="8" width="144" height="70" rx="4" fill="#e2e8f0"/>
    <rect x="16" y="16" width="80" height="6" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="26" width="60" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="34" width="70" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="44" width="50" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="90" y="82" width="52" height="20" rx="10" fill="#3b82f6"/>
    <rect x="98" y="89" width="36" height="6" rx="2" fill="white" opacity="0.8"/>
  </svg>
);

const PopupTextIllustration = () => (
  <svg viewBox="0 0 160 110" className="w-full h-full" fill="none">
    <rect width="160" height="110" rx="6" fill="#f1f5f9"/>
    <rect x="8" y="8" width="144" height="94" rx="4" fill="#e2e8f0"/>
    <rect x="16" y="16" width="80" height="6" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="26" width="60" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="34" width="70" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="44" width="50" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="56" width="90" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="16" y="68" width="60" height="4" rx="2" fill="#3b82f6"/>
  </svg>
);

const EMBED_TYPES: { id: EmbedType; label: string; desc: string; Illustration: React.FC }[] = [
  { id: 'inline',       label: 'Inline embed',    desc: 'Add a scheduling page to your site',      Illustration: InlineIllustration },
  { id: 'popup-widget', label: 'Popup widget',     desc: 'Add a floating button that opens a popup', Illustration: PopupWidgetIllustration },
  { id: 'popup-text',   label: 'Popup text',       desc: 'Add a text link that opens a popup',       Illustration: PopupTextIllustration },
];

// ── Settings + Code step ─────────────────────────────────────────────────────
interface EmbedSettings {
  hidePageDetails: boolean;
  hideCookieBanner: boolean;
  bgColor: string;
  textColor: string;
  btnColor: string;
  // popup-widget specific
  btnText: string;
  btnPosition: 'bottom-right' | 'bottom-left';
  // popup-text specific
  linkText: string;
}

function generateCode(type: EmbedType, url: string, s: EmbedSettings): string {
  const dataUrl = `${window.location.origin}${url}`;
  const params = new URLSearchParams();
  if (s.hidePageDetails) params.set('hide_event_type_details', '1');
  if (s.hideCookieBanner) params.set('hide_gdpr_banner', '1');
  if (s.bgColor !== '#ffffff') params.set('background_color', s.bgColor.replace('#', ''));
  if (s.textColor !== '#000000') params.set('text_color', s.textColor.replace('#', ''));
  if (s.btnColor !== '#006BFF') params.set('primary_color', s.btnColor.replace('#', ''));
  const qs = params.toString();
  const fullUrl = qs ? `${dataUrl}?${qs}` : dataUrl;

  if (type === 'inline') {
    return `<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget"
  data-url="${fullUrl}"
  style="min-width:320px;height:700px;"></div>
<script type="text/javascript"
  src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->`;
  }
  if (type === 'popup-widget') {
    return `<!-- Calendly badge widget begin -->
<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
<script type="text/javascript">
  window.onload = function() {
    Calendly.initBadgeWidget({
      url: '${fullUrl}',
      text: '${s.btnText}',
      color: '${s.btnColor}',
      textColor: '#ffffff',
      branding: false
    });
  }
</script>
<!-- Calendly badge widget end -->`;
  }
  // popup-text
  return `<!-- Calendly link widget begin -->
<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
<a href="" onclick="Calendly.initPopupWidget({url: '${fullUrl}'});return false;">${s.linkText}</a>
<!-- Calendly link widget end -->`;
}

const ColorPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-[14px] text-gray-700">{label}</span>
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="w-8 h-8 rounded border border-gray-300 shadow-sm" style={{ background: value }} />
      <ChevronDown className="w-4 h-4 text-gray-400" />
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
    </label>
  </div>
);

// ── Main modal ───────────────────────────────────────────────────────────────
const AddToWebsiteModal: React.FC<AddToWebsiteModalProps> = ({ profileUrl, displayName, onClose }) => {
  const [step, setStep] = useState<'pick' | 'configure'>('pick');
  const [selected, setSelected] = useState<EmbedType | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<EmbedSettings>({
    hidePageDetails: false,
    hideCookieBanner: false,
    bgColor: '#ffffff',
    textColor: '#000000',
    btnColor: '#006BFF',
    btnText: 'Schedule time with me',
    btnPosition: 'bottom-right',
    linkText: 'Schedule time with me',
  });

  const code = useMemo(() => {
    if (!selected) return '';
    return generateCode(selected, profileUrl, settings);
  }, [selected, profileUrl, settings]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (patch: Partial<EmbedSettings>) => setSettings(prev => ({ ...prev, ...patch }));

  const selectedMeta = EMBED_TYPES.find(t => t.id === selected);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[22px] font-bold text-[#0f1f3d]">Add to website</h2>
            <p className="text-[14px] text-gray-500 mt-0.5">{displayName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'pick' && (
            <div className="px-8 py-8">
              <p className="text-[15px] text-gray-600 mb-8">How do you want to add Calendly to your site?</p>
              <div className="grid grid-cols-3 gap-5 mb-8">
                {EMBED_TYPES.map(({ id, label, desc, Illustration }) => (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    className={cn(
                      "flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all",
                      selected === id ? "border-[#006BFF] shadow-md" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="h-[130px] p-3 bg-gray-50">
                      <Illustration />
                    </div>
                    <div className="p-4">
                      <p className="text-[15px] font-bold text-[#0f1f3d] mb-1">{label}</p>
                      <p className="text-[13px] text-gray-500 leading-snug">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <a href="#" className="flex items-center gap-1.5 text-[14px] text-[#006BFF] hover:underline font-medium">
                See how members use Calendly on their sites. <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {step === 'configure' && selected && (
            <div className="flex h-full min-h-[480px]">
              {/* Left: settings */}
              <div className="w-[340px] border-r border-gray-100 px-7 py-6 shrink-0 overflow-y-auto">
                {/* Type switcher */}
                <div className="relative mb-6">
                  <button
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="flex items-center gap-1.5 text-[16px] font-bold text-[#0f1f3d] hover:text-[#006BFF] transition-colors"
                  >
                    {selectedMeta?.label} <ChevronDown className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-10 w-48"
                      >
                        {EMBED_TYPES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setSelected(t.id); setShowTypeDropdown(false); }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-[14px] hover:bg-gray-50 transition-colors",
                              selected === t.id ? "text-[#006BFF] font-bold" : "text-gray-700"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-[15px] font-bold text-[#0f1f3d] mb-1">Booking Page Settings</p>
                <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                  Customize the look of your booking page to fit seamlessly into your website.
                </p>

                {/* Inline-specific settings */}
                {selected === 'inline' && (
                  <>
                    <label className="flex items-center gap-3 mb-4 cursor-pointer">
                      <input type="checkbox" checked={settings.hidePageDetails}
                        onChange={e => set({ hidePageDetails: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF]" />
                      <span className="text-[14px] text-gray-700 flex items-center gap-1.5">
                        Hide Page Details <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </label>
                    <label className="flex items-center gap-3 mb-6 cursor-pointer">
                      <input type="checkbox" checked={settings.hideCookieBanner}
                        onChange={e => set({ hideCookieBanner: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF]" />
                      <span className="text-[14px] text-gray-700 flex items-center gap-1.5">
                        Hide Cookie Banner <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </label>
                    <ColorPicker label="Background Color" value={settings.bgColor} onChange={v => set({ bgColor: v })} />
                    <ColorPicker label="Text Color" value={settings.textColor} onChange={v => set({ textColor: v })} />
                    <ColorPicker label="Button & Link Color" value={settings.btnColor} onChange={v => set({ btnColor: v })} />
                  </>
                )}

                {/* Popup widget settings */}
                {selected === 'popup-widget' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Button Text</label>
                      <input
                        type="text"
                        value={settings.btnText}
                        onChange={e => set({ btnText: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#006BFF]"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Button Position</label>
                      <div className="flex gap-3">
                        {(['bottom-right', 'bottom-left'] as const).map(pos => (
                          <button
                            key={pos}
                            onClick={() => set({ btnPosition: pos })}
                            className={cn(
                              "flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors",
                              settings.btnPosition === pos
                                ? "border-[#006BFF] text-[#006BFF] bg-[#eef5ff]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {pos === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ColorPicker label="Button Color" value={settings.btnColor} onChange={v => set({ btnColor: v })} />
                    <label className="flex items-center gap-3 mt-4 cursor-pointer">
                      <input type="checkbox" checked={settings.hidePageDetails}
                        onChange={e => set({ hidePageDetails: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF]" />
                      <span className="text-[14px] text-gray-700">Hide Page Details</span>
                    </label>
                  </>
                )}

                {/* Popup text settings */}
                {selected === 'popup-text' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Link Text</label>
                      <input
                        type="text"
                        value={settings.linkText}
                        onChange={e => set({ linkText: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#006BFF]"
                      />
                    </div>
                    <ColorPicker label="Link Color" value={settings.btnColor} onChange={v => set({ btnColor: v })} />
                    <label className="flex items-center gap-3 mt-4 cursor-pointer">
                      <input type="checkbox" checked={settings.hidePageDetails}
                        onChange={e => set({ hidePageDetails: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#006BFF] focus:ring-[#006BFF]" />
                      <span className="text-[14px] text-gray-700">Hide Page Details</span>
                    </label>
                  </>
                )}
              </div>

              {/* Right: code */}
              <div className="flex-1 px-7 py-6 overflow-y-auto">
                <p className="text-[15px] font-bold text-[#0f1f3d] mb-2">Embed Code</p>
                <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
                  Place this code in your HTML where you want your Calendly widget to appear.
                </p>
                <textarea
                  readOnly
                  value={code}
                  className="w-full h-[220px] px-4 py-3 border-2 border-dashed border-[#006BFF]/40 rounded-xl text-[12px] font-mono text-gray-700 bg-gray-50 outline-none resize-none leading-relaxed"
                />
                <p className="text-[13px] text-gray-500 mt-4 leading-relaxed">
                  Need help? See our guides for embedding Calendly on{' '}
                  {['Wix', 'Squarespace', 'WordPress'].map((s, i) => (
                    <span key={s}><a href="#" className="text-[#006BFF] hover:underline">{s}</a>{i < 2 ? ', ' : ''}</span>
                  ))}, check our{' '}
                  <a href="#" className="text-[#006BFF] hover:underline">common questions</a>, or explore{' '}
                  <a href="#" className="text-[#006BFF] hover:underline">advanced embed options</a>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-[14px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          {step === 'pick' ? (
            <button
              onClick={() => selected && setStep('configure')}
              disabled={!selected}
              className={cn(
                "px-8 py-2.5 rounded-full text-[14px] font-bold transition-all",
                selected ? "bg-[#006BFF] text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full text-[14px] font-bold bg-[#006BFF] text-white hover:bg-blue-700 transition-colors"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddToWebsiteModal;
