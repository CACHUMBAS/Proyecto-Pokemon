import { configuredHandler } from '../server/runtime.ts'
const handler = configuredHandler(process.env)
export const POST = handler
export const GET = handler
