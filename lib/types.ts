export enum SelectedPage {
  Home = "home",
  Feature = "feature",
  Solution = "solution",
  Reviews = "reviews",
  About = "about",
}

export type HeatmenuItem = {
  product: string;
  type: string;
  price: number;
  prevPrice: number;
};

export interface MenuDataPoint {
  time: string;
  heineken: number;
  corona: number;
  peroni: number;
  aperol_spritz: number;
  vin_rosu: number;
  vin_alb: number;
  prosecco: number;
  vin_spumant_fara_alcool: number;
  apa: number;
  cola: number;
  jameson: number;
  jameson_black_barrel: number;
  fireball: number;
  tequilla: number;
}

export const productKeyMap: Record<string, keyof MenuDataPoint> = {
    heineken: "heineken",
    corona: "corona",
    peroni: "peroni",
    prosecco: "prosecco",
    aperol_spritz: "aperol_spritz",
    vin_rosu: "vin_rosu",
    vin_alb: "vin_alb",
    vin_spumant_fara_alcool: "vin_spumant_fara_alcool",
    cola: "cola",
    apa: "apa",
    jameson: "jameson",
    jameson_black_barrel: "jameson_black_barrel",
    fireball: "fireball",
    tequilla: "tequilla",
  };