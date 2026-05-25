export interface ImageAsset {
  url: string
  imagePublicId: string
}

export interface SystemSettingsPayload {
  websiteName: string
  shortName: string
  websiteDescription?: string

  logo?: ImageAsset
  favicon?: ImageAsset
  socialImage?: ImageAsset
}
