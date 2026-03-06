//! Tray menu internationalization
//!
//! Everything is auto-generated at compile time by build.rs from the
//! frontend locale files (src/i18n/locales/*/translation.json).
//!
//! The English translation.json is the single source of truth:
//! - TrayStrings struct fields are derived from the English "tray" keys
//! - All languages are auto-discovered from the locales directory
//!
//! To add a new tray menu item:
//! 1. Add the key to en/translation.json under "tray"
//! 2. Add translations to other locale files
//! 3. Update tray.rs to use the new field (e.g., strings.new_field)

use once_cell::sync::Lazy;
use std::collections::HashMap;

// Include the auto-generated TrayStrings struct and TRANSLATIONS static
include!(concat!(env!("OUT_DIR"), "/tray_translations.rs"));

/// Get the language code from a locale string (e.g., "en-US" -> "en")
fn get_language_code(locale: &str) -> &str {
    locale.split(['-', '_']).next().unwrap_or("en")
}

/// Get localized tray menu strings based on the system locale
pub fn get_tray_translations(locale: Option<String>) -> TrayStrings {
    let lang = locale.as_deref().map(get_language_code).unwrap_or("en");

    // Try requested language, fall back to English
    TRANSLATIONS
        .get(lang)
        .or_else(|| TRANSLATIONS.get("en"))
        .cloned()
        .expect("English translations must exist")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_language_code_strips_region() {
        assert_eq!(get_language_code("en-US"), "en");
        assert_eq!(get_language_code("fr-FR"), "fr");
        assert_eq!(get_language_code("zh-TW"), "zh");
    }

    #[test]
    fn get_language_code_handles_underscore() {
        assert_eq!(get_language_code("pt_BR"), "pt");
    }

    #[test]
    fn get_language_code_returns_bare_code() {
        assert_eq!(get_language_code("en"), "en");
        assert_eq!(get_language_code("de"), "de");
    }

    #[test]
    fn get_language_code_empty_returns_empty() {
        // Empty input returns "" — the caller (get_tray_translations) handles
        // the fallback to English when the code misses in TRANSLATIONS.
        let code = get_language_code("");
        assert_eq!(code, "");
    }

    #[test]
    fn translations_none_returns_english() {
        let strings = get_tray_translations(None);
        // English quit should be "Quit"
        assert_eq!(strings.quit, "Quit");
    }

    #[test]
    fn translations_english_explicit() {
        let strings = get_tray_translations(Some("en".to_string()));
        assert_eq!(strings.quit, "Quit");
        assert!(!strings.settings.is_empty());
    }

    #[test]
    fn translations_with_region_code() {
        let strings = get_tray_translations(Some("en-US".to_string()));
        assert_eq!(strings.quit, "Quit");
    }

    #[test]
    fn translations_unknown_falls_back_to_english() {
        let strings = get_tray_translations(Some("xx-XX".to_string()));
        assert_eq!(strings.quit, "Quit");
    }

    #[test]
    fn translations_french_has_content() {
        let strings = get_tray_translations(Some("fr".to_string()));
        assert!(!strings.quit.is_empty());
        assert!(!strings.settings.is_empty());
    }

    #[test]
    fn translations_map_has_english() {
        assert!(TRANSLATIONS.contains_key("en"));
    }

    #[test]
    fn translations_map_has_multiple_languages() {
        // We expect at least 10 languages
        assert!(
            TRANSLATIONS.len() >= 10,
            "Expected at least 10 translation languages, found {}",
            TRANSLATIONS.len()
        );
    }
}
