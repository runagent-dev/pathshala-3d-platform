// biome-ignore-all lint/suspicious/noExplicitAny: values coming back from figures can have any shape
// Globals that the test and export tooling installs in figure pages (see scripts/lib/export/).
interface Window {
  /** Virtual clock installed by scripts/lib/export/virtual-time.js. */
  __vt: { ready: any; now(): number; advance(ms: number, frameMs?: number): Promise<number> };
  /** Command channel of test/harness.html. */
  harness: { start(type: string, payload?: any): number; state(ticket: number): { done: boolean; value?: any; error?: string } };
}
