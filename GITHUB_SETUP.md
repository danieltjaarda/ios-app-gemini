# GitHub Setup Instructions

## Stap 1: Maak een GitHub Repository aan

1. Ga naar https://github.com/new
2. Repository naam: `ios-app-gemini`
3. Kies Public of Private
4. **NIET** initialiseren met README, .gitignore, of license (we hebben deze al)
5. Klik op "Create repository"

## Stap 2: Push naar GitHub

### Optie A: Via het script (aanbevolen)

```bash
./push-to-github.sh
```

### Optie B: Handmatig

Vervang `YOUR_GITHUB_USERNAME` met je GitHub username:

```bash
# Voor HTTPS (gebruikt username/password of token)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ios-app-gemini.git
git push -u origin main

# OF voor SSH (als je SSH keys hebt ingesteld)
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/ios-app-gemini.git
git push -u origin main
```

## Stap 3: Voor Render.com Deployment

Na het pushen naar GitHub:

1. Ga naar https://render.com
2. Klik op "New +" → "Web Service"
3. Connect je GitHub repository `ios-app-gemini`
4. Configureer:
   - **Name**: `gemini-backend` (of een andere naam)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Voeg Environment Variables toe:
   - `PORT` (Render stelt dit automatisch in)
   - `PROJECT_ID`: `aantal-in-de-routelogic-sheets`
   - `GOOGLE_APPLICATION_CREDENTIALS`: `./keys/vertex.json`
6. Upload je `keys/vertex.json` file via Render's secret files feature, of gebruik Environment Variables

## Belangrijk voor Render

- De `keys/vertex.json` file moet worden toegevoegd als een secret file in Render
- Of je kunt de credentials als environment variables instellen (minder veilig)
- Zorg ervoor dat de `PORT` environment variable wordt gebruikt (Render stelt dit automatisch in)

