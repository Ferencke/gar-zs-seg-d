import { useState, useEffect } from 'react';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  bankAccount: string;
  website?: string;
  logo?: string;
}

const defaultSettings: CompanySettings = {
  name: '',
  address: '',
  phone: '',
  email: '',
  taxNumber: '',
  bankAccount: '',
  website: '',
  logo: '',
};

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const stored = localStorage.getItem('companySettings');
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('companySettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return { settings, updateSettings, resetSettings };
}
