import { getAuth } from "@/lib/auth";

const handler = async (request: Request) => getAuth().handler(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
