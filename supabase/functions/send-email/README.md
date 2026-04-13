# send-email Edge Function

Sends transactional emails through Resend from Supabase Edge Functions.

## Environment Variables

Set these in Supabase secrets:

- `RESEND_API_KEY`: Your Resend API key.
- `RESEND_FROM_EMAIL`: Verified sender address on your domain.
  - Supported formats: `noreply@yourdomain.com` or `Waterways <noreply@yourdomain.com>`
  - The function also normalizes `Waterways noreply@yourdomain.com` into a valid sender format.
- `ALLOW_EXTERNAL_EMAIL_RECIPIENTS`: Optional. Defaults to `false`. Set to `true` to allow recipients other than the currently authenticated user.

## Request Body

```json
{
  "template": "welcome",
  "to": "user@example.com",
  "data": {
    "firstName": "Alex",
    "appUrl": "https://app.yourdomain.com"
  }
}
```

Supported templates:

- `welcome`
- `password-reset`
- `generic` (requires `subject` and one of `html` or `text`)

If `to` is omitted, the function sends to the authenticated user's email.

## Notes

- This function requires an authenticated Supabase user (`Authorization: Bearer <jwt>`).
- By default, external recipients are blocked to reduce abuse.
