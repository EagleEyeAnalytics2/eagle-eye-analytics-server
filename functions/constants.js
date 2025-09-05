const clubs = [
  "-",
  "Driver",
  "3-Wood",
  "4-Wood",
  "5-Wood",
  "7-Wood",
  "2-Hybrid",
  "3-Hybrid",
  "4-Hybrid",
  "5-Hybrid",
  "2-Iron",
  "3-Iron",
  "4-Iron",
  "5-Iron",
  "6-Iron",
  "7-Iron",
  "8-Iron",
  "9-Iron",
  "Pitching Wedge",
  "Gap/Approach Wedge",
  "Lob Wedge",
  "Sand Wedge",
];

const teeShots = ["-", "Left", "Fairway", "Right"];
const approachShots = [
  "-",
  "GIR",
  "Short Right",
  "Short Left",
  "Left",
  "Long Left",
  "Long Right",
  "Right",
  "Sand",
];

const arr0to9 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const upAndDown = ["-", "Yes", "No"];

const colors = {
  "-": "#ABABAB",
  GIR: "#11C02E",
  Fairway: "#11C02E",
  Left: "#55BCFF",
  Right: "#FFE84A",
  "Short Left": "#4A6EFF",
  "Short Right": "#FA4AFF",
  "Long Left": "#FFC34A",
  "Long Right": "#B14AFF",
  Yes: "#11C02E",
  No: "#eb6b54",
  Sand: "#FFA54A",
};

const sortingOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Early-Late)",
  "Date (Late-Early)",
];

export {
  clubs,
  teeShots,
  approachShots,
  arr0to9,
  colors,
  upAndDown as yesAndNo,
  sortingOptions,
};
