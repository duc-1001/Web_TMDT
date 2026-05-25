import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { GeneralInfo } from "@/types/system"
import { getGeneralInfo } from "@/services/system.service"

interface GeneralInfoState {
    generalInfo: GeneralInfo | null,
    isAuthenticated: boolean,
    isLoading: boolean,
}

const initialState: GeneralInfoState = {
    generalInfo: null,
    isAuthenticated: false,
    isLoading: false,
}

const generalInfoSlice = createSlice({
    name: "generalInfo",
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGeneralInfo.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchGeneralInfo.fulfilled, (state, action) => {
                if (action.payload) {
                    state.generalInfo = action.payload;
                }
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(fetchGeneralInfo.rejected, (state) => {
                state.isLoading = false;
            });
    },
})

export const fetchGeneralInfo = createAsyncThunk(
    "generalInfo/fetchGeneralInfo",
    async () => {
        const response = await getGeneralInfo();
        return response;
    }
)

export const { reducer: generalInfoReducer } = generalInfoSlice

export default generalInfoSlice.reducer
