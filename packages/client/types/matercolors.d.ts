declare module 'matercolors' {
  export default class Mater {
    color: string;

    constructor(color: string);

    palette: {
      primary: {
        [key: string]: string;
      };
    };
  }
}
