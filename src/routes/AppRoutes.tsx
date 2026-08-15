import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { Spinner } from '@/components/ui/Spinner'

const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const VerifyDocument = lazy(() => import('@/pages/VerifyDocument'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Documents = lazy(() => import('@/pages/Documents'))
const CreateDocument = lazy(() => import('@/pages/CreateDocument'))
const DocumentDetails = lazy(() => import('@/pages/DocumentDetails'))
const Verifications = lazy(() => import('@/pages/Verifications'))
const Institution = lazy(() => import('@/pages/Institution'))
const Users = lazy(() => import('@/pages/Users'))
const Audit = lazy(() => import('@/pages/Audit'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const ErrorPage = lazy(() => import('@/pages/ErrorPage'))
const Unauthorized = lazy(() => import('@/pages/Unauthorized'))
const SessionExpired = lazy(() => import('@/pages/SessionExpired'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50">
      <Spinner size="lg" className="text-primary-600" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/nao-autorizado" element={<Unauthorized />} />
        <Route path="/session-expirada" element={<SessionExpired />} />

        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/verificar" element={<VerifyDocument />} />
          <Route path="/verificar/:codigo" element={<VerifyDocument />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-palavra-passe" element={<ForgotPassword />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/documents"
          element={
            <ProtectedRoute roles={['ADMIN', 'ISSUER', 'VIEWER']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Documents />} />
          <Route
            path="new"
            element={
              <ProtectedRoute roles={['ADMIN', 'ISSUER']}>
                <CreateDocument />
              </ProtectedRoute>
            }
          />
          <Route path=":id" element={<DocumentDetails />} />
        </Route>

        <Route
          path="/verifications"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Verifications />} />
        </Route>

        <Route
          path="/institution"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Institution />} />
        </Route>

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Users />} />
        </Route>

        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Audit />} />
        </Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
