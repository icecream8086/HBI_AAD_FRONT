import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import type { Language } from 'element-plus/es/locale'

const LANG_KEY = 'language'

function detectLang(): string {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved) return saved
  return navigator.language?.startsWith('zh') ? 'zh-CN' : 'en'
}

function getElLocale(lang: string): Language {
  return lang === 'zh-CN' ? zhCn : en
}

const savedLang = detectLang()
export const elLocale = ref<Language>(getElLocale(savedLang))

export const LANG_OPTIONS = [
  { id: 'zh-CN', label: '简体中文' },
  { id: 'en', label: 'English' },
]

export function useLocale() {
  const { locale, t } = useI18n()

  function setLang(lang: string) {
    locale.value = lang
    elLocale.value = getElLocale(lang)
    localStorage.setItem(LANG_KEY, lang)
  }

  function toggleLang() {
    if (locale.value === 'zh-CN') {
      setLang('en')
    } else {
      setLang('zh-CN')
    }
  }

  return { locale, setLang, toggleLang, t }
}
