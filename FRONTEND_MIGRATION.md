# Frontend Migration Guide - From Firebase to Backend API

This guide explains how to update the MediWise frontend to use the new PostgreSQL backend instead of Firebase for data operations.

---

## Overview

### What's Changing?

| Feature          | Before (Firebase)         | After (Backend API)             |
| ---------------- | ------------------------- | ------------------------------- |
| Medicine Cabinet | Firestore                 | PostgreSQL via `/api/cabinet`   |
| User Data        | Firebase Auth + Firestore | JWT + PostgreSQL                |
| Medicine Search  | Groq AI                   | Backend (DB first, AI fallback) |
| All Data         | Client-side operations    | Server-side operations          |

### What's NOT Changing?

- UI/UX remains the same
- Page components remain mostly the same
- Component structure remains the same

---

## Step 1: Remove Firebase Imports

### Before

```javascript
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
```

### After

```javascript
// No Firebase imports needed for data operations
// Keep auth imports if using Firebase for sign-in
```

---

## Step 2: Update Authentication

### Login/Register - Keep Firebase Auth OR Switch to Backend JWT

#### Option A: Keep Firebase Auth (Recommended for Easy Migration)

```javascript
// Still use Firebase for sign-in
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const result = await signInWithPopup(auth, googleProvider);
const firebaseToken = await result.user.getIdToken();

// Then use this to authenticate with backend
const response = await fetch("/api/auth/login-with-firebase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ firebaseToken }),
});

const { jwtToken } = await response.json();
localStorage.setItem("token", jwtToken);
```

#### Option B: Switch to Backend JWT (Cleaner)

```javascript
// Register
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password,
    name,
  }),
});

const { token, user } = await response.json();
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));

// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));
```

---

## Step 3: Update Cabinet Operations

### Get Cabinet

#### Before

```javascript
const q = query(collection(db, `medicines/${user.id}/items`));
const querySnapshot = await getDocs(q);
const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
```

#### After

```javascript
const token = localStorage.getItem("token");
const response = await fetch("/api/cabinet", {
  headers: { Authorization: `Bearer ${token}` },
});

const { medicines } = await response.json();
setMeds(medicines);
```

### Add Medicine

#### Before

```javascript
await addDoc(collection(db, `medicines/${user.id}/items`), {
  medicine_name: medicineName,
  added_at: Date.now(),
});
```

#### After

```javascript
const token = localStorage.getItem("token");
const response = await fetch("/api/cabinet", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    medicine_name: medicineName,
    dosage: dosage || "",
    notes: notes || "",
  }),
});

const { medicine } = await response.json();
```

### Delete Medicine

#### Before

```javascript
await deleteDoc(doc(db, `medicines/${user.id}/items`, medicineId));
```

#### After

```javascript
const token = localStorage.getItem("token");
const response = await fetch(`/api/cabinet/${medicineId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
```

### Update Medicine

#### Before

```javascript
// Not implemented in old version
```

#### After

```javascript
const token = localStorage.getItem("token");
const response = await fetch(`/api/cabinet/${medicineId}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    dosage: newDosage,
    notes: newNotes,
  }),
});
```

---

## Step 4: Update Medicine Search

The API endpoint is slightly different but functionality is the same:

### Before

```javascript
const response = await fetch(
  `https://backend.railway.app/api/search?q=${query}`,
);
const medicine = await response.json();
```

### After

```javascript
// Endpoint changed from /api/search to /api/medicine/search
const response = await fetch(
  `https://backend.railway.app/api/medicine/search?q=${query}`,
);
const medicine = await response.json();
```

**Response format is the same**, so minimal changes needed!

---

## Step 5: Update Component Examples

### MyCabinet.jsx

#### Before

```javascript
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
} from "firebase/firestore";

export default function MyCabinet({ user }) {
  const fetchCabinet = async () => {
    try {
      const q = query(collection(db, `medicines/${user.id}/items`));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeds(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, `medicines/${user.id}/items`), {
      medicine_name: newMed,
      added_at: Date.now(),
    });
    fetchCabinet();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, `medicines/${user.id}/items`, id));
    fetchCabinet();
  };
}
```

#### After

```javascript
export default function MyCabinet({ user }) {
  const fetchCabinet = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cabinet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { medicines } = await response.json();
      setMeds(medicines);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/cabinet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicine_name: newMed }),
      });
      fetchCabinet();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/cabinet/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCabinet();
    } catch (error) {
      console.error(error);
    }
  };
}
```

### MedicineSearch.jsx

#### Before

```javascript
import { db } from "../firebase";
import { collection, getDocs, query } from "firebase/firestore";

