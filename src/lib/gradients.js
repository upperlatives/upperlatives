// Soft gradients standing in for photos until images are added in WordPress.
// Colours sampled from the reference imagery.
export const gradients = [
  'radial-gradient(120% 80% at 50% 110%, #d9c7b3 0%, transparent 60%), linear-gradient(180deg, #5f8592 0%, #a9bcbd 55%, #d8c5ae 100%)',
  'radial-gradient(90% 70% at 70% 60%, #6e74e8 0%, transparent 60%), linear-gradient(160deg, #e7bfd8 0%, #d6a9d6 50%, #c48ad0 100%)',
  'radial-gradient(80% 60% at 75% 25%, #f5a35a 0%, transparent 60%), linear-gradient(170deg, #ead2c0 0%, #c7835a 60%, #7a3c24 100%)',
  'radial-gradient(70% 60% at 30% 80%, #e8c16a 0%, transparent 60%), linear-gradient(180deg, #9fbfdb 0%, #c4d6e2 60%, #e1d7b5 100%)',
  'radial-gradient(90% 70% at 40% 30%, #8b9a6c 0%, transparent 60%), linear-gradient(170deg, #4e5b45 0%, #8f9a77 55%, #d8d0b4 100%)',
  'radial-gradient(80% 60% at 60% 20%, #3b3b3b 0%, transparent 60%), linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
]

export function gradientFor(i) {
  return gradients[i % gradients.length]
}
