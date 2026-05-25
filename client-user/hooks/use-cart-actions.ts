'use client'

import { useCallback, useEffect, useRef } from 'react'
import debounce from 'lodash.debounce'
import type { DebouncedFunc } from "lodash"

import { queryClient } from '@/components/QueryClientProviders'
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  removeMultipleItemsFromCart
} from '@/services/cart.service'
import { Cart } from '@/types/cart'
import { toast } from 'sonner'

const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem('guest-cart') || '[]')
  } catch {
    return []
  }
}

export function useCartActions(isAuthenticated: boolean) {
  const queryKey = isAuthenticated ? ['user-cart'] : ['guest-cart']
  const previousCartRef = useRef<Cart | null>(null)

  /* ---------------- UPDATE QUANTITY (DEBOUNCED) ---------------- */
  const debouncedUpdateRef = useRef<
    DebouncedFunc<(productId: string, quantity: number) => Promise<void>> | null
  >(null)

  useEffect(() => {
    debouncedUpdateRef.current = debounce(
      async (productId: string, quantity: number) => {
        try {
          const updatedCart = await updateCartItemQuantity(productId, quantity)
          queryClient.setQueryData(queryKey, updatedCart?.cart)
          queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        } catch (error: any) {
          toast.error(error.message || 'Có lỗi xảy ra! Vui lòng thử lại sau.')
          if (previousCartRef.current) {
            queryClient.setQueryData(queryKey, previousCartRef.current)
          }

        }
      },
      500
    )

    return () => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current.cancel()
      }
    }
  }, [])


  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const safeQuantity = Math.max(quantity, 1)
      const currentCart = queryClient.getQueryData<Cart>(queryKey)
      if (!currentCart) return

      previousCartRef.current = currentCart

      if (isAuthenticated) {
        // optimistic update
        const updatedItems = currentCart.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: safeQuantity }
            : item
        )

        queryClient.setQueryData<Cart>(queryKey, {
          ...currentCart,
          items: updatedItems,
        })

        debouncedUpdateRef.current?.(productId, safeQuantity)
      } else {
        const guestCart = getGuestCart()
        const newGuestCart = guestCart.map((item: any) =>
          item.productId === productId
            ? { ...item, quantity: safeQuantity }
            : item
        )

        localStorage.setItem('guest-cart', JSON.stringify(newGuestCart))

        queryClient.setQueryData<Cart>(queryKey, old => {
          if (!old) return old

          const updatedItems = old.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: safeQuantity }
              : item
          )

          return {
            ...old,
            items: updatedItems,
          }
        })
        queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
      }
    },
    [isAuthenticated, queryKey]
  )

  /* ---------------- ADD TO CART ---------------- */
  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      if (!isAuthenticated) {
        const guestCart = getGuestCart()
        const index = guestCart.findIndex(
          (item: any) => item.productId === productId
        )

        if (index >= 0) {
          guestCart[index].quantity += quantity
        } else {
          guestCart.push({ productId, quantity })
        }

        localStorage.setItem('guest-cart', JSON.stringify(guestCart))
        localStorage.setItem('merge-cart-handled', 'false')

        queryClient.invalidateQueries({ queryKey })
        queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })

        toast.success('Đã thêm sản phẩm vào giỏ hàng!')
        return
      }

      try {
        await addToCart(productId, quantity)
        queryClient.invalidateQueries({ queryKey })
        queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        toast.success('Đã thêm sản phẩm vào giỏ hàng!')
      } catch (error: any) {
        toast.error(error.message || 'Có lỗi xảy ra! Vui lòng thử lại sau.')
      }
    },
    [isAuthenticated, queryKey]
  )

  /* ---------------- REMOVE ITEM ---------------- */
  const removeItem = useCallback(
    async (productId: string) => {
      debouncedUpdateRef.current?.cancel()
      const currentCart = queryClient.getQueryData<Cart>(queryKey)
      if (!currentCart) return

      previousCartRef.current = currentCart

      try {
        if (isAuthenticated) {
          const updatedItems = currentCart.items.filter(
            item => item.productId !== productId
          )

          queryClient.setQueryData<Cart>(queryKey, {
            ...currentCart,
            items: updatedItems,
          })
          await removeFromCart(productId)
          queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        } else {
          const guestCart = getGuestCart().filter(
            (item: any) => item.productId !== productId
          )

          localStorage.setItem('guest-cart', JSON.stringify(guestCart))

          queryClient.setQueryData<Cart>(queryKey, old => {
            if (!old) return old

            const updatedItems = old.items.filter(
              item => item.productId !== productId
            )

            return {
              ...old,
              items: updatedItems,
            }
          })
          queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        }
      } catch (error: any) {
        if (previousCartRef.current) {
          queryClient.setQueryData(queryKey, previousCartRef.current)
        }
      }
    },
    [isAuthenticated, queryKey]
  )

  const removeMultipleItems = useCallback(
    async (productIds: string[], clearDiscounts = false) => {
      debouncedUpdateRef.current?.cancel()
      const currentCart = queryClient.getQueryData<Cart>(queryKey)
      if (!currentCart) return
      previousCartRef.current = currentCart

      try {
        if (isAuthenticated) {
          const updatedItems = currentCart.items.filter(
            item => !productIds.includes(item.productId)
          )
          queryClient.setQueryData<Cart>(queryKey, {
            ...currentCart,
            items: updatedItems,
          })
          await removeMultipleItemsFromCart(productIds, clearDiscounts)
          queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        }
        else {
          const guestCart = getGuestCart().filter(
            (item: any) => !productIds.includes(item.productId)
          )
          localStorage.setItem('guest-cart', JSON.stringify(guestCart))

          queryClient.setQueryData<Cart>(queryKey, old => {
            if (!old) return old

            const updatedItems = old.items.filter(
              item => !productIds.includes(item.productId)
            )
            return {
              ...old,
              items: updatedItems,
            }
          }
          )
          queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
        }
      } catch (error: any) {
        if (previousCartRef.current) {
          queryClient.setQueryData(queryKey, previousCartRef.current)
        }
      }
    }
    , [isAuthenticated, queryKey]
  )

  const clearCartAction = useCallback(async () => {
    debouncedUpdateRef.current?.cancel()
    const currentCart = queryClient.getQueryData<Cart>(queryKey)
    if (currentCart) {
      previousCartRef.current = currentCart
    }
    try {
      if (isAuthenticated) {
        if (currentCart) {
          queryClient.setQueryData<Cart>(queryKey, {
            ...currentCart,
            items: [],
          })
        } else {
          queryClient.removeQueries({ queryKey })
        }
        await clearCart()
        queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
      }
      else {
        localStorage.removeItem('guest-cart')
        localStorage.removeItem('guest-discounts')

        queryClient.setQueryData<Cart>(queryKey, old => {
          if (!old) return old
          return {
            ...old,
            items: [],
          }
        }
        )
        queryClient.invalidateQueries({ queryKey: ['cart-pricing'], exact: false })
      }
    } catch {
      if (previousCartRef.current) {
        queryClient.setQueryData(queryKey, previousCartRef.current)
      }
    }
  }, [isAuthenticated, queryKey])

  return {
    addItem,
    updateQuantity,
    removeItem,
    clearCartAction,
    removeMultipleItems
  }
}
