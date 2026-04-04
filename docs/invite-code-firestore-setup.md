# Invite code setup

If admin sees **Missing or insufficient permissions** when creating invite codes, verify:

1. Sign in with a `staff`, `manager`, or `admin` account.
2. Deploy the latest `firestore.rules` from this project to Firebase.
3. If using a normal email account, ensure `users/{uid}.role` is `admin`, `manager`, or `staff`.

Invite codes are stored in `resident_invite_codes/{CODE}`.
When a resident signs up with a valid code, the app updates:

- `status` -> `claimed`
- `claimedAt`
- `claimedByUid`
- `claimedByEmail`
- `claimedResidentId`

So once Firestore rules are live, the status will automatically show as used.
