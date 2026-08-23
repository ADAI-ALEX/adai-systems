/**
 * Resolver hook for `node --test`.
 *
 * The app's modules import each other extensionlessly ("./projects"), which is
 * what Next's bundler resolution expects but not what Node's ESM loader does.
 * Node strips the types itself; it just needs to be told where the file is.
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      // Fall through to the default resolution and let it report the error.
    }
  }
  return next(specifier, context);
}
