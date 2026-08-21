/**
 * Sanitizes project titles to remove accidental generated timestamps/ID suffixes
 * (e.g. "OmniSensing Radar AI 1787216104625" or "OmniSensing Radar AI i787216104625")
 * while strictly preserving legitimate numbers like "Industry 4.0", "AI 2.0", "3D Platform", "Web 3.0".
 */
export function cleanProjectTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\s_\-–—]+[iI]?[0-9]{10,15}$/, '')
    .trim();
}
