import { useSelector, useDispatch } from 'react-redux'
import { TransactionDTO } from './Transaction'
import { convertToUtcTime } from './date-utils'
import { v4 as uuidv4 } from 'uuid'
import { AccountDetails } from './TransactionAggregator'
import TransactionForm from './TransactionForm'
import {
  setType,
  setAmount,
  setAccount,
  setCurrency,
  setCategory,
  setPayee,
  setComment,
  setDatetime,
  selectTransactionForm,
} from './redux/transactionFormSlice'
import { useAppSelector } from './redux/appSlice'
import _ from 'lodash'

type Props = {
  onAdd: (t: TransactionDTO) => void
}

export default function TransactionFormContainer({ onAdd }: Props) {
  const dispatch = useDispatch()
  const transactionForm = useSelector(selectTransactionForm)
  const accounts: AccountDetails[] = useAppSelector((state) => state.accountDetails)
  const categories: string[] = useAppSelector((state) => state.categories)
  const currencies: string[] = useAppSelector((state) => state.currencies)

  if (accounts.length === 0) {
    return null
  }

  const currency = _.includes(currencies, transactionForm.currency)
    ? transactionForm.currency
    : currencies[0]
  const currencyAccounts = accounts.filter((a) => a.currency === currency)
  const account = _.includes(
    currencyAccounts.map((a) => a.account),
    transactionForm.account
  )
    ? transactionForm.account
    : currencyAccounts[0].account
  const category = _.includes(categories, transactionForm.category)
    ? transactionForm.category
    : categories[0]

  const handleDatetimeChange = (value: Date | null) => {
    if (value) {
      dispatch(setDatetime(value.toISOString()))
    } else {
      dispatch(setDatetime(new Date().toISOString()))
    }
  }

  const handleAdd = () => {
    onAdd({
      _id: uuidv4(),
      datetime: convertToUtcTime(transactionForm.datetime),
      account: account,
      category: category,
      type: transactionForm.type,
      amount: (parseFloat(transactionForm.amount) || 0).toFixed(2),
      currency: currency,
      payee: transactionForm.payee,
      comment: transactionForm.comment,
    })
  }

  return (
    <TransactionForm
      type={transactionForm.type}
      setType={(type: 'income' | 'expense' | 'transfer') => dispatch(setType(type))}
      amount={transactionForm.amount}
      setAmount={(amount: string) => dispatch(setAmount(amount))}
      account={account}
      currency={currency}
      category={category}
      setCategory={(category: string) => dispatch(setCategory(category))}
      payee={transactionForm.payee}
      setPayee={(payee: string) => dispatch(setPayee(payee))}
      comment={transactionForm.comment}
      setComment={(comment: string) => dispatch(setComment(comment))}
      datetime={new Date(transactionForm.datetime)}
      onAccountChange={(account) => dispatch(setAccount(account))}
      onDatetimeChange={handleDatetimeChange}
      onAdd={handleAdd}
      accounts={currencyAccounts}
      categories={categories}
      currencies={currencies}
      onCurrencyChange={(currency: string) => dispatch(setCurrency(currency))}
    />
  )
}
