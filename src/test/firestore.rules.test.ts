import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RULES_PATH = path.resolve(process.cwd(), "firestore.rules");
const BLUEPRINT_PATH = path.resolve(process.cwd(), "firebase-blueprint.json");

describe("Firestore Security Rules & Dirty Dozen Invariants", () => {
  const rules = fs.readFileSync(RULES_PATH, "utf8");
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8")) as {
    firestore: Record<string, unknown>;
    entities: Record<string, unknown>;
  };

  it("enforces rules_version 2 and default-deny global safety net first", () => {
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toContain("match /{document=**} {\n      allow read, write: if false;\n    }");
  });

  it("covers every collection declared in firebase-blueprint.json", () => {
    const expectedPaths = [
      "/careers/{careerId}",
      "/users/{userId}",
      "/users/{userId}/saved_careers/{careerId}",
      "/users/{userId}/assessments/{assessmentId}",
      "/users/{userId}/comparisons/{comparisonId}",
      "/users/{userId}/roadmaps/{roadmapId}",
      "/users/{userId}/roadmaps/{roadmapId}/tasks/{taskId}",
      "/users/{userId}/learning_plans/{planId}",
      "/users/{userId}/challenges/{challengeId}",
      "/users/{userId}/saved_opportunities/{opportunityId}",
      "/users/{userId}/career_transitions/{transitionId}",
      "/users/{userId}/activity/{activityId}",
    ];
    for (const p of expectedPaths) {
      expect(blueprint.firestore[p]).toBeDefined();
    }
    expect(rules).toContain("match /careers/{careerId}");
    expect(rules).toContain("match /users/{userId}");
    expect(rules).toContain("match /saved_careers/{careerId}");
    expect(rules).toContain("match /assessments/{assessmentId}");
    expect(rules).toContain("match /comparisons/{comparisonId}");
    expect(rules).toContain("match /roadmaps/{roadmapId}");
    expect(rules).toContain("match /tasks/{taskId}");
    expect(rules).toContain("data.phase >= 1 && data.phase <= 5");
    expect(rules).toContain("match /learning_plans/{planId}");
    expect(rules).toContain("match /challenges/{challengeId}");
    expect(rules).toContain("match /saved_opportunities/{opportunityId}");
    expect(rules).toContain("match /career_transitions/{transitionId}");
    expect(rules).toContain("match /activity/{activityId}");
    expect(rules).toContain("'note'");
  });

  it("Dirty Dozen 1-5: prevents user enumeration, PII leaks, unverified email spoofing, and shadow admin writes", () => {
    // User enumeration disabled
    expect(rules).toContain("allow list: if false;");
    // Email verification mandatory for owner/admin
    expect(rules).toContain("request.auth.token.email_verified == true");
    // User profile restricted to owner/admin
    expect(rules).toContain("allow get: if isValidId(userId) && (isOwner(userId) || isAdmin());");
    // Catalog writes strictly gated behind isAdmin()
    expect(rules).toContain("allow create: if isValidId(careerId) && isAdmin()");
    // Shadow fields blocked via hasOnly on users
    expect(rules).toContain("data.keys().hasOnly([");
  });

  it("Dirty Dozen 6-12: enforces owner UID matching, Master Gate on roadmap tasks, server timestamps, and regex IDs", () => {
    // Path variable regex guard
    expect(rules).toContain("id.matches('^[a-zA-Z0-9_\\\\-]+$')");
    // Master Gate on roadmap tasks
    expect(rules).toContain(
      "exists(/databases/$(database)/documents/users/$(userId)/roadmaps/$(roadmapId))",
    );
    // Server time checks
    expect(rules).toContain("incoming().createdAt == request.time");
    expect(rules).toContain("incoming().updatedAt == request.time");
    // Immutable owner/createdAt on update
    expect(rules).toContain("incoming().uid == existing().uid");
    expect(rules).toContain("incoming().createdAt == existing().createdAt");
    // Saved folder enum strictly constrained
    expect(rules).toContain("data.folder in ['top', 'alternative', 'explore_later']");
    // No blanket allow list: if isSignedIn()
    expect(rules).not.toMatch(/allow list:\s*if\s*isSignedIn\(\)\s*;/);
  });
});
