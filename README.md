# EmpQR — QR-Based Employee Profile & ID Card System

A responsive employee profile website inspired by the supplied dark/neon-green sample card. Includes a demo admin dashboard, employee CRUD, unique profile URLs, QR generation, search, activate/deactivate status, and printable employee ID cards.

## Quick start (demo mode)

1. Extract this ZIP.
2. Open `index.html` in a modern browser. Since the app uses JavaScript modules, the most reliable option is to run a local web server (steps below).
3. Demo admin login:
   - Email: `admin@demo.com`
   - Password: `EmpQR@123`
4. Open **Admin dashboard** to add, edit, search and deactivate employees.
5. Choose **QR / ID** next to an employee. Confirm to open a QR page; cancel to print the ID card.
6. Each QR points to a URL such as `https://your-site.example/?id=EMP001`. For QR scanning to work on other phones, deploy the site to a public HTTPS host first.

### Run locally

If Python is installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Demo data is stored in the current browser's `localStorage`; it is not shared with other devices. Demo login is only a prototype and is **not secure enough for a real company deployment**.

## Deploy on GitHub Pages

1. Create a GitHub repository (for example, `empqr`).
2. Upload the files in this folder to the repository root.
3. Open repository **Settings → Pages**, choose the branch and root folder, then save.
4. Wait for GitHub Pages to publish the site.
5. Open the published HTTPS URL and test the profile URL and QR code.

## Enable Firebase for shared employee records and real admin login

1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web App and copy its Firebase configuration into `firebaseConfig` in `app.js`.
3. Enable **Authentication → Email/Password**.
4. Create the intended admin account in Firebase Authentication.
5. Create a Firestore database.
6. In `app.js`, set `const USE_FIREBASE = true;`.
7. Add Firestore rules that restrict all employee writes to authorized admin users. Example starter rules are below; customize and test before production.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == "admin@yourcompany.com";
    }
    match /employees/{employeeId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}
```

**Security notes**
- Replace `admin@yourcompany.com` with your real admin email before deploying.
- Public reads mean the fields stored in `employees` are public. Only store information intended to be public on the profile. Do not store home address, personal identity numbers, bank details, medical data or other sensitive information.
- For multiple administrators or multiple companies, use custom claims / role-based rules rather than relying on a single email.
- Keep Firebase configuration public web configuration only; never place service-account private keys or secrets in browser JavaScript.
- Before production, add server-side validation, rate limiting where appropriate, audit logs, backups, consent and a privacy policy.
- Firebase Storage is not used by this starter version; the photo field accepts a public photo URL. Add Storage upload with suitable rules if required.

## Employee fields

- `id` (unique employee ID; used in profile URL)
- `name`
- `designation`
- `department`
- `email`
- `phone`
- `photoUrl`
- `linkedin`, `github`, `website`
- `bio`
- `active`

## Project structure

```text
empqr/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Current limitations

- Demo mode stores data in one browser only.
- Firebase mode uses a starter Firestore setup; production access rules and admin roles must be configured correctly.
- Profile URL uses `?id=EMP001`; QR codes should be generated after deployment so they contain the public HTTPS URL.
- The print dialog creates a basic credit-card-size ID card layout. Check print scaling and printer margins before bulk printing.
