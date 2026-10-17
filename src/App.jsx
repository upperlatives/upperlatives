import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Page from './pages/Page'

// Effects test page, loaded only when visited.
const Lab = lazy(() => import('./pages/Lab'))

// Every other URL is resolved against the WordPress page tree, so new pages
// published in WordPress work without touching the routes.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="lab"
          element={
            <Suspense fallback={null}>
              <Lab />
            </Suspense>
          }
        />
        <Route path="*" element={<Page />} />
      </Route>
    </Routes>
  )
}
