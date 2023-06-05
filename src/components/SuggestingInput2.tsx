import React, { useState, useRef, useMemo } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const Input = styled.input`
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
`

const Suggestion = styled.div`
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: #f1f1f1;
  }
`

const Suggestions = styled.div`
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
  z-index: 1;
  background-color: white;
  border-radius: 5px;
`

interface SuggestingInputProps {
  suggestions: string[]
  value: string
  onChange: (value: string) => void
}

export default function SuggestingInput({ suggestions, value, onChange }: SuggestingInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = useMemo(() => {
    if (!value) {
      return suggestions
    }

    return suggestions.filter(
      (suggestion) => suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
    )
  }, [suggestions, value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange(value)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
  }

  return (
    <Wrapper ref={inputRef}>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {showSuggestions && (
        <Suggestions>
          {filteredSuggestions.map((suggestion, index) => (
            <Suggestion key={index} onMouseDown={() => handleSuggestionClick(suggestion)}>
              {suggestion}
            </Suggestion>
          ))}
        </Suggestions>
      )}
    </Wrapper>
  )
}
