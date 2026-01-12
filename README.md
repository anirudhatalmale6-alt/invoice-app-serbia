# Upravljanje Fakturama - Invoice Management PWA

Aplikacija za upravljanje plaćenim i neplaćenim fakturama za dve kompanije.

## Funkcionalnosti

- **Prijava korisnika** - Sigurna prijava sa email i lozinkom
- **Dodavanje faktura** - Ručno ili putem OCR skeniranja
- **OCR čitanje** - Automatsko prepoznavanje podataka sa slike fakture
- **Praćenje dospeća** - Pregled faktura koje dospevaju danas
- **Status faktura** - Označi kao plaćeno/neplaćeno jednim klikom
- **Pretraga** - Pretraga po dobavljaču
- **Dve kompanije** - Podrška za upravljanje fakturama dve kompanije
- **Offline rad** - Aplikacija radi i bez interneta (PWA)
- **Instalacija** - Može se instalirati na telefon kao aplikacija

## Tehnologije

- React + TypeScript
- Firebase (Auth, Firestore)
- Tesseract.js (OCR)
- Vite + PWA

---

# Uputstvo za instalaciju

## Korak 1: Kreiranje Firebase projekta

1. Idite na [Firebase Console](https://console.firebase.google.com/)
2. Kliknite "Create a project" (Kreiraj projekat)
3. Unesite ime projekta (npr. "invoice-management")
4. Onemogućite Google Analytics (nije potreban)
5. Kliknite "Create project"

## Korak 2: Podešavanje Firebase Authentication

1. U Firebase konzoli, idite na **Build > Authentication**
2. Kliknite "Get started"
3. Izaberite **Email/Password** kao metodu prijave
4. Omogućite "Email/Password" i sačuvajte

## Korak 3: Kreiranje Firestore baze

1. Idite na **Build > Firestore Database**
2. Kliknite "Create database"
3. Izaberite "Start in production mode"
4. Izaberite lokaciju (preporučujem `europe-west1` za Srbiju)
5. Kliknite "Enable"

## Korak 4: Postavljanje sigurnosnih pravila

1. U Firestore, idite na tab **Rules**
2. Zamijenite sadržaj sa:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isValidUser() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if false;
    }

    match /invoices/{invoiceId} {
      allow read, write: if isValidUser();
    }

    match /settings/{settingId} {
      allow read, write: if isValidUser();
    }
  }
}
```

3. Kliknite "Publish"

## Korak 5: Dobijanje Firebase konfiguracije

1. Idite na **Project Settings** (ikonica zupčanika)
2. Skrolujte do "Your apps" i kliknite **</>** (Web)
3. Registrujte aplikaciju sa imenom (npr. "invoice-app")
4. Kopirajte prikazanu konfiguraciju

## Korak 6: Kreiranje korisnika

### Opcija A: Preko Firebase konzole (jednostavnije)

1. Idite na **Build > Authentication > Users**
2. Kliknite "Add user"
3. Unesite email i lozinku za prvog korisnika
4. Ponovite za drugog korisnika
5. Kopirajte UID svakog korisnika
6. Idite na **Firestore Database**
7. Kreirajte kolekciju `users`
8. Za svakog korisnika dodajte dokument sa ID-jem = UID korisnika:
   ```
   {
     "uid": "kopirani-uid",
     "email": "email@korisnika.com",
     "displayName": "Ime Korisnika",
     "role": "admin",
     "createdAt": 1704067200000
   }
   ```

### Opcija B: Preko skripte (ako imate Node.js)

1. Idite na **Project Settings > Service accounts**
2. Kliknite "Generate new private key"
3. Sačuvajte fajl kao `scripts/serviceAccountKey.json`
4. Instalirajte firebase-admin: `npm install firebase-admin`
5. Uredite `scripts/create-users.js` sa vašim emailovima/lozinkama
6. Pokrenite: `node scripts/create-users.js`

## Korak 7: Podešavanje .env fajla

1. Kopirajte `.env.example` u `.env`
2. Popunite vrednosti iz Firebase konfiguracije:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Korak 8: Build i deploy

```bash
# Instalirajte dependencies
npm install

# Pokrenite lokalno za testiranje
npm run dev

# Napravite produkcioni build
npm run build

# Deploy na Firebase Hosting
npm install -g firebase-tools
firebase login
firebase init hosting  # izaberite "dist" kao public folder
firebase deploy
```

---

# Korišćenje aplikacije

## Prijava
1. Otvorite aplikaciju
2. Unesite email i lozinku
3. Kliknite "Prijavi se"

## Dodavanje fakture

### Sa OCR-om (fotografija)
1. Kliknite "+ Dodaj fakturu"
2. Kliknite "Učitaj sliku/PDF (OCR)"
3. Izaberite sliku fakture
4. Aplikacija će pokušati da pročita podatke
5. Pregledajte i ispravite ako treba
6. Kliknite "Dodaj fakturu"

### Ručno
1. Kliknite "+ Dodaj fakturu"
2. Popunite sva polja ručno
3. Kliknite "Dodaj fakturu"

## Označi kao plaćeno/neplaćeno
- Kliknite na status fakture da ga promenite

## Pretraga
- Koristite polje za pretragu da pronađete fakturu po dobavljaču

## Filteri
- **Sve** - Sve fakture
- **Danas dospevaju** - Fakture koje dospevaju danas
- **Istekle** - Fakture koje su prošle rok plaćanja
- **Neplaćene** - Sve neplaćene fakture
- **Plaćene** - Sve plaćene fakture

## Instalacija na telefon (PWA)
1. Otvorite aplikaciju u Chrome/Safari
2. Na iOS: Kliknite Share > "Add to Home Screen"
3. Na Android: Kliknite meni > "Install app" ili "Add to Home Screen"

---

# Tehnička podrška

Za pitanja ili probleme, kontaktirajte programera.
