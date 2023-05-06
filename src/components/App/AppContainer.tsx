import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  setIsAuthenticated,
  setIsLoading,
  setTransactions,
  setOfflineMode,
  setLastNotificationText,
  useAppSelector,
  AppState,
} from '@/redux/appSlice'
import App from './App'
import Login from './Login'
import { DbService, BackendService } from '@/services'
import { TransactionDTO } from '@/types'
import _ from 'lodash'
import { useCategoryExpansions } from './hooks/useCategoryExpansions'
import { useAccountProperties } from './hooks/useAccountProperties'

type ConfigType = {
  backendUrl: string
  backendToken: string
  dbUrl: string
}

export default function AppContainer() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector((state: AppState) => state.isAuthenticated)
  const transactions = useAppSelector((state: AppState) => state.transactions)
  const isLoading = useAppSelector((state: AppState) => state.isLoading)
  const offlineMode = useAppSelector((state: AppState) => state.offlineMode)
  const lastNotificationText = useAppSelector((state: AppState) => state.lastNotificationText)
  const isInitialized = useAppSelector((state: AppState) => state.isInitialized)
  const dbServiceRef = useRef<DbService | null>(null)
  const [hasFailedPush, setHasFailedPush] = useState(false)
  const pushIntervalRef = useRef<number | null>(null)
  const [config, setConfig] = useState<ConfigType | null>(null)
  const [backendService, setBackendService] = useState<BackendService | null>(null)
  const [dbService, setDbService] = useState<DbService | null>(null)

  useEffect(() => {
    const localStorageConfig: ConfigType | null = window.localStorage.config
      ? JSON.parse(window.localStorage.config)
      : null
    setConfig(localStorageConfig)
  }, [])

  useEffect(() => {
    if (config) {
      dispatch(setIsAuthenticated(true))
    }
  }, [config, dispatch])

  useEffect(() => {
    if (!config) {
      return
    }
    const service = new BackendService(config.backendUrl, config.backendToken)
    setBackendService(service)
  }, [config])

  useEffect(() => {
    if (!config) {
      return
    }
    const service = new DbService({
      dbUrl: config.dbUrl,
      onLoading: (value) => dispatch(setIsLoading(value)),
    })
    setDbService(service)
  }, [config, dispatch])

  useCategoryExpansions(backendService)
  useAccountProperties(backendService)

  useEffect(() => {
    if (!backendService) {
      return
    }
    if (!dbService) {
      return
    }
    const nonNullBackendService = backendService as BackendService
    const nonNullDbService = dbService as DbService

    async function loadTransactions() {
      async function updateTransactionsFromLocalDb() {
        const docs = await nonNullDbService.readAllDocs()
        const sortedDocs = _.sortBy(docs, (doc: TransactionDTO) => doc.datetime).reverse()
        dispatch(setTransactions(sortedDocs))
      }

      await updateTransactionsFromLocalDb()

      async function pullDataFromRemote() {
        try {
          const checkSettings = await nonNullBackendService.getSettings()

          const dbChanged =
            window.localStorage.transactionsUploadedAt !== checkSettings.transactionsUploadedAt
          if (dbChanged) {
            await nonNullDbService.reset()
            window.localStorage.transactionsUploadedAt = checkSettings.transactionsUploadedAt
          }
          if (await nonNullDbService.pullChanges()) {
            await updateTransactionsFromLocalDb()
          }
          dispatch(setOfflineMode(false))
        } catch (error: any) {
          dispatch(setOfflineMode(true))
        }
      }

      await pullDataFromRemote()

      const pullInterval = setInterval(pullDataFromRemote, 10000)

      return () => {
        clearInterval(pullInterval)
      }
    }

    void loadTransactions()
  }, [backendService, dbService, dispatch])

  async function pushChangesWithRetry(dbService: DbService) {
    try {
      await dbService.pushChanges()
      setHasFailedPush(false)
    } catch (error) {
      setHasFailedPush(true)
    }
  }

  useEffect(() => {
    if (hasFailedPush && !pushIntervalRef.current) {
      pushIntervalRef.current = window.setInterval(async () => {
        const dbService: DbService | null = dbServiceRef.current
        if (dbService) {
          await pushChangesWithRetry(dbService)
        }
      }, 10000)
    } else if (!hasFailedPush && pushIntervalRef.current) {
      clearInterval(pushIntervalRef.current)
      pushIntervalRef.current = null
    }
  }, [hasFailedPush])

  async function addTransaction(t: TransactionDTO) {
    const dbService: DbService | null = dbServiceRef.current
    if (!dbService) {
      return
    }

    await dbService.addTransaction(t)

    const newTransactions = [...transactions, t]
    const sortedTransactions = _.sortBy(
      newTransactions,
      (doc: TransactionDTO) => doc.datetime
    ).reverse()
    dispatch(setTransactions(sortedTransactions))

    dispatch(setLastNotificationText('Запись добавлена'))
    navigate('/transactions', { replace: true })

    await pushChangesWithRetry(dbService)
  }

  async function editTransaction(t: TransactionDTO) {
    const dbService: DbService | null = dbServiceRef.current
    if (!dbService) {
      return
    }

    await dbService.replaceTransaction(t)

    // replace transaction in redux store
    const newTransactions = [...transactions]
    const index = newTransactions.findIndex((transaction) => transaction._id === t._id)
    newTransactions[index] = t
    const sortedTransactions = _.sortBy(
      newTransactions,
      (doc: TransactionDTO) => doc.datetime
    ).reverse()
    dispatch(setTransactions(sortedTransactions))

    dispatch(setLastNotificationText('Запись изменена'))
    navigate('/transactions', { replace: true })

    await pushChangesWithRetry(dbService)
  }

  async function removeTransaction(id: string) {
    const dbService: DbService | null = dbServiceRef.current
    if (!dbService) {
      return
    }

    await dbService.removeTransaction(id)

    // remove transaction from redux store
    const newTransactions = [...transactions]
    const index = newTransactions.findIndex((transaction) => transaction._id === id)
    newTransactions.splice(index, 1)
    dispatch(setTransactions(newTransactions))

    dispatch(setLastNotificationText('Запись удалена'))

    await pushChangesWithRetry(dbService)
  }

  const handleLogout = () => {
    localStorage.removeItem('config')
    window.location.reload()
  }

  const handleSetIsAuthenticated = (value: boolean) => {
    dispatch(setIsAuthenticated(value))
  }

  const handleSetLastNotificationText = (text: string) => {
    dispatch(setLastNotificationText(text))
  }

  const handleSuccessfulLogin = () => {
    handleSetIsAuthenticated(true)
  }

  const handleDismissNotification = () => {
    handleSetLastNotificationText('')
  }

  if (!isAuthenticated) {
    return <Login onSuccessfulLogin={handleSuccessfulLogin} />
  }
  return (
    <App
      transactions={transactions}
      isLoading={isLoading || !isInitialized}
      offlineMode={offlineMode}
      lastNotificationText={lastNotificationText}
      onLogout={handleLogout}
      onAddTransaction={addTransaction}
      onEditTransaction={editTransaction}
      onRemoveTransaction={removeTransaction}
      onDismissNotification={handleDismissNotification}
    />
  )
}
