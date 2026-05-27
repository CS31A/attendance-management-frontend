import type { ToastType } from '@/composables/useToast'

type IsEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type ExpectTrue<T extends true> = T
type ExpectFalse<T extends false> = T

// --- ToastType is the expected union ---
type _toastTypeIsUnion = ExpectTrue<
  IsEqual<ToastType, 'success' | 'error' | 'warning' | 'info'>
>

// --- Each literal is assignable to ToastType ---
type _successAssignable = ExpectTrue<IsEqual<Extract<ToastType, 'success'>, 'success'>>
type _errorAssignable = ExpectTrue<IsEqual<Extract<ToastType, 'error'>, 'error'>>
type _warningAssignable = ExpectTrue<IsEqual<Extract<ToastType, 'warning'>, 'warning'>>
type _infoAssignable = ExpectTrue<IsEqual<Extract<ToastType, 'info'>, 'info'>>

// --- Nothing extra leaks in ---
type _noOtherMembers = ExpectFalse<IsEqual<ToastType, string>>

// --- useToast composable shape ---
type UseToastReturn = ReturnType<typeof import('@/composables/useToast').useToast>

type _hasShowToast = ExpectTrue<'showToast' extends keyof UseToastReturn ? true : false>
type _showToastIsFunction = ExpectTrue<
  UseToastReturn['showToast'] extends (...args: any[]) => any ? true : false
>
type _hasCloseToast = ExpectTrue<'closeToast' extends keyof UseToastReturn ? true : false>
type _hasToast = ExpectTrue<'toast' extends keyof UseToastReturn ? true : false>

// --- showToast accepts ToastType as second arg ---
type ShowToastParams = Parameters<UseToastReturn['showToast']>
type _secondParamIsToastType = ExpectTrue<
  [ShowToastParams[1]] extends [ToastType | undefined]
    ? [ToastType | undefined] extends [ShowToastParams[1]]
        ? true
        : false
    : false
>

// --- Runtime-assignable check: each value must fit ToastType at compile time ---
const _valSuccess: ToastType = 'success'
const _valError: ToastType = 'error'
const _valWarning: ToastType = 'warning'
const _valInfo: ToastType = 'info'

// Silence unused-variable warnings
void _valSuccess
void _valError
void _valWarning
void _valInfo

export {}
