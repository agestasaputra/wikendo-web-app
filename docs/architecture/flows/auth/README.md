---
topic: auth
status: ready
related: [quota, layout-navigation, state-management, security]
code:
  - app/common/store/AuthStore.ts
  - app/common/composables/useSupabaseBrowser.ts
  - app/common/utils/authUser.ts
  - app/features/auth/LoginPage.vue
  - app/features/auth/RegisterPage.vue
  - app/features/auth/CheckEmailPage.vue
  - app/features/auth/composables/useGoogleSignIn.ts
  - app/features/auth/utils/redirect.ts
  - app/features/auth/utils/passwordStrength.ts
  - app/features/account/AccountPage.vue
  - app/common/components/AppHeader.vue
---

# Auth

## TL;DR

Auth sepenuhnya Supabase dari browser (anon key). `AuthStore` (Pinia) memegang session (isLoggedIn/email/displayName/initial) dan di-`init()` sekali di `app.vue`. Login: email+password atau Google OAuth satu pintu; register memakai magic-link (`/check-email`). Akun & header 2-state membaca store yang sama.

## Entry Points

- `app/features/auth/LoginPage.vue`, `RegisterPage.vue`, `CheckEmailPage.vue` (route `/login`, `/register`, `/check-email`).
- `app/features/account/AccountPage.vue` — hub Akun (`/account`).
- `app/app.vue` — `onMounted(() => auth.init())`.

## Sequence

```mermaid
sequenceDiagram
    autonumber
    participant App as app.vue
    participant Store as AuthStore
    participant SB as Supabase Auth
    participant Reg as RegisterPage
    App->>Store: init() (client only, sekali)
    Store->>SB: getSession() + onAuthStateChange()
    SB-->>Store: session.user → applyUser (nama depan kapital)
    Reg->>SB: signUp({ emailRedirectTo: origin + "/" })
    Reg->>Reg: push /check-email?email=
    Note over Reg,SB: user klik link di inbox → HOME, session terbaca listener
```

1. `buildDisplayName`: `full_name` > `name` > prefix email > "Teman".
2. Login/Register menghormati `?redirect=` lewat `getRedirectQuery`; `buildOriginUrl` membuat URL absolut di browser.
3. Google: `useGoogleSignIn(redirect)` (label & redirect sama untuk login + register; register mewajibkan centang Syarat dulu).
4. `signOut()` selalu mereset state walau Supabase error.

## Key Components

| Component          | File                                              | Role                                          |
| ------------------ | ------------------------------------------------- | --------------------------------------------- |
| `AuthStore`        | `app/common/store/AuthStore.ts`                   | Session sumber kebenaran (Pinia setup store)  |
| `useSupabaseBrowser`| `app/common/composables/useSupabaseBrowser.ts`   | Singleton client browser (anon key)           |
| `useGoogleSignIn`  | `app/features/auth/composables/useGoogleSignIn.ts`| OAuth 1-klik + state loading                  |
| `PasswordField`, `GoogleButton`, `AuthBanner` | `app/features/auth/components/` | UI bersama login/register         |

## Failure & State

- Offline / SSR tanpa session → tetap anon (`refresh()` menelan error).
- `init()` idempotent: listener tidak dipasang ganda.
- Tombol auth disabled + spinner saat request (anti double-submit).

## See Also

[quota](../quota/README.md) · [state-management](../cross-cutting/state-management/README.md) · [security](../cross-cutting/security/README.md)
