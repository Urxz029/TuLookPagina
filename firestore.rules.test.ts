/**
 * Phase 0 Security Test Specification for TU LOOK Firestore Firewall Rules.
 * Verifies the "Dirty Dozen" adversarial payloads against the Eight Pillars.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  path: string;
  operation: 'create' | 'get' | 'list' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Shadow PII field injection on communityListings create',
    path: '/communityListings/lst-001',
    operation: 'create',
    payload: {
      ownerUid: 'userA',
      authorName: 'Ana',
      title: 'Chaqueta lino',
      category: 'abrigos',
      zone: 'Providencia',
      exchangeType: 'Intercambio',
      size: 'M',
      condition: 'Como nueva',
      status: 'available',
      requestedByUid: '',
      contactPhone: '+56912345678',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email admin spoofing on accessRequests list',
    path: '/accessRequests',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Owner UID spoofing on communityListings create',
    path: '/communityListings/lst-002',
    operation: 'create',
    payload: { ownerUid: 'userB', title: 'Blazer' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-user PII profile read',
    path: '/users/userB',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unauthorized list scraping on accessRequests',
    path: '/accessRequests',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Malformed document ID poisoning on communityListings',
    path: '/communityListings/bad$id*!',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Oversized title Denial-of-Wallet payload',
    path: '/communityListings/lst-003',
    operation: 'create',
    payload: { title: 'x'.repeat(2000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged client timestamp instead of server request.time',
    path: '/communityListings/lst-004',
    operation: 'create',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable zone mutation during community request action',
    path: '/communityListings/lst-005',
    operation: 'update',
    payload: { status: 'requested', zone: 'OtraZona' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Overwriting already-requested listing by third party',
    path: '/communityListings/lst-requested',
    operation: 'update',
    payload: { status: 'requested', requestedByUid: 'userC' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Update after terminal completed state on communityListings',
    path: '/communityListings/lst-completed',
    operation: 'update',
    payload: { status: 'available' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-assigned admin privilege escalation',
    path: '/admins/userA',
    operation: 'create',
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
];
