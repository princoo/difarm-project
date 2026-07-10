/** CRA returns a URL string; Next.js returns { src, width, height }. */
export function imageSrc(source: string | { src: string }): string {
  return typeof source === 'string' ? source : source.src;
}
