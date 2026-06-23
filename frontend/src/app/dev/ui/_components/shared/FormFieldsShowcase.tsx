'use client';

import { useState } from 'react';
import { ShowcaseSection } from '../ShowcaseSection';
import {
  TextField,
  PasswordField,
  EmailField,
  NumberField,
  PhoneField,
  TextareaField,
  DateField,
  CheckboxField,
  SelectField,
} from '@/shared/ui/form-fields';

const selectOptions = [
  { value: 'option1', label: 'オプション1' },
  { value: 'option2', label: 'オプション2' },
  { value: 'option3', label: 'オプション3' },
];

export function FormFieldsShowcase() {
  const [text, setText] = useState('サンプルテキスト');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('demo@example.com');
  const [number, setNumber] = useState<number | ''>(42);
  const [phone, setPhone] = useState('090-1234-5678');
  const [textarea, setTextarea] = useState('複数行のテキスト\nサンプルです');
  const [date, setDate] = useState('2026-01-01');
  const [checked, setChecked] = useState(true);
  const [select, setSelect] = useState('option1');

  return (
    <>
      <ShowcaseSection
        id='text-field'
        title='TextField'
        filePath='src/shared/ui/form-fields/ui/TextField.tsx'
      >
        <div className='max-w-sm'>
          <TextField
            id='demo-text'
            label='テキスト'
            value={text}
            onChange={setText}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='password-field'
        title='PasswordField'
        filePath='src/shared/ui/form-fields/ui/PasswordField.tsx'
      >
        <div className='max-w-sm'>
          <PasswordField
            id='demo-password'
            label='パスワード'
            value={password}
            onChange={setPassword}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='email-field'
        title='EmailField'
        filePath='src/shared/ui/form-fields/ui/EmailField.tsx'
      >
        <div className='max-w-sm'>
          <EmailField
            id='demo-email'
            label='メールアドレス'
            value={email}
            onChange={setEmail}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='number-field'
        title='NumberField'
        filePath='src/shared/ui/form-fields/ui/NumberField.tsx'
      >
        <div className='max-w-sm'>
          <NumberField
            id='demo-number'
            label='数値'
            value={number}
            onChange={setNumber}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='phone-field'
        title='PhoneField'
        filePath='src/shared/ui/form-fields/ui/PhoneField.tsx'
      >
        <div className='max-w-sm'>
          <PhoneField
            id='demo-phone'
            label='電話番号'
            value={phone}
            onChange={setPhone}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='textarea-field'
        title='TextareaField'
        filePath='src/shared/ui/form-fields/ui/TextareaField.tsx'
      >
        <div className='max-w-sm'>
          <TextareaField
            id='demo-textarea'
            label='テキストエリア'
            value={textarea}
            onChange={setTextarea}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='date-field'
        title='DateField'
        filePath='src/shared/ui/form-fields/ui/DateField.tsx'
      >
        <div className='max-w-sm'>
          <DateField
            id='demo-date'
            label='日付'
            value={date}
            onChange={setDate}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='checkbox-field'
        title='CheckboxField'
        filePath='src/shared/ui/form-fields/ui/CheckboxField.tsx'
      >
        <div className='max-w-sm'>
          <CheckboxField
            id='demo-checkbox'
            label='チェックボックス'
            checked={checked}
            onChange={setChecked}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='select-field'
        title='SelectField'
        filePath='src/shared/ui/form-fields/ui/SelectField.tsx'
      >
        <div className='max-w-sm'>
          <SelectField
            id='demo-select'
            label='セレクト'
            value={select}
            onChange={setSelect}
            options={selectOptions}
          />
        </div>
      </ShowcaseSection>
    </>
  );
}
