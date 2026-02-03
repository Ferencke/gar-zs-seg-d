import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  uploadBackup,
  downloadBackup,
  listBackupFiles,
  getLatestBackup,
  validateConfig,
  parseServiceAccountKey,
} from '@/services/googleDrive';

interface DriveSettings {
  folderId: string;
  serviceAccountKeyJson: string;
  lastSyncAt?: string;
}

const defaultSettings: DriveSettings = {
  folderId: '',
  serviceAccountKeyJson: '',
};

export function useGoogleDrive() {
  const [settings, setSettings] = useLocalStorage<DriveSettings>('garage-drive-settings', defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = Boolean(settings.folderId && settings.serviceAccountKeyJson);

  const getConfig = useCallback(() => {
    const serviceAccountKey = parseServiceAccountKey(settings.serviceAccountKeyJson);
    if (!serviceAccountKey || !settings.folderId) {
      return null;
    }
    return {
      serviceAccountKey,
      folderId: settings.folderId,
    };
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<DriveSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const clearSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      if (!config) {
        setError('Hiányzó konfiguráció');
        return false;
      }
      const isValid = await validateConfig(config);
      if (!isValid) {
        setError('A kapcsolat sikertelen. Ellenőrizd a beállításokat.');
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  const exportToCloud = useCallback(async (data: object): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      if (!config) {
        setError('Hiányzó konfiguráció');
        return false;
      }
      await uploadBackup(config, data);
      setSettings(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feltöltési hiba');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig, setSettings]);

  const importFromCloud = useCallback(async (): Promise<object | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      if (!config) {
        setError('Hiányzó konfiguráció');
        return null;
      }
      const latestFile = await getLatestBackup(config);
      if (!latestFile) {
        setError('Nincs elérhető biztonsági mentés');
        return null;
      }
      const data = await downloadBackup(config, latestFile.id);
      setSettings(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Letöltési hiba');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig, setSettings]);

  const listCloudBackups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      if (!config) {
        setError('Hiányzó konfiguráció');
        return [];
      }
      return await listBackupFiles(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Listázási hiba');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  const importSpecificBackup = useCallback(async (fileId: string): Promise<object | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      if (!config) {
        setError('Hiányzó konfiguráció');
        return null;
      }
      const data = await downloadBackup(config, fileId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Letöltési hiba');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  return {
    settings,
    isConfigured,
    isLoading,
    error,
    updateSettings,
    clearSettings,
    testConnection,
    exportToCloud,
    importFromCloud,
    listCloudBackups,
    importSpecificBackup,
  };
}
