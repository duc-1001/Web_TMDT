export interface CreateNewBanner {
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: File | string;
}

export interface HeroBanner extends CreateNewBanner {
    _id: string;
    backgroundImagePublicId?: string;
    createdAt: string;
    updatedAt: string;
}