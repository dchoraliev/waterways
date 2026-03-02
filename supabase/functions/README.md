# Supabase Edge Functions

Edge Functions are server-side TypeScript functions that run close to your users, distributed globally at the edge. They're ideal for handling custom business logic, API integrations, and data transformations.

## 📁 Structure

Each function should be in its own directory:

```
functions/
├── function-name/
│   ├── index.ts       # Main function code
│   └── README.md      # Function-specific documentation (optional)
```

## 🚀 Creating a New Edge Function

### 1. Create the Function

```bash
npx supabase functions new function-name
```

This creates a new directory with a template `index.ts` file.

### 2. Write Your Function

Edit `supabase/functions/function-name/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Your logic here
    const { data, error } = await supabase.from('trips').select('*');

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

## 📤 Deploying Functions

### Deploy a Single Function

```bash
yarn db:function:deploy function-name
```

### Deploy All Functions

```bash
yarn db:function:deploy
```

## 🧪 Testing Locally

### Serve Functions Locally

```bash
yarn db:function:serve
```

Functions will be available at: `http://localhost:54321/functions/v1/function-name`

### Test with cURL

```bash
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## 🔑 Environment Variables

### Set Secrets for Edge Functions

```bash
npx supabase secrets set SECRET_NAME=secret_value
```

### List Secrets

```bash
npx supabase secrets list
```

### Access in Function

```typescript
const secretValue = Deno.env.get('SECRET_NAME');
```

## 🔧 Debugging

### View Logs

```bash
npx supabase functions logs function-name
```

### Follow Logs in Real-time

```bash
npx supabase functions logs function-name --follow
```

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Edge Function Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

## 💡 Tips

1. **Use Deno imports:** Edge Functions run on Deno, use `https://` imports
2. **Keep functions small:** Each function should do one thing well
3. **Test locally first:** Always test with `serve` before deploying
4. **Use TypeScript:** You get better type safety and IDE support
5. **Handle errors gracefully:** Always return proper HTTP status codes
