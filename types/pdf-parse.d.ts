declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string
    IsAcroFormPresent?: boolean
    IsXFAPresent?: boolean
    Title?: string
    Author?: string
    Subject?: string
    Keywords?: string
    Creator?: string
    Producer?: string
    CreationDate?: Date
    ModDate?: Date
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: any
    text: string
    version: string
  }

  interface Options {
    pagerender?: (pageData: any) => string
    max?: number
    version?: string
  }

  function pdf(dataBuffer: Buffer, options?: Options): Promise<PDFData>

  export = pdf
}