# Futuroute Firestore Security Specification

## 1. Data Invariants

1. **Identity Integrity**: Every document under `/users/{userId}/...` must enforce `request.auth != null`, `request.auth.token.email_verified == true`, `request.auth.uid == userId`, and incoming ownership fields (`uid` or `userId`) equal to `request.auth.uid`.
2. **PII Isolation**: User profiles containing `email` live strictly at `/users/{userId}` with `allow get, create, update, delete` restricted solely to `isOwner(userId)` or `isAdmin()`, and `allow list: if false;` to prevent user enumeration.
3. **Catalog Separation**: `/careers/{careerId}` is publicly readable (`allow get, list: if true;`), while writes (`create, update, delete`) are strictly gated behind `isAdmin()` (verified admin doc in `/admins/{uid}` or verified admin email `jaifray26csu290@ncuindia.edu` with `email_verified == true`).
4. **Master Gate**: Every task in `/users/{userId}/roadmaps/{roadmapId}/tasks/{taskId}` verifies parent `/users/{userId}/roadmaps/$(roadmapId)` exists via `exists()` on `create` and `update`.
5. **Temporal Integrity**: `createdAt == request.time` on `create` (immutable on `update`), and `updatedAt == request.time` on `create` and `update`.
6. **Strict Keys & Bounded Payloads**: Every validation helper checks `keys().hasAll(...)`, `keys().hasOnly(...)`, string `.size()` bounds, regex IDs (`^[a-zA-Z0-9_\\-]+$`), numeric range checks, and bounded arrays (`.size() <= MAX`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)

1. **Cross-User Profile Read/Write**: Signed in as `userA`, attempting `get` or `set` on `/users/userB`.
2. **Shadow Admin / Role Escalation**: Sending `{ uid: "userA", displayName: "A", isAdmin: true, role: "admin", ... }` to `/users/userA`.
3. **Unverified Email Spoofing**: Unverified user with token `email: "jaifray26csu290@ncuindia.edu", email_verified: false` attempting `create` on `/careers/hacked-career`.
4. **Non-Admin Catalog Tampering**: Verified regular user attempting `create`, `update`, or `delete` on `/careers/software-developer`.
5. **User Enumeration Query**: Signed-in user attempting `list` on `/users`.
6. **UID Spoofing on Subcollection**: `userA` attempting `create` on `/users/userA/saved_careers/software-developer` with `userId: "userB"`.
7. **Orphaned Roadmap Task**: `userA` attempting `create` on `/users/userA/roadmaps/nonexistent-rm/tasks/t1`.
8. **Immutable Timestamp Backdating**: `userA` updating `/users/userA` while modifying `createdAt` or `uid`.
9. **Client-Spoofed Server Timestamp**: `userA` creating `/users/userA/roadmaps/rm1` with `createdAt` set to a past client timestamp instead of `request.time`.
10. **Invalid Folder Enum Injection**: `userA` writing `folder: "admin_featured"` to `/users/userA/saved_careers/software-developer`.
11. **Oversized Array / Resource Poisoning**: `userA` writing 100+ items to `interests` or a 10KB string to `displayName` or `careerId`.
12. **Invalid Path ID Injection**: `userA` writing a document with ID `"bad$id/.."` or >128 chars.
