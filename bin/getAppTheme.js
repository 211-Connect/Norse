const mater = require('matercolors');

module.exports = function getAppTheme(appTheme) {
  const primary = new mater(appTheme.primaryColor);
  const primaryColors = [];
  for (const key in primary.palette.primary) {
    primaryColors.push(primary.palette.primary[key]);
  }

  let primaryShade = 0;
  for (let i = 0; i < 10; i++) {
    if (
      primaryColors[i].toLowerCase() === appTheme.primaryColor.toLowerCase()
    ) {
      primaryShade = i;
    }
  }

  const secondary = new mater(appTheme.secondaryColor);
  const secondaryColors = [];
  for (const key in secondary.palette.primary) {
    secondaryColors.push(secondary.palette.primary[key]);
  }

  let secondaryShade = 0;
  for (let i = 0; i < 10; i++) {
    if (
      secondaryColors[i].toLowerCase() === appTheme.secondaryColor.toLowerCase()
    ) {
      secondaryShade = i;
    }
  }

  return {
    primaryShade,
    secondaryShade,
    primaryPalette: primaryColors,
    secondaryPalette: secondaryColors,
  };
};
