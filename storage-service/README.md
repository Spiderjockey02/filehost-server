<h1 align="center">
  <br>
    Storage Server API
  <br>
</h1>

<h3 align=center>The API that powers the website</h3>

# ❗ Features
* This is where all files, folders, thumbnails etc are stored.
* Database access is done through this API.
* File analysis done via the recognise files (GEO, NSFW, Facial & object recognition).

# ⌨️Installation

### Config file setups
<ol>
  <li>Rename the .env.example file to be .env and fill in details.</li>
  <li>Move to the src folder and rename the config.example.ts to config.ts and fill in those details aswell.</li>
</ol>

### Settings up the project
<ol>
  <li>Run the following commands
    <ol>
      <li>npm run install</li>
      <li>npx prisma migrate dev --name init</li>
      <li>npm run start</li>
    </ol>
  </li>
</ol>
