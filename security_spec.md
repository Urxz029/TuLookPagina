# Security Specification — TU LOOK Firestore Firewall

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false`).
2. **Owner Isolation (PII Protection)**: Documents under `/users/{userId}` and subcollection `wardrobe` contain user-specific data and PII (`email`). Only the authenticated owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) can read or write them.
3. **Community Zone Integrity & Zero PII**: `/communityListings/{listingId}` exposes only neighborhood zone, garment metadata, and public display alias (`authorName`), never `email`, `phone`, or exact street address. Only verified users can publish listings (`ownerUid == request.auth.uid`), request an available listing (`requestedByUid == request.auth.uid`), or update/delete their own listing. Completed exchanges are locked.
4. **Strict Intake Isolation**: `/accessRequests/{requestId}` contains visitor PII (`name`, `email`). Public visitors can only `create` strictly schema-validated documents with `status == 'pending'` and `recipientEmail == 'tulookoffve@gmail.com'`. Reading, listing, updating, or deleting `accessRequests` is restricted strictly to verified administrators.
5. **Privilege Escalation Block**: Users cannot write to `/admins/{adminId}` or inject shadow fields.
6. **Temporal Integrity & Terminal State Lock**: `createdAt == request.time` on create and immutable on update; `updatedAt == request.time`; terminal states (`archived`, `completed`) cannot be overwritten.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Ghost Field Injection**: Creating a `communityListing` with `{ contactPhone: "+56912345678" }`.
2. **Email Spoofing Admin Bypass**: Attempting to list `/accessRequests` with `email_verified == false`.
3. **Identity Spoofing on Community Listing**: User A creating a listing with `ownerUid: "userB"`.
4. **Cross-User PII Read**: Authenticated User A attempting `get` on `/users/userB`.
5. **Unauthorized List Scraping**: Non-admin attempting `list` on `/accessRequests`, or public attempting to scrape `completed` listings.
6. **Path ID Poisoning**: Creating `/communityListings/bad$id*!` with disallowed characters.
7. **Oversized String Exhaustion**: Submitting a 2,000-char `title` in `communityListings`.
8. **Fake Client Timestamp**: Submitting a backdated `createdAt` instead of `request.time`.
9. **Immutable Field Tampering**: Mutating `ownerUid` or `zone` during a `request` action on `communityListings`.
10. **Self-Request Hijack**: Owner requesting their own listing (`ownerUid == requestedByUid`) or overwriting another requester's claim when `status == 'requested'`.
11. **Terminal State Bypass**: Updating a `communityListing` after `status == 'completed'` or `accessRequest` after `status == 'archived'`.
12. **Privilege Escalation**: User A attempting to write `/admins/userA`.
