/**
 * Browser client. Note what is NOT here: a MailKite API key. Every inbox call is
 * session-authenticated against our own auth server, which holds the credential.
 */
"use client";

import { mailkiteInboxClient } from "@mailkite/better-auth-inbox/client";
import {
  emailOTPClient,
  magicLinkClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    emailOTPClient(),
    organizationClient(),
    mailkiteInboxClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
