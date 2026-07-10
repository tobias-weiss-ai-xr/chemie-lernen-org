# Tasks: Lehrenden-Premium

## Status: In Progress

| #   | Task                                       | Status    | Notes                            |
| --- | ------------------------------------------ | --------- | -------------------------------- |
| 1   | User database (SQLite, better-sqlite3)     | Done      | `api/auth-db.js`                 |
| 2   | Auth routes + JWT middleware               | Done      | `api/auth.js`                    |
| 3   | Login page (Hugo + JS)                     | Done      | `content/pages/login.md` + JS    |
| 4   | Register page                              | Done      | `content/pages/register.md` + JS |
| 5   | Premium gating middleware on /api/admin/\* | Done      | Built into auth.js middleware    |
| 6   | Klassencockpit auth check + redirect       | Done      | client-side check in auth.js     |
| 7   | Password reset flow                        | Done      | forgot/reset endpoints + pages   |
| 8   | Stripe payment integration                 | Postponed | Wird später implementiert        |
| 9   | Premium upgrade page                       | Done      | `/premium/` mit Pricing + Stripe |
| 10  | Rebuild + deploy chat-api image            | Done      | Included in 022aaf57 deploy      |
