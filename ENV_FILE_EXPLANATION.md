# Environment Files Explained

## Simple Answer: Just Use `.env`

You can use **just `.env`** for all your environment variables. That's the simplest approach!

## File Types (Optional)

### `.env` (Use This!)
- **Your actual environment variables** with real values
- Contains secrets (API keys, passwords, etc.)
- **Gitignored** - never committed to git
- This is what you actually use

### `.env.example` (Optional Template)
- **Template file** showing what variables are needed
- Contains NO secrets, just variable names
- **Committed to git** - safe to share
- Helps other developers know what to set up
- You can delete this if you don't need it

### `.env.local` (Optional Override)
- Local overrides that take precedence over `.env`
- Useful if you want to override values without editing `.env`
- **Gitignored** - never committed
- You probably don't need this

## Recommended Setup

**Just create `client/.env`:**

```env
VITE_PRIVY_APP_ID=your_privy_app_id_here
VITE_API_BASE_URL=http://localhost:3000
```

That's it! No need for `.env.example` or `.env.local` unless you specifically want them.

## Vite Environment File Priority

If you have multiple files, Vite loads them in this order (later files override earlier ones):

1. `.env` - Base environment variables
2. `.env.local` - Local overrides (gitignored)
3. `.env.[mode]` - Mode-specific (e.g., `.env.development`)
4. `.env.[mode].local` - Mode-specific local overrides

**For most projects, just `.env` is enough!**








