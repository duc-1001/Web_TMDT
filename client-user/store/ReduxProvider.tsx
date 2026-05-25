"use client"

import { Provider, useDispatch } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { AppDispatch, persistor, store } from "./store"
import { fetchMe } from "./slices/authSlice"
import { useEffect } from "react"
import { fetchGeneralInfo } from "./slices/generalInfoSlice"

function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
      dispatch(fetchMe())
      dispatch(fetchGeneralInfo())
  }, [dispatch])

  return <>{children}</>
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <AuthLoader>{children}</AuthLoader>
      </PersistGate>
    </Provider>
  )
}