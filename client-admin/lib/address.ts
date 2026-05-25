const BASE_URL = "https://provinces.open-api.vn/api/v2"

export interface Province {
    code: number
    name: string
}

export interface Ward {
    code: number
    name: string
    province_code: number
}

export const getProvinces = async (): Promise<Province[]> => {
    const res = await fetch(`${BASE_URL}/p/`)
    return res.json()
}

export const getWardsByProvince = async (provinceCode: number): Promise<Ward[]> => {
    const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`)
    const data = await res.json()
    return data.wards ?? []
}
