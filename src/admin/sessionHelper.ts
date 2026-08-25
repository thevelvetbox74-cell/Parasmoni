/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MockSession {
  email: string;
  name: string;
}

/**
 * Persists a simulated local administrator session for local workspace previewing.
 */
export function lockAdminSession(profile: MockSession): void {
  localStorage.setItem('parasmoni_mock_admin', JSON.stringify({
    email: profile.email,
    name: profile.name,
    authenticatedAt: new Date().toISOString()
  }));
}

/**
 * Destroys the simulated local administrator session.
 */
export function unlockAdminSession(): void {
  localStorage.removeItem('parasmoni_mock_admin');
}

/**
 * Retrieves the simulated local administrator session.
 */
export function getAdminSession(): MockSession | null {
  const data = localStorage.getItem('parasmoni_mock_admin');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.removeItem('parasmoni_mock_admin');
    return null;
  }
}
