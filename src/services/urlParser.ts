export class UrlParser {
  static lastPathSegment(url: string): string | null {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] ?? null;
    } catch {
      return null;
    }
  }
}
