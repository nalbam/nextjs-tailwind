import { headers as nextHeaders } from "next/headers";

import { getAuth } from "@/lib/auth";

export const getSession = async () => {
  const auth = getAuth();
  const requestHeaders = await nextHeaders();
  return auth.api.getSession({ headers: requestHeaders });
};
