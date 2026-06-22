<!-- # Firebase User Schema Documentation

## Overview
This document defines the user data structure for TerraVision application in Firebase Firestore.

---

## Collection: `users`

### Document Structure

```typescript
interface User {
  uid: string;                    // Firebase Auth UID (auto-generated)
  email: string;                  // User email (unique, from Auth)
  password?: string;              // Never store in Firestore (handled by Firebase Auth)
  profile: {
    firstName: string;            // First name
    lastName: string;             // Last name
    fullName: string;             // Computed: firstName + lastName
    role: string;                 // Urban Planner, Analyst, Admin, etc.
    bio?: string;                 // Optional bio/description
    location: {
      city: string;               // City name
      state?: string;             // State/Province
      country: string;            // Country
    };
    avatar?: string;              // Optional URL to profile image
    initials: string;             // Computed: First letter of firstName + lastName
  };
  account: {
    joinedAt: Timestamp;          // Account creation date
    lastLogin: Timestamp;         // Last login timestamp
    isEmailVerified: boolean;      // Email verification status
    isActive: boolean;            // Account active/deactivated flag
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';  // Theme preference
    notifications: {
      email: boolean;             // Email notifications enabled
      push: boolean;              // Push notifications enabled
      newsletter: boolean;        // Newsletter subscription
    };
    language: string;             // Language code (e.g., 'en', 'hi')
  };
  stats: {
    projectsCount: number;        // Number of projects created
    analysisCount: number;        // Number of analyses run
    lastActivityAt?: Timestamp;   // Last activity timestamp
  };
  metadata: {
    updatedAt: Timestamp;         // Last profile update
    createdAt: Timestamp;         // Account creation
    deviceInfo?: {
      lastDevice: string;         // Last device used
      platform: string;           // OS (web, mobile, etc.)
    };
  };
}
```

---

## Field Descriptions

