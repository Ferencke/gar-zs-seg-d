// Google Drive API Service with Service Account Authentication

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface DriveConfig {
  serviceAccountKey: ServiceAccountKey;
  folderId: string;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

// Convert PEM to ArrayBuffer for Web Crypto API
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Base64URL encode
function base64urlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create JWT for Google API authentication
async function createJWT(serviceAccountKey: ServiceAccountKey): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1 hour
    iat: now,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedClaims = base64urlEncode(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedClaims}`;

  // Import the private key
  const keyBuffer = pemToArrayBuffer(serviceAccountKey.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(signatureBuffer);
  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from Google
async function getAccessToken(serviceAccountKey: ServiceAccountKey): Promise<string> {
  const jwt = await createJWT(serviceAccountKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// List backup files in the folder
export async function listBackupFiles(config: DriveConfig): Promise<DriveFile[]> {
  const accessToken = await getAccessToken(config.serviceAccountKey);

  const query = `'${config.folderId}' in parents and name contains 'garage-backup' and mimeType='application/json' and trashed=false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list files: ${error}`);
  }

  const data = await response.json();
  return data.files || [];
}

// Upload backup to Google Drive
export async function uploadBackup(config: DriveConfig, data: object): Promise<DriveFile> {
  const accessToken = await getAccessToken(config.serviceAccountKey);
  const fileName = `garage-backup-${new Date().toISOString().split('T')[0]}.json`;
  const fileContent = JSON.stringify(data, null, 2);

  // Check if file with same name exists today
  const existingFiles = await listBackupFiles(config);
  const todayFile = existingFiles.find(f => f.name === fileName);

  if (todayFile) {
    // Update existing file
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${todayFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update file: ${error}`);
    }

    return await response.json();
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: fileName,
      parents: [config.folderId],
      mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file: ${error}`);
    }

    return await response.json();
  }
}

// Download backup from Google Drive
export async function downloadBackup(config: DriveConfig, fileId: string): Promise<object> {
  const accessToken = await getAccessToken(config.serviceAccountKey);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download file: ${error}`);
  }

  return await response.json();
}

// Get the latest backup file
export async function getLatestBackup(config: DriveConfig): Promise<DriveFile | null> {
  const files = await listBackupFiles(config);
  return files.length > 0 ? files[0] : null;
}

// Validate configuration by trying to list files
export async function validateConfig(config: DriveConfig): Promise<boolean> {
  try {
    await listBackupFiles(config);
    return true;
  } catch {
    return false;
  }
}

// Parse Service Account Key from JSON string
export function parseServiceAccountKey(jsonString: string): ServiceAccountKey | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (
      parsed.type === 'service_account' &&
      parsed.private_key &&
      parsed.client_email &&
      parsed.token_uri
    ) {
      return parsed as ServiceAccountKey;
    }
    return null;
  } catch {
    return null;
  }
}
