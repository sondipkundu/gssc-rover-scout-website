# GitHub setup

1. Create a new GitHub repository.
2. Upload every file/folder in this project.
3. Do NOT upload `node_modules/`, `data/db.json`, or real `.env` files.
4. Install and run locally with:
   npm install
   npm start
5. For online use, deploy the Node.js app to a Node-compatible hosting provider.
6. Set `SESSION_SECRET` to a strong random value in the host environment.
7. Change the demo Admin and Moderator passwords before public launch.

## Repository structure

public/
  index.html
  banner.png
  logo.jpg
  uploads/.gitkeep

data/
  (db.json is generated automatically on first run)

server.js
package.json
README.md
.gitignore
.env.example
