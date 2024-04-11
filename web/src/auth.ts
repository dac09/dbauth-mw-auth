import {
  createDbAuthClient,
  createMiddlewareAuth,
} from '@redwoodjs/auth-dbauth-web'

const dbAuthClient = createDbAuthClient({
  middleware: true,
})

export const { AuthProvider, useAuth } = createMiddlewareAuth(dbAuthClient)
