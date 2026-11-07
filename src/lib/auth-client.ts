"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false },
        locale: { type: "string", required: false },
        isSandbox: { type: "boolean", required: false },
      },
    }),
  ],
});
