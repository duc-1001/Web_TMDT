export type GeneralInfo = {
    websiteName: string;
    shortName: string;
    websiteDescription: string;
    logo: string;
    favicon: string;
    contactInfo: {
        contactAddress: string;
        contactEmail: string;
        contactMapEmbed: string;
        contactPhone: string;
        workingHours?: string;
        province: {
            code: string
            name: string
        },
        ward: {
            code: string;
            name: string;
        },
    }
};