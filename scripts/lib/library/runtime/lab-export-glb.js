// Stands in for shared/lib/export-glb.js in a lab build. A lab has no GLB export (the GLBs are made by the exporter and
// published as their own library items), so the exporter code and three's GLTFExporter stay out of the lab.
export async function exportGLB() {
  throw new Error('export-glb is not available in a lab');
}
