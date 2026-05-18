'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, Menu, Group, Text, Box } from '@mantine/core';
import { IconGlobe, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const languages = [
  { value: "en", label: "🇬🇧 English", nativeName: "English" },
  { value: "am", label: "🇪🇹 Amharic", nativeName: "አማርኛ" },
  { value: "om", label: "🇪🇹 Oromo", nativeName: "Afaan Oromoo" },
];

const updateMessages = {
  en: "Language updated to English",
  am: "ቋንቋ ወደ አማርኛ ተቀይሯል",
  om: "Afaan Oromootiin haaromfameera"
};

export default function LanguageFloatingButton() {
  const [currentLang, setCurrentLang] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine initial language from global app language or logged-in user preferences
    let initialLang = 'en';
    
    try {
      const globalLang = localStorage.getItem('app_language');
      if (globalLang) {
        initialLang = globalLang;
      } else {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          const userId = u._id || u.id;
          const prefs = localStorage.getItem(`user_preferences_${userId}`);
          if (prefs) {
            try {
              const parsedPrefs = JSON.parse(prefs);
              if (parsedPrefs && parsedPrefs.language) {
                initialLang = parsedPrefs.language;
              }
            } catch (err) {}
          }
        }
      }
    } catch (e) {
      console.error("Failed loading initial language:", e);
    }
    
    setCurrentLang(initialLang);
  }, []);

  // Listen to external changes (e.g. from the profile settings page form saving)
  useEffect(() => {
    const handleExternalLangChange = (event) => {
      const newLang = event.detail;
      if (newLang && newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };
    window.addEventListener('appLanguageChanged', handleExternalLangChange);
    return () => {
      window.removeEventListener('appLanguageChanged', handleExternalLangChange);
    };
  }, [currentLang]);

  if (!mounted) return null;

  const handleLanguageSelect = (langCode) => {
    if (langCode === currentLang) return;
    
    setCurrentLang(langCode);
    
    try {
      // 1. Save general app language in localStorage
      localStorage.setItem('app_language', langCode);

      // 2. Synchronize user-specific preference if logged in
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const userId = u._id || u.id;
        if (userId) {
          const prefsKey = `user_preferences_${userId}`;
          const currentPrefs = localStorage.getItem(prefsKey);
          let updatedPrefs = { language: langCode };
          if (currentPrefs) {
            try {
              updatedPrefs = { ...JSON.parse(currentPrefs), language: langCode };
            } catch (err) {}
          }
          localStorage.setItem(prefsKey, JSON.stringify(updatedPrefs));
        }
      }

      // 3. Dispatch global custom event so other components update dynamically
      window.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: langCode }));

      // 4. Update standard locale cookie for Next.js Middleware and Server Side Rendering
      document.cookie = `locale=${langCode}; path=/; max-age=31536000; SameSite=Lax`;

      // 5. Trigger a beautiful Mantine notification toast
      const selectedLang = languages.find(l => l.value === langCode);
      const flag = selectedLang ? selectedLang.label.split(' ')[0] : '🌐';
      notifications.show({
        title: flag + ' ' + (langCode === 'en' ? 'Language Synchronized' : 'ቋንቋ/Idioma'),
        message: updateMessages[langCode] || `Language set to ${langCode}`,
        color: 'blue',
        radius: 'md',
        style: {
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(47, 128, 237, 0.15)',
        }
      });

      // 6. Reload page with a 1000ms delay to let the toast render and show transitions
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Failed saving language preference:", error);
    }
  };

  const activeLangObj = languages.find(l => l.value === currentLang) || languages[0];
  const activeFlag = activeLangObj.label.split(' ')[0];

  return (
    <Menu position="top-end" offset={10} shadow="xl" width={200} radius="lg" transitionProps={{ transition: 'pop' }}>
      <Menu.Target>
        <ActionIcon
          variant="filled"
          radius="xl"
          size="lg"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
          }}
          sx={(theme) => ({
            backgroundColor: theme.colors.blue[6],
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: theme.colors.blue[7],
            },
          })}
        >
          <span style={{ fontSize: '15px', position: 'absolute', top: '-1px', left: '-1px' }}>
            {activeFlag}
          </span>
          <IconGlobe size={16} style={{ opacity: 0.15, position: 'absolute', bottom: '2px', right: '2px' }} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown
        style={{
          border: '1px solid rgba(47, 128, 237, 0.1)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Menu.Label>
          <Text size="xs" fw={800} c="blue" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Change Language
          </Text>
        </Menu.Label>
        
        {languages.map((lang) => {
          const isSelected = lang.value === currentLang;
          return (
            <Menu.Item
              key={lang.value}
              onClick={() => handleLanguageSelect(lang.value)}
              style={{
                borderRadius: '8px',
                margin: '2px 4px',
                transition: 'all 0.2s ease',
                backgroundColor: isSelected ? 'rgba(34, 139, 230, 0.08)' : 'transparent',
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Box>
                  <Text size="sm" fw={isSelected ? 750 : 500} c={isSelected ? "blue" : "dark"}>
                    {lang.label}
                  </Text>
                  <Text size="10px" c="dimmed" style={{ marginTop: '-2px' }}>
                    {lang.nativeName}
                  </Text>
                </Box>
                {isSelected && (
                  <IconCheck size={16} color="#228BE6" style={{ strokeWidth: 3 }} />
                )}
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
