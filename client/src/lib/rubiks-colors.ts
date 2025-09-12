// Official Rubik's cube colors (WCA standard colors based on Pantone specifications)
export const OFFICIAL_RUBIKS_COLORS = {
  white: { hex: "#FFFFFF", rgb: [255, 255, 255], name: "White", notation: "W" },
  red: { hex: "#B90000", rgb: [185, 0, 0], name: "UE Red", notation: "R" },
  blue: { hex: "#0045AD", rgb: [0, 69, 173], name: "Cobalt Blue", notation: "B" },
  orange: { hex: "#FF5900", rgb: [255, 89, 0], name: "Pantone Orange", notation: "O" },
  green: { hex: "#009B48", rgb: [0, 155, 72], name: "Pigment Green", notation: "G" },
  yellow: { hex: "#FFD500", rgb: [255, 213, 0], name: "Cyber Yellow", notation: "Y" },
  black: { hex: "#000000", rgb: [0, 0, 0], name: "Black", notation: "D" }, // Available but not recommended
};

// Default palette excludes black since most people don't have black stickers
export const DEFAULT_PALETTE = [
  OFFICIAL_RUBIKS_COLORS.white.hex,
  OFFICIAL_RUBIKS_COLORS.red.hex,
  OFFICIAL_RUBIKS_COLORS.blue.hex,
  OFFICIAL_RUBIKS_COLORS.orange.hex,
  OFFICIAL_RUBIKS_COLORS.green.hex,
  OFFICIAL_RUBIKS_COLORS.yellow.hex,
];

// Complete palette including black for 2-color mode
export const COMPLETE_PALETTE = [
  OFFICIAL_RUBIKS_COLORS.white.hex,
  OFFICIAL_RUBIKS_COLORS.red.hex,
  OFFICIAL_RUBIKS_COLORS.blue.hex,
  OFFICIAL_RUBIKS_COLORS.orange.hex,
  OFFICIAL_RUBIKS_COLORS.green.hex,
  OFFICIAL_RUBIKS_COLORS.yellow.hex,
  OFFICIAL_RUBIKS_COLORS.black.hex,
];

export const PALETTE_NAMES = {
  [OFFICIAL_RUBIKS_COLORS.white.hex]: OFFICIAL_RUBIKS_COLORS.white.name,
  [OFFICIAL_RUBIKS_COLORS.red.hex]: OFFICIAL_RUBIKS_COLORS.red.name,
  [OFFICIAL_RUBIKS_COLORS.blue.hex]: OFFICIAL_RUBIKS_COLORS.blue.name,
  [OFFICIAL_RUBIKS_COLORS.orange.hex]: OFFICIAL_RUBIKS_COLORS.orange.name,
  [OFFICIAL_RUBIKS_COLORS.green.hex]: OFFICIAL_RUBIKS_COLORS.green.name,
  [OFFICIAL_RUBIKS_COLORS.yellow.hex]: OFFICIAL_RUBIKS_COLORS.yellow.name,
  [OFFICIAL_RUBIKS_COLORS.black.hex]: OFFICIAL_RUBIKS_COLORS.black.name,
};