import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Page from './pages/Page'

// Every URL is resolved against the WordPress page tree, so new pages
// published in WordPress work without touching the routes.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<Page />} />
      </Route>
    </Routes>
  )
}