### Authentication & Identity
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uid` | `string` | ✓ | Firebase Auth UID, used as document ID |
| `email` | `string` | ✓ | User email, unique, lowercase |

### Profile Information
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `profile.firstName` | `string` | ✓ | User's first name |
| `profile.lastName` | `string` | ✓ | User's last name |
| `profile.fullName` | `string` | ✓ | Concatenated first + last name |
| `profile.role` | `string` | ✓ | User role (predefined: Urban Planner, Analyst, Admin) |
| `profile.bio` | `string` | ✗ | Optional biography/description (max 500 chars) |
| `profile.location.city` | `string` | ✓ | City of operation |
| `profile.location.state` | `string` | ✗ | State/Province (optional) |
| `profile.location.country` | `string` | ✓ | Country code (ISO 3166-1) |
| `profile.avatar` | `string` | ✗ | HTTPS URL to profile image |
| `profile.initials` | `string` | ✓ | Computed from firstName/lastName |

### Account Status
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `account.joinedAt` | `Timestamp` | ✓ | Server timestamp of signup |
| `account.lastLogin` | `Timestamp` | ✓ | Server timestamp of last login |
| `account.isEmailVerified` | `boolean` | ✓ | Email verified (from Auth provider) |
| `account.isActive` | `boolean` | ✓ | Account active status |

### User Preferences
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `preferences.theme` | `'light' \| 'dark' \| 'system'` | ✓ | Default: 'system' |
| `preferences.notifications.email` | `boolean` | ✓ | Default: true |
| `preferences.notifications.push` | `boolean` | ✓ | Default: true |
| `preferences.notifications.newsletter` | `boolean` | ✓ | Default: false |
| `preferences.language` | `string` | ✓ | Default: 'en' |

### Statistics & Activity
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `stats.projectsCount` | `number` | ✓ | Incremented on project creation |
| `stats.analysisCount` | `number` | ✓ | Incremented on analysis run |
| `stats.lastActivityAt` | `Timestamp` | ✗ | Updated on any user action |

### Metadata
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `metadata.updatedAt` | `Timestamp` | ✓ | Server timestamp of last update |
| `metadata.createdAt` | `Timestamp` | ✓ | Server timestamp of creation |
| `metadata.deviceInfo.lastDevice` | `string` | ✗ | Last device identifier |
| `metadata.deviceInfo.platform` | `string` | ✗ | Platform (web, ios, android) |

---

## Example Document

```json
{
  "uid": "user_12345abc",
  "email": "aria.sharma@example.com",
  "profile": {
    "firstName": "Aria",
    "lastName": "Sharma",
    "fullName": "Aria Sharma",
    "role": "Urban Planner",
    "bio": "Passionate about sustainable cities, green infrastructure and community-driven planning.",
    "location": {
      "city": "New Delhi",
      "state": "Delhi",
      "country": "IN"
    },
    "avatar": "https://storage.googleapis.com/...",
    "initials": "AS"
  },
  "account": {
    "joinedAt": "2024-06-12T10:30:00Z",
    "lastLogin": "2025-02-01T14:22:00Z",
    "isEmailVerified": true,
    "isActive": true
  },
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "newsletter": false
    },
    "language": "en"
  },
  "stats": {
    "projectsCount": 8,
    "analysisCount": 23,
    "lastActivityAt": "2025-02-01T14:15:00Z"
  },
  "metadata": {
    "updatedAt": "2025-02-01T14:22:00Z",
    "createdAt": "2024-06-12T10:30:00Z",
    "deviceInfo": {
      "lastDevice": "chrome-windows",
      "platform": "web"
    }
  }
}
```

---

## Firebase Collection Rules

```
users/
├── {uid}/
│   ├── uid: string
│   ├── email: string
│   ├── profile: object
│   ├── account: object
│   ├── preferences: object
│   ├── stats: object
│   └── metadata: object
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      
      // Public profile data can be read by anyone
      allow get: if true;
    }
  }
}
```

---

## Firebase Auth Integration

### Sign-up Flow
1. Create user in Firebase Auth with email & password
2. After successful auth, create Firestore document with:
   - Auto-generated `uid` from Firebase Auth
   - Initial profile data
   - Default preferences
   - Timestamps for `joinedAt` and `createdAt`

### Login Flow
1. Authenticate via Firebase Auth
2. Fetch user profile from `users/{uid}`
3. Update `account.lastLogin` with current timestamp

### Profile Update
1. Update specific fields in `users/{uid}`
2. Update `metadata.updatedAt` on any change

---

## TypeScript Interface (for Frontend)

```typescript
interface UserProfile {
  uid: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    bio?: string;
    location: {
      city: string;
      state?: string;
      country: string;
    };
    avatar?: string;
    initials: string;
  };
  account: {
    joinedAt: any; // Firestore Timestamp
    lastLogin: any;
    isEmailVerified: boolean;
    isActive: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      newsletter: boolean;
    };
    language: string;
  };
  stats: {
    projectsCount: number;
    analysisCount: number;
    lastActivityAt?: any; // Firestore Timestamp
  };
  metadata: {
    updatedAt: any;
    createdAt: any;
    deviceInfo?: {
      lastDevice: string;
      platform: string;
    };
  };
}
```

---

## Validation Rules

- `email`: Must be valid email format (RFC 5322)
- `firstName` & `lastName`: 1-50 characters, no special chars
- `bio`: Max 500 characters
- `role`: One of predefined roles (enum)
- `location.country`: ISO 3166-1 alpha-2 code (2 chars)
- `theme`: One of ['light', 'dark', 'system']
- `language`: ISO 639-1 language code (e.g., 'en', 'hi')

---

## Indexing Recommendations

Create composite indexes for:
1. `email` (ascending) - for email lookups
2. `account.isActive` (ascending) - for active users query
3. `profile.role` (ascending) - for role-based queries
4. `metadata.createdAt` (descending) - for user listing

---

## Future Extensions

Consider adding for future features:
- `subscriptionInfo`: Tier, status, renewalDate
- `permissions`: Feature access flags
- `twoFactorAuth`: 2FA enabled status
- `socialLinks`: GitHub, LinkedIn, etc.
- `organizationId`: If adding multi-org support
 -->




{
  "id": "user_77a9f9c0",
  "email": "yash.planner@terravision.io",
  "account": {
    "isEmailVerified": true,
    "joinedAt": "2024-10-15T10:30:00Z",
    "lastLogin": "2026-02-01T12:00:00Z"
  },
  "preferences": {
    "language": "en",
    "theme": "dark" 
  },
  "profile": {
    "bio": "Urban planning lead.",
    "city": "New Delhi",
    "country": "IN",
    "firstName": "Yash",
    "lastName": "Sharma",
    "role": "Urban Planner",
    "state": "Delhi"
  }
}