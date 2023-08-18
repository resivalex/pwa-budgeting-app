import styled from 'styled-components'

interface Props {
  value: string
  isExpanded: boolean
  onChange: (type: 'income' | 'expense' | 'transfer') => void
  onExpand: () => void
  onComplete: () => void
}

const Option = styled.div<{ isActive: boolean }>`
  background-color: ${(props) => (props.isActive ? '#3273dc' : '#fff')};
  color: ${(props) => (props.isActive ? '#fff' : '#3273dc')};
  border: 1px solid #3273dc;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
  cursor: pointer;

  &:not(:first-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: none;
  }

  &:not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
`

const Container = styled.div`
  outline: none;
  display: inline-flex;
  flex-grow: 1;

  &:focus {
    border-radius: 4px;
    box-shadow: 0 0 0 2px rgba(50, 115, 220, 0.3);
  }
`

export default function TypeStep({ value, isExpanded, onChange, onExpand, onComplete }: Props) {
  function renderSelectedOption() {
    switch (value) {
      case 'expense':
        return 'Расход'
      case 'income':
        return 'Доход'
      case 'transfer':
        return 'Перевод'
      default:
        return 'Тип?'
    }
  }

  const handleOptionClick = (type: 'income' | 'expense' | 'transfer') => {
    onChange(type)
    onComplete()
  }

  if (!isExpanded) {
    return (
      <div className="field">
        <Container tabIndex={0} onClick={onExpand}>
          <Option isActive>{renderSelectedOption()}</Option>
        </Container>
      </div>
    )
  }

  return (
    <div className="field">
      <Container tabIndex={0}>
        <Option isActive={value === 'expense'} onClick={() => handleOptionClick('expense')}>
          Расход
        </Option>
        <Option isActive={value === 'income'} onClick={() => handleOptionClick('income')}>
          Доход
        </Option>
        <Option isActive={value === 'transfer'} onClick={() => handleOptionClick('transfer')}>
          Перевод
        </Option>
      </Container>
    </div>
  )
}
