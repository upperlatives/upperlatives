import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <section className="container-x">
      <title>Page not found</title>
      <meta name="robots" content="noindex" />
      <h1 className="display text-[clamp(6rem,24vw,22rem)]">404</h1>
      <p className="mt-6 max-w-[40ch] text-xl text-muted">This page doesn’t exist — or it moved when the site was updated.</p>
      <Button to="/" className="mt-8">Back home</Button>
    </section>
  )
}
