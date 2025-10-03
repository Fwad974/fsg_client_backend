import i18n from 'i18n'
import path from 'path'

i18n.configure({
  locales: ['en-US', 'ja-JP', 'fr-FR', 'pt-PT', 'es-ES', 'de-DE', 'en-GB'],
  defaultLocale: 'en-US',
  syncFiles: true,
  autoReload: true,
  directory: path.join(__dirname, '../locals'),
  objectNotation: false,
  header: 'accept-language'
})

export default i18n
