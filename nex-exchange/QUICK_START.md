# NEX Exchange - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd nex-exchange
npm install
```

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set at minimum:

```env
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_NORCHAIN_WS=wss://ws.norchain.org:8546
DATABASE_URL=postgresql://user:password@localhost:5432/nex
```

### Step 3: Setup Database

**Option A: Local PostgreSQL**

```bash
createdb nex
npm run db:setup
```

**Option B: Supabase (Cloud)**

1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Set `DATABASE_URL` in `.env.local`
4. Run: `npm run db:setup`

### Step 4: Verify Setup

```bash
npm run check
```

Should show: ✅ All checks passed!

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ That's It!

You now have:
- ✅ NEX Exchange running locally
- ✅ Database configured
- ✅ RPC connection to NorChain
- ✅ All features available

## 🧪 Test It

```bash
# Run tests
npm test

# Check coverage
npm run test:coverage
```

## 📚 Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Read [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for deployment
- Check [docs/](./docs/) for architecture details

## 🆘 Troubleshooting

**Database connection failed?**
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Test: `psql $DATABASE_URL -c "SELECT 1"`

**RPC connection failed?**
- Verify endpoints are accessible
- Check network connectivity
- Test: `curl https://rpc.norchain.org`

**Tests failing?**
- Run `npm install` again
- Clear cache: `npm test -- --clearCache`
- Check Node.js version (requires 18+)

---

**Need Help?** Check the [documentation](./docs/) or [open an issue](https://github.com/your-repo/issues).

