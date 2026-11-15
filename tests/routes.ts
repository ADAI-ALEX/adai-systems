import { projects } from '../src/content/projects';
import { services } from '../src/content/services';
export const staticRoutes = ['/', '/work', '/services', '/process', '/studio', '/research', '/start', '/contact', '/mascot', '/privacy', '/terms'];
export const routes = [...staticRoutes, ...projects.map((p) => `/work/${p.slug}`), ...services.map((s) => `/services/${s.path}`)];
