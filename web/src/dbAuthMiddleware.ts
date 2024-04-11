/* eslint-disable no-restricted-imports */
// We have to import from the $api side

import {
  decryptSession,
  getSession,
  cookieName as cookieNameCreator,
} from '@redwoodjs/auth-dbauth-api'
import {
  MiddlewareRequest,
  MiddlewareResponse,
} from '@redwoodjs/vite/middleware'

interface DbAuthMiddlewareOptions {
  cookieName: string
  getCurrentUser: any
  dbAuthHandler: any
}

export const createDbAuthMiddleware = ({
  cookieName,
  dbAuthHandler,
  getCurrentUser,
}: DbAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest) => {
    const res = MiddlewareResponse.next()

    // If it's a POST request, handoff the request to the dbAuthHandler
    // But.... we still need to convert tha Lambda style headers (because of multiValueHeaders)
    if (req.method === 'POST') {
      console.log('XXXXXX')
      const output = await dbAuthHandler(req)
      console.log(`👉 \n ~ output:`, output)

      const finalHeaders = new Headers()
      Object.entries(output.headers).forEach(([key, value]) => {
        finalHeaders.append(key, value)
      })

      Object.entries(output.multiValueHeaders).forEach(([key, values]) => {
        values.forEach((value) => finalHeaders.append(key, value))
      })

      return new MiddlewareResponse(output.body, {
        headers: finalHeaders,
        status: output.statusCode,
      })
    }

    const cookieHeader = req.headers.get('Cookie')
    console.log(`👉 \n ~ cookieHeader:`, cookieHeader)

    if (!cookieHeader) {
      // Let the AuthContext fallback to its default value
      return res
    }

    const sessionStuff = getSession(cookieHeader, cookieNameCreator(cookieName))

    try {
      const [decryptedSession] = decryptSession(sessionStuff)

      const currentUser = await getCurrentUser(decryptedSession)

      // Middleware getCurrentUser
      // Shotcircuit here, if the call came from packages/auth-providers/dbAuth/web/src/getCurrentUserFromMiddleware.ts
      if (req.url.includes('currentUser')) {
        return new MiddlewareResponse(JSON.stringify({ currentUser }))
      }

      req.serverAuthContext.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: currentUser, // Not sure!
        cookieHeader,
      })
    } catch (e) {
      // Clear server auth context
      req.serverAuthContext.set(null)

      //  @TODO(Rob): Clear the cookie
      // We currently do not expose a way of removing cookies in dbAuth
    }

    return res
  }
}
