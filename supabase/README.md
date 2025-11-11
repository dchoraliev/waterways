# Supabase Directory

This directory contains all Supabase-related configuration, migrations, and utilities for the Waterways app.

## 📁 Directory Structure

```
supabase/
├── config.toml          # Supabase CLI configuration
├── migrations/          # Database migration files (version controlled)
└── functions/           # Edge functions for server-side logic
    └── README.md        # Edge functions documentation
```

## 🚀 Quick Start (Remote-Only Workflow)

### Initial Setup

1. **Link to your remote Supabase project:**
   ```bash
   yarn db:link
   ```
   
2. **Pull current remote schema** (first time only):
   ```bash
   yarn db:pull
   ```
   This creates a migration file from your current database state.

3. **Access Supabase Studio:**
   Go to your [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor

## 📝 Working with Migrations (Recommended Workflow)

### Method 1: Direct SQL Editor → Migration File (Recommended for Quick Changes)

1. **Make changes in Supabase SQL Editor:**
   - Go to your Supabase Dashboard → SQL Editor
   - Write and test your SQL directly
   - Execute to apply changes

2. **Capture changes as migration:**
   ```bash
   yarn db:pull
   ```
   This generates a migration file from the remote schema changes.

3. **Review and commit:**
   - Check the generated migration in `supabase/migrations/`
   - Commit to git for version control

4. **Generate TypeScript types:**
   ```bash
   yarn types:generate
   ```

### Method 2: Migration File First (Recommended for Complex Changes)

1. **Create a new migration file:**
   ```bash
   yarn db:migration:new add_feature_name
   ```

2. **Edit the migration file:**
   - Open `supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql`
   - Write your SQL changes

3. **Push to remote database:**
   ```bash
   yarn db:push
   ```

4. **Generate TypeScript types:**
   ```bash
   yarn types:generate
   ```

### View Migration Status

```bash
yarn db:migration:list
```

Shows which migrations have been applied to your remote database.

## 🗃️ Database Commands Cheat Sheet


### Database Migrations

| Command | Description | When to Use |
|---------|-------------|-------------|
| `yarn db:link` | Link to remote Supabase project | Initial setup only |
| `yarn db:migration:new <name>` | Create a new migration file | Before making schema changes |
| `yarn db:migration:list` | List all migrations and their status | Check what's been applied |
| `yarn db:push` | Apply local migrations to remote | After creating migration file |
| `yarn db:pull` | Pull remote schema into new migration | After making changes in SQL Editor |
| `yarn types:generate` | Generate TypeScript types from schema | After any schema change |

### Edge Functions

| Command | Description | When to Use |
|---------|-------------|-------------|
| `yarn db:function:new <name>` | Create a new edge function | Starting new server-side logic |
| `yarn db:function:deploy [name]` | Deploy function(s) to remote | After writing/updating function |
| `yarn db:function:serve` | Run functions locally | Testing before deployment |
| `yarn db:function:logs <name>` | View function logs | Debugging deployed functions |'s automatically run when you execute `yarn db:reset`.

## 📋 Migration Best Practices

1. **One Change Per Migration**: Keep migrations focused on a single logical change.

2. **Always Test Locally First**: Run `yarn db:reset` locally to ensure migrations work correctly.

3. **Use Transactions**: Wrap destructive operations in transactions when possible.

4. **Add Rollback Logic**: Consider how to reverse your migration if needed.

5. **Document Complex Changes**: Add comments explaining non-obvious logic.

6. **Generate Types After Schema Changes**: Always run `yarn types:generate` after modifying the schema.

## ⚡ Edge Functions

Edge Functions are server-side TypeScript functions for custom business logic, API integrations, and data processing. See [functions/README.md](functions/README.md) for detailed documentation.

**Quick start:**
```bash
# Create new function
yarn db:function:new my-function

# Deploy to production
yarn db:function:deploy my-function
```

Common use cases:
- Send emails/notifications
- Process uploaded images
- Integrate with external APIs
- Complex database operations

## 🔐 Row Level Security (RLS)

All tables have Row Level Security enabled. Key policies:

- **Users**: Can only view and update their own profile
- **Trips**: Users can CRUD their own trips
- **Observations**: Users can CRUD their own observations
- **Projects**: Authenticated users can view all, update their own
- **Media**: Access controlled through parent observation ownership

## 📦 Storage

The `observation-media` bucket stores user-uploaded photos and videos. Storage policies ensure users can only access their own media files.

## 🔄 Common Workflows

### Adding a New Table

1. Create migration:
## 🔄 Common Workflows

### Workflow A: Quick Changes (SQL Editor First)

**Best for:** Small tweaks, testing ideas, urgent fixes

1. **Open Supabase Dashboard** → SQL Editor

2. **Write and test your SQL:**
   ```sql
   ALTER TABLE trips ADD COLUMN notes TEXT;
   ```

3. **Execute the SQL** to apply changes immediately

4. **Capture as migration:**
   ```bash
   yarn db:pull
   ```

5. **Generate types:**
   ```bash
   yarn types:generate
   ```

6. **Commit to git:**
   ```bash
   git add supabase/migrations/* packages/shared/src/models/database-types.ts
   git commit -m "Add notes column to trips table"
   ```

### Workflow B: Complex Changes (Migration File First)

**Best for:** Major schema changes, multiple related changes, team collaboration

1. **Create migration:**
   ```bash
   yarn db:migration:new add_project_members
   ```

2. **Write SQL in the migration file:**
   ```sql
   -- supabase/migrations/20241111123456_add_project_members.sql
   CREATE TABLE project_members (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
## 🐛 Troubleshooting

### "Project not linked"
```bash
yarn db:link
```
Follow the prompts to authenticate and select your project.

### Migrations Out of Sync
If migrations get out of order or you need to start fresh:
1. Go to Supabase Dashboard → Database → Migrations
2. Review applied migrations
3. Use `yarn db:migration:list` to compare with local

### Migration Failed During Push
1. Check the error message carefully
2. Fix the SQL in your migration file
3. May need to manually fix the remote DB in SQL Editor
4. Re-run `yarn db:push`

## 📚 Resources

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/managing-environments)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/overview#the-sql-editor)

## 💡 Pro Tips

1. **Always pull before making changes** if working with a team
2. **Test SQL in the SQL Editor** before creating migration files for complex queries
3. **Commit migrations immediately** after creating them to avoid conflicts
4. **Keep migrations small** and focused on one change
5. **Use descriptive migration names** like `add_trip_status_column` not just `update`
6. **Run `yarn types:generate`** after every schema change
