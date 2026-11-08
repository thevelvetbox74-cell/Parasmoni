/**
 * Lightweight REST client for public Firestore catalogue queries.
 * Replaces the heavy Firebase JS SDK for public reads, keeping first-load JS payload under 90 KB.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as Record<string, string | undefined>;

function getFirebaseCredentials() {
  let projectId = env.VITE_FIREBASE_PROJECT_ID || '';
  let apiKey = env.VITE_FIREBASE_API_KEY || '';

  if (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__) {
    projectId = (window as any).__FIREBASE_CONFIG__.projectId || projectId;
    apiKey = (window as any).__FIREBASE_CONFIG__.apiKey || apiKey;
  }

  return { projectId, apiKey };
}

export function decodeValue(valObj: any): any {
  if (!valObj || typeof valObj !== 'object') return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('integerValue' in valObj) return Number(valObj.integerValue);
  if ('doubleValue' in valObj) return Number(valObj.doubleValue);
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('nullValue' in valObj) return null;
  if ('timestampValue' in valObj) {
    const iso = valObj.timestampValue;
    const date = new Date(iso);
    const ms = date.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1000000,
      toDate: () => date,
      toMillis: () => ms,
    };
  }
  if ('arrayValue' in valObj) {
    const values = valObj.arrayValue?.values || [];
    return values.map((item: any) => decodeValue(item));
  }
  if ('mapValue' in valObj) {
    const fields = valObj.mapValue?.fields || {};
    return decodeFields(fields);
  }
  if ('geoPointValue' in valObj) {
    return valObj.geoPointValue;
  }
  if ('referenceValue' in valObj) {
    return valObj.referenceValue;
  }
  return null;
}

export function decodeFields(fieldsObj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fieldsObj || typeof fieldsObj !== 'object') return result;

  for (const [key, val] of Object.entries(fieldsObj)) {
    result[key] = decodeValue(val);
  }
  return result;
}

export function decodeDocument(docObj: any): any {
  if (!docObj || !docObj.name) return null;
  const id = docObj.name.split('/').pop() || '';
  const fields = decodeFields(docObj.fields || {});
  return { id, ...fields };
}

export async function fetchCollectionRest<T = any>(
  collectionName: string,
  options?: {
    where?: Array<{ field: string; op: 'EQUAL' | 'GREATER_THAN' | 'LESS_THAN'; value: any }>;
    orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' };
    limit?: number;
  }
): Promise<T[]> {
  const { projectId, apiKey } = getFirebaseCredentials();
  if (!projectId || !apiKey) {
    throw new Error('Firebase REST API credentials unavailable');
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

  const structuredQuery: any = {
    from: [{ collectionId: collectionName }]
  };

  if (options?.where && options.where.length > 0) {
    const filters = options.where.map(w => ({
      fieldFilter: {
        field: { fieldPath: w.field },
        op: w.op,
        value: typeof w.value === 'boolean' ? { booleanValue: w.value } : { stringValue: String(w.value) }
      }
    }));
    structuredQuery.where = filters.length === 1 ? filters[0] : { compositeFilter: { op: 'AND', filters } };
  }

  if (options?.orderBy) {
    structuredQuery.orderBy = [{
      field: { fieldPath: options.orderBy.field },
      direction: options.orderBy.direction || 'ASCENDING'
    }];
  }

  if (options?.limit) {
    structuredQuery.limit = options.limit;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery })
  });

  if (!res.ok) {
    throw new Error(`Firestore REST API returned status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const docs = data
    .filter((item: any) => item.document)
    .map((item: any) => decodeDocument(item.document));

  return docs as T[];
}

export async function fetchDocumentRest<T = any>(docPath: string): Promise<T | null> {
  const { projectId, apiKey } = getFirebaseCredentials();
  if (!projectId || !apiKey) {
    throw new Error('Firebase REST API credentials unavailable');
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}?key=${apiKey}`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Firestore REST API returned status ${res.status}`);
  }

  const data = await res.json();
  return decodeDocument(data) as T;
}
