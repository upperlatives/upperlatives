// Settings that WordPress does not expose through the public REST API.
// Everything else (page titles, text, images) comes from WordPress.

const site = {
  // Fallback until the WordPress site name has loaded.
  name: 'Upperlatives',

  // Main navigation (centre of the header) and the call to action (right).
  nav: [
    { label: 'Services', to: '/services/' },
    { label: 'Work', to: '/work/' },
    { label: 'Process', to: '/process/' },
    { label: 'About', to: '/about/' },
  ],
  cta: { label: "Let's talk", to: '/contact/' },

  // WordPress slug -> public URL segment. Several pages were created while an
  // older page held the slug, so WordPress appended "-2". Once you rename the
  // slugs in WordPress (and delete the old "Studio"/"Contact" pages) you can
  // remove the matching line here. "" means the segment disappears.
  slugAliases: {
    'home-2': '',
    'services-2': 'services',
    'work-2': 'work',
    'contact-2': 'contact',
  },

  // Pages that should never be routed (old template pages).
  hiddenSlugs: ['studio', 'hello-world'],

  // Which hero layout a page uses. Keys are public paths.
  heroVariants: {
    '/': 'wordmark', // giant site name + two text columns
    '/work/': 'stack', // big title + 3D image stack
  },
  // Child pages of these paths use the centred "project" hero.
  centeredHeroUnder: ['/services/'],

  // Custom cursor colour per section. Elements carry data-cursor="<name>";
  // "light" is set on dark panels and photo/video cards.
  cursor: {
    default: '#111111', // ink black (the reference uses orange #ff4400)
    light: '#ffffff',
  },

  // Label shown in the cursor over a card that links somewhere, chosen by the
  // link target: exact page first, then pages below a path.
  cursorLabels: {
    exact: {
      '/services/': 'See Services',
      '/work/': 'See Portfolio',
      '/process/': 'See Process',
      '/about/': 'About Us',
      '/faq/': 'Read FAQ',
      '/contact/': "Let's Talk",
    },
    under: {
      '/services/': 'See Service',
      '/work/': 'See Project',
    },
    external: 'Visit Site',
    fallback: 'View More',
  },

  // Words that run along the 3D ribbon in dark panels.
  ribbon: ['WordPress', 'WooCommerce', 'PHP', 'SEO', 'GEO', 'AI Marketing', 'Web Design', 'Print'],

  footer: {
    socials: [
      { label: 'LinkedIn', href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'GitHub', href: '#' },
    ],
    contact: [
      { label: '[EMAIL]', href: 'mailto:' },
      { label: '[PHONE]', href: 'tel:' },
    ],
    legal: [
      { label: 'Privacy', to: '/privacy-policy/' },
    ],
  },
}

export default site
