# Push naar GitHub - Instructies

Het repository bestaat al op GitHub: https://github.com/danieltjaarda/ios-app-gemini

## Optie 1: Via Script (Aanbevolen)

Voer dit commando uit:

```bash
cd "/Users/danieltjaarda/Desktop/Cursor/Nano banana Ios app"
./push-with-token.sh
```

Het script vraagt om je GitHub Personal Access Token.

## Optie 2: Handmatig met Token

1. **Maak een Personal Access Token aan** (als je die nog niet hebt):
   - Ga naar: https://github.com/settings/tokens/new
   - Geef het token een naam (bijv. "ios-app-gemini")
   - Selecteer scope: **repo** (alle repo rechten)
   - Klik "Generate token"
   - **Kopieer het token** (je ziet het maar één keer!)

2. **Push de code**:

```bash
cd "/Users/danieltjaarda/Desktop/Cursor/Nano banana Ios app"

# Vervang YOUR_TOKEN met je Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/danieltjaarda/ios-app-gemini.git
git push -u origin main

# Na het pushen, verwijder het token uit de URL voor veiligheid
git remote set-url origin https://github.com/danieltjaarda/ios-app-gemini.git
```

## Optie 3: Via GitHub Desktop

Als je GitHub Desktop hebt geïnstalleerd:
1. Open GitHub Desktop
2. File → Add Local Repository
3. Selecteer de map: `/Users/danieltjaarda/Desktop/Cursor/Nano banana Ios app`
4. Klik "Publish repository"
5. Kies het repository: `danieltjaarda/ios-app-gemini`

## Na het pushen

Zodra de code op GitHub staat, kun je het deployen op Render.com:

1. Ga naar https://render.com
2. Klik "New +" → "Web Service"
3. Connect je GitHub account en selecteer `ios-app-gemini`
4. Configureer:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     - `PROJECT_ID`: `aantal-in-de-routelogic-sheets`
     - `GOOGLE_APPLICATION_CREDENTIALS`: `./keys/vertex.json`
5. Upload `keys/vertex.json` als secret file in Render

