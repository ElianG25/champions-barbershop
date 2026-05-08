'use client'

import { useMemo, useState } from 'react'

const PHONE_COUNTRIES = [
  {
    code: 'ES',
    label: 'España',
    prefix: '+34',
    digits: 9,
    placeholder: '612345678',
  },
  {
    code: 'DO',
    label: 'Rep. Dominicana',
    prefix: '+1',
    digits: 10,
    placeholder: '8291234567',
  },
  {
    code: 'US',
    label: 'Estados Unidos',
    prefix: '+1',
    digits: 10,
    placeholder: '3051234567',
  },
]

type PhoneFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function PhoneField({ value, onChange }: PhoneFieldProps) {
  const [countryCode, setCountryCode] = useState('ES')

  const country = useMemo(
    () => PHONE_COUNTRIES.find((item) => item.code === countryCode) || PHONE_COUNTRIES[0],
    [countryCode]
  )

  const localNumber = value.startsWith(country.prefix)
    ? value.replace(country.prefix, '')
    : value.replace(/\D/g, '')

  function handleCountryChange(code: string) {
    const nextCountry =
      PHONE_COUNTRIES.find((item) => item.code === code) || PHONE_COUNTRIES[0]

    setCountryCode(code)

    const cleanLocal = localNumber.replace(/\D/g, '').slice(0, nextCountry.digits)

    onChange(`${nextCountry.prefix}${cleanLocal}`)
  }

  function handleNumberChange(input: string) {
    const clean = input.replace(/\D/g, '').slice(0, country.digits)

    onChange(`${country.prefix}${clean}`)
  }

  const isComplete = localNumber.length === country.digits

  return (
    <div>
      <div className="grid grid-cols-[130px_1fr] border border-white/10 bg-white/[0.04] focus-within:border-[var(--brand)]">
        <select
          value={countryCode}
          onChange={(event) => handleCountryChange(event.target.value)}
          className="border-r border-white/10 bg-transparent px-3 py-4 text-sm font-semibold text-[var(--app-text)] outline-none"
        >
          {PHONE_COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.prefix} {item.code}
            </option>
          ))}
        </select>

        <input
          value={localNumber}
          onChange={(event) => handleNumberChange(event.target.value)}
          placeholder={country.placeholder}
          inputMode="numeric"
          className="min-w-0 bg-transparent px-4 py-4 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--app-muted)]">
          {country.label} · {country.digits} dígitos
        </p>

        {value && (
          <p
            className={`text-xs font-semibold ${
              isComplete ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {isComplete ? 'Número válido' : 'Número incompleto'}
          </p>
        )}
      </div>
    </div>
  )
}

export function isValidPhoneNumber(value: string) {
  const clean = value.replace(/\D/g, '')

  return PHONE_COUNTRIES.some((country) => {
    const expected = `${country.prefix}${''.padEnd(country.digits, '0')}`.replace(/\D/g, '')
    const prefixDigits = country.prefix.replace(/\D/g, '')

    return clean.startsWith(prefixDigits) && clean.length === expected.length
  })
}