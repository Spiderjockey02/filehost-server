declare module 'exifer' {
  interface Metadata {
    Make: string;
    Model: string;
    Orientation: number;
    XResolution: number;
    YResolution: number;
    Software: string;
    ModifyDate: string;
    ExifIFDPointer: number;
    GPSInfoIFDPointer: number;
    GPSLatitudeRef: string;
    GPSLatitude: Array<number>;
    GPSLongitudeRef: string;
    GPSLongitude: Array<number>;
    GPSAltitudeRef: string;
    GPSAltitude: number;
    GPSTimeStamp: Date;
    GPSImgDirectionRef: string;
    GPSImgDirection: number;
    GPSDateStamp: Date;
    xmp: string;
  }

  export default async function exifer(file: buffer, obj: any): Promise<Metadata>;
}
