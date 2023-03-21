declare module 'geo-reverse' {
  interface country {
    timeZone: string
    isoAlpha2: string
    isoAlpha3: string
    name: string
  }

  function country(lat: number, lan: number, locale: string): Array<country>
}
