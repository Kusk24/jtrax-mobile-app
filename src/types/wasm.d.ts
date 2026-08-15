/* Metro resolves .wasm as an asset (see metro.config.js); TypeScript needs to
   be told the same, or `require` of one is an error. */
declare module "*.wasm" {
  const asset: number;
  export default asset;
}
