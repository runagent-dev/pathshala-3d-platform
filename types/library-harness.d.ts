// The reference reader page the lab verification loads (scripts/lib/library/harness/host-harness.js) puts these on window.
interface Window {
  __mountLab: (options: object) => Promise<{ granted: string[] }>;
  __labTest: { events: string[]; errors: string[]; host: unknown; frame: HTMLIFrameElement };
  __setVisible: (visible: boolean) => void;
  __resetLab: () => void;
}
