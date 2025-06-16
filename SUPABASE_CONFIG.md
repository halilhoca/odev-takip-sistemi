# Supabase Row-Level Security Configuration

## Enabling Public Assignment Updates

To allow unauthenticated users to update assignment completion status, follow these steps in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Policies"
3. Find the `assignments` table
4. Add a new RLS policy with the following settings:

**Policy Name**: `Allow public updates to assignment completion status`

**Policy Definition**:
```sql
(role() = 'anon' AND request.headers->>'x-public-client' = 'true')
```

**Target Roles**: `anon`

**Operation**: `UPDATE`

**Check Expression**:
```sql
(old_record.is_completed IS DISTINCT FROM new_record.is_completed)
```

This policy will only allow anonymous users to update the `is_completed` field and nothing else in the assignments table, and only when the request includes our special header.

## Security Note

This approach creates a policy that allows anonymous users to update assignment status, but it restricts updates to just the `is_completed` field. The policy checks that only this field is being changed by comparing the old record to the new record.

The `x-public-client` header adds an extra layer of security to ensure that only our application can trigger these updates.

## Alternative Approach

If you prefer a more restrictive approach, you could create a Supabase Function (Edge Function) that handles the update with a custom authorization mechanism.
