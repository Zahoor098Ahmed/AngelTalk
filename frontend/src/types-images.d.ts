// Lets TypeScript import local raster images (used by the generated book
// vocabulary picture set — content-pipeline/src/exportToApp.js).
declare module "*.png" {
  const value: number;
  export default value;
}
declare module "*.jpg" {
  const value: number;
  export default value;
}
declare module "*.jpeg" {
  const value: number;
  export default value;
}
