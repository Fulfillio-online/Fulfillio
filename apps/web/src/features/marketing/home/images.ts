/** Transparent PNG assets (background chroma-keyed out). Dimensions are of the trimmed files. */
export interface ImgAsset {
  src: string;
  w: number;
  h: number;
}

const a = (name: string, w: number, h: number): ImgAsset => ({ src: `/images/home/${name}.png`, w, h });

export const IMG = {
  hero: a('hero-warehouse', 887, 664),
  worker: a('worker-inspection', 780, 717),
  packing: a('packing-station', 1036, 697),
  courier: a('courier-dispatch', 1064, 639),
  racks: a('storage-racks', 956, 811),
  parcels: a('parcel-stack', 737, 805),
  van: a('delivery-van', 869, 596),
  returns: a('returns-inspection', 799, 569),
};
