import { World, type MascotCommand } from './World';

let world: World | null = null;

export async function boot(stage: HTMLElement) {
  if (world) return world;
  world = new World(stage);
  await world.init();
  (window as unknown as { adai?: { mascot: (c: MascotCommand) => void } }).adai = { mascot: (c) => world?.command(c) };
  return world;
}