const response = await fetch(
  `https://backend.railway.app/api/search?q=${searchQuery}`,
);
// Check cabinet (Firebase)
const q = firestoreQuery(collection(db, `medicines/${user.id}/items`));
const snapshot = await getDocs(q);
```

#### After

```javascript
// Medicine search endpoint updated
const response = await fetch(
  `https://backend.railway.app/api/medicine/search?q=${searchQuery}`,
);

// If needed, check cabinet via API
const token = localStorage.getItem("token");
const cabinetResponse = await fetch("/api/cabinet", {
  headers: { Authorization: `Bearer ${token}` },
});
const { medicines } = await cabinetResponse.json();
```

### PrescriptionScan.jsx

#### Before

```javascript
import { db } from "../firebase";
import { collection, addDoc, getDocs, query } from "firebase/firestore";

const cabinetResponse = await fetch(`https://backend.railway.app/api/scan`, {
  method: "POST",
  body: JSON.stringify({ image: base64data }),
});

// Check if in cabinet (Firebase)
const q = query(collection(db, `medicines/${user.id}/items`));
const snapshot = await getDocs(q);
```

#### After

```javascript
// Scan endpoint is the same
const cabinetResponse = await fetch(`/api/scan`, {
  method: "POST",
  body: JSON.stringify({ image: base64data }),
});

// Check if in cabinet (API)
const token = localStorage.getItem("token");
const cabinetResponse = await fetch("/api/cabinet", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Step 6: Create API Helper Functions

Create a new file `src/api/client.js`:

```javascript
const API_BASE = process.env.REACT_APP_API_URL || "https://backend.railway.app";

const getToken = () => localStorage.getItem("token");

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API Error");
  }

  return response.json();
}

// Medicine API
export const medicineAPI = {
  search: (query) => apiCall(`/api/medicine/search?q=${query}`),
  suggestions: (query) => apiCall(`/api/medicine/suggestions?q=${query}`),
};

// Cabinet API
export const cabinetAPI = {
  get: () => apiCall("/api/cabinet"),
  add: (data) =>
    apiCall("/api/cabinet", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiCall(`/api/cabinet/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    apiCall(`/api/cabinet/${id}`, {
      method: "DELETE",
    }),
};

// Auth API
export const authAPI = {
  register: (data) =>
    apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Scan API
export const scanAPI = {
  upload: (image) =>
    apiCall("/api/scan", {
      method: "POST",
      body: JSON.stringify({ image }),
    }),
};

// Interaction API
export const interactionAPI = {
  check: (medicines) =>
    apiCall("/api/interactions", {
      method: "POST",
      body: JSON.stringify({ medicines }),
    }),
};
```

Then use it in components:

```javascript
import { cabinetAPI, medicineAPI } from "../api/client";

const meds = await cabinetAPI.get();
const medicine = await medicineAPI.search("Amoxicillin");
```

---

## Step 7: Update Environment Variables

Create `.env`:

```
REACT_APP_API_URL=https://backend.railway.app
```

---

## Step 8: Authentication State Management

If switching to backend JWT, update your auth state:

```javascript
// App.jsx
useEffect(() => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      setUser(user);
      // Token is valid, set in axios defaults or fetch headers
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
}, []);

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setUser(null);
};
```

---

## Testing Checklist

- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] Medicine search works and returns results
- [ ] Can add medicine to cabinet
- [ ] Can view cabinet
- [ ] Can delete medicine from cabinet
- [ ] Can check drug interactions
- [ ] Can scan prescriptions
- [ ] Token persists after refresh
- [ ] Logout clears token and user data

---

## Rollback Plan

If issues occur:

1. Keep the old code in a git branch
2. API endpoints are backward compatible
3. Old Firebase code can be restored if needed

---

## Support

For issues during migration:

1. Check browser console for errors
2. Check Network tab for API responses
3. Verify token is being sent with requests
4. Check backend logs on Railway
5. Ensure environment variables are set

---

**Migration Guide v1.0** | April 2026
