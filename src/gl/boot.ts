import { World, type MascotCommand } from './World';

let world: World | null = null;

export async function boot(stage: HTMLElement) {
  if (world) return world;
  performance.mark('adai:gl-imported');
  world = new World(stage);
  await world.init();
  (window as unknown as { adai?: object }).adai = {
    mascot: (c: MascotCommand) => world?.command(c),
    /** Dev tool: export the live mascot as a GLB blockout (used by scripts/export-mascot-glb.mjs). */
    exportGlb: () => world?.exportGlb(),
  };
  return world;
}
