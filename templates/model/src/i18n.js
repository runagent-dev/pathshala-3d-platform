// Every string the figure shows, in Bangla and English.

export const STRINGS = {
  bn: {
    title: '{{title}}',
    loading: 'মডেল আসছে…',
    load_error: 'মডেলটি খোলা গেল না।',
    hint_rotate: 'ঘুরিয়ে দেখতে টানো, বড় করতে দুই আঙুলে ছড়াও',
    reset_view: 'শুরুর অবস্থায় ফেরাও',
    fullscreen: 'পূর্ণ পর্দা',
  },
  en: {
    title: '{{title}}',
    loading: 'Loading the model…',
    load_error: 'The model could not be opened.',
    hint_rotate: 'Drag to turn it, pinch or scroll to zoom',
    reset_view: 'Back to the start view',
    fullscreen: 'Full screen',
  },
};

export function createI18n(lang = 'bn') {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const t = (key) => dict[key] ?? key;
  t.num = (x) => String(x);
  t.lang = code;
  return t;
}
