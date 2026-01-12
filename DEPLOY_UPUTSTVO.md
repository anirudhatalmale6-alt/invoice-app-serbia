# Uputstvo za Deploy na Firebase Hosting

## Potrebno:
- Node.js 20 ili noviji (download: https://nodejs.org)

## Koraci:

### 1. Downloadujte kod sa GitHub-a
Otvorite ovaj link u pretraživaču:
https://github.com/anirudhatalmale6-alt/invoice-app-serbia

Kliknite zeleno dugme "Code" > "Download ZIP"

### 2. Raspakujte ZIP fajl
Raspakujte preuzeti fajl na Desktop (npr. `C:\Users\VaseIme\Desktop\invoice-app-serbia-master`)

### 3. Otvorite Command Prompt
- Pritisnite `Windows + R`
- Ukucajte `cmd` i pritisnite Enter

### 4. Uđite u folder aplikacije
```
cd C:\Users\VaseIme\Desktop\invoice-app-serbia-master
```
(Zamenite `VaseIme` sa vašim korisničkim imenom)

### 5. Instalirajte dependencies
```
npm install
```
Sačekajte da se završi (može trajati par minuta)

### 6. Instalirajte Firebase CLI
```
npm install -g firebase-tools
```

### 7. Prijavite se na Firebase
```
firebase login
```
Otvorice se browser - prijavite se sa `george.milicevic@gmail.com`

### 8. Napravite build
```
npm run build
```

### 9. Deploy na Firebase Hosting
```
firebase deploy --only hosting
```

### 10. Gotovo!
Aplikacija će biti dostupna na:
**https://faktureapp.web.app**

---

## Prijava u aplikaciju:
- Email: `george.milicevic@gmail.com` ili `m.ljubinka1964@gmail.com`
- Lozinka: koju ste postavili prilikom kreiranja korisnika

## Instalacija na telefon (PWA):
1. Otvorite https://faktureapp.web.app na telefonu
2. U Chrome meniju izaberite "Add to Home Screen" / "Dodaj na početni ekran"
3. Aplikacija će se pojaviti kao ikonica na telefonu
