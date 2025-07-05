# Aplikace Ranger

Toto je komplexní aplikace pro správu montáží regálových systémů STOW.

## Přehled

Aplikace Ranger je modulární platforma s odděleným frontendem (webová aplikace), backendem (API) a mobilní aplikací. Všechny komponenty jsou kontejnerizovány pomocí Dockeru pro snadné nasazení.

## Spuštění Aplikace (Docker Compose)

Pro spuštění celé aplikace (backend, frontend, databáze, MinIO) použijte Docker Compose z kořenového adresáře projektu:

```bash
docker-compose up --build
```

*   **Frontend (Webová aplikace):** Dostupný na `http://localhost:3000`
*   **Backend (API):** Dostupný na `http://localhost:8000`
*   **MinIO Console:** Dostupný na `http://localhost:9001` (přihlašovací údaje: `minioadmin`/`minioadmin` - **ZMĚŇTE V PRODUKCI!**)

## Frontend (Webová aplikace)

Frontend je aplikace v Reactu s TypeScriptem. Pro spuštění vývojového serveru (bez Dockeru):

```bash
cd frontend
npm install
npm start
```

## Backend (Serverová část)

Backend je aplikace v Pythonu s použitím FastAPI. Pro spuštění vývojového serveru (bez Dockeru):

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Mobilní aplikace (React Native)

Mobilní aplikace je vyvíjena v React Native s TypeScriptem. Pro spuštění mobilní aplikace (vyžaduje nastavené React Native vývojové prostředí):

```bash
cd mobile-app/RangerMobileApp
npm install
npx react-native run-android # nebo npx react-native run-ios
```

**Důležité:** Pro plnou funkčnost mobilní aplikace je nutné mít správně nastavené vývojové prostředí React Native (Android Studio/Xcode, SDKs atd.).