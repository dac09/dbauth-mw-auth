import { createDbAuthClient, createAuth } from '@redwoodjs/auth-dbauth-web'

const dbAuthClient = createDbAuthClient()

// Internally we know to use the middleware version of the client
// because middleware is set to true above!
export const { AuthProvider, useAuth } = createAuth(dbAuthClient)
