/** Renders a section title as the element WordPress used for it (h2 or p). */
export default function Heading({ as: Tag = 'h2', ...props }) {
  return <Tag {...props} />
}
