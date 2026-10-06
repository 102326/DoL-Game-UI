/** Use the loader's version rules, including four-part Mod versions. */
export interface VersionTools {
 parseVersion(value: string): {version: unknown};
 parseRange(value: string): unknown;
 satisfies(version: unknown, range: unknown): boolean;
}
export interface VersionToolsHost {getSemVerTools?: () => VersionTools}
export const isMinimumVersion = (value: string) => /^>=\d+(?:\.\d+){1,3}$/.test(value);
export function matchesTargetVersion(version: unknown, requirements: readonly string[], host?: VersionToolsHost): boolean {
 if (typeof version !== 'string' || !version) return false;
 if (requirements.includes(version)) return true;
 if (!/^\d+(?:\.\d+){1,3}(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version)) return false;
 try {
  const tools = host?.getSemVerTools?.();
  return !!tools && requirements.some(range => isMinimumVersion(range) && tools.satisfies(tools.parseVersion(version).version, tools.parseRange(range)));
 } catch {return false}
}
