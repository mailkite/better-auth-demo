/**
 * Browser client. Note what is NOT here: a MailKite API key. Every inbox call is
 * session-authenticated against our own auth server, which holds the credential.
 */
"use client";

import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  magicLinkClient,
  organizationClient,
} from "better-auth/client/plugins";
import { mailkiteInboxClient } from "@mailkite/better-auth-inbox/client";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    emailOTPClient(),
    organizationClient(),
    mailkiteInboxClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
