import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('mdg_session')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Rotas públicas que não precisam de autenticação
  if (
    request.nextUrl.pathname.startsWith('/api/') || 
    request.nextUrl.pathname.startsWith('/_next/') || 
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Se não tem token e não está na página de login, redireciona pro login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se tem token, verifica
  if (token) {
    const payload = await verifyToken(token)
    
    // Se token for inválido e não estiver no login, manda pro login
    if (!payload && !isLoginPage) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('mdg_session')
      return response
    }

    // Se token for válido e tentar acessar login, manda pra home
    if (payload && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
