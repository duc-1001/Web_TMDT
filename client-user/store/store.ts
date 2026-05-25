import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage" // localStorage
import {injectStore} from "@/lib/axios"
// ví dụ reducer
import authReducer from "./slices/authSlice"
import generalInfoReducer from "./slices/generalInfoSlice"

const rootReducer = combineReducers({
    auth: authReducer,
    generalInfo: generalInfoReducer,
})

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"], // chỉ persist auth
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // BẮT BUỘC cho redux-persist
        }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
injectStore(store)