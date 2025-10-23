export function generateNanoId(size: number = 21): string {
    const alphabet =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let id = "";
  
    for (let i = 0; i < size; i++) {
      id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
  
    return id;
  }