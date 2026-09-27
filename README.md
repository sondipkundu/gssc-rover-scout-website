# Govt. Shaheed Suhrawardy College Rover Scout Group

Full-stack website for the Govt. Shaheed Suhrawardy College Rover Scout Group.

## Included

- `public/index.html` — complete responsive frontend
- `public/banner.png` — supplied group banner
- `public/logo.jpg` — supplied group logo
- `public/uploads/.gitkeep` — upload directory placeholder
- `server.js` — Express backend, login, roles, posts and image uploads
- `package.json` — Node.js dependencies/scripts
- `data/` — local JSON database is generated automatically
- `.gitignore` — keeps secrets, database and uploads out of Git
- `.env.example` — environment variable template
- `GITHUB_SETUP.md` — GitHub/deployment checklist

## Roles

### Admin
- Login
- Create posts
- Edit posts
- Delete posts
- Upload images
- Add/remove Admin and Moderator staff accounts

### Moderator
- Login
- Create posts
- Edit posts
- Upload images
- Cannot delete posts
- Cannot manage staff accounts

### Visitor
- Can view the public website and published posts
- Cannot publish or edit content

## Demo accounts

Admin:
- Username: `admin`
- Password: `admin123`

Moderator:
- Username: `moderator`
- Password: `mod123`

Change these passwords before public launch.

## Run locally

```bash
npm install
npm start
```

Then open:

`http://localhost:3000`

## Production notes

Set a strong `SESSION_SECRET` environment variable on your hosting provider. Use HTTPS and a production database/storage solution for a real public deployment. The included JSON database is intended as a simple prototype/local deployment database.
