export function getPageScope(href: string = window.location.href): string {
  try {
    const { origin, pathname } = new URL(href);
    return `${origin}${pathname}`;
  } catch {
    return href;
  }
}
