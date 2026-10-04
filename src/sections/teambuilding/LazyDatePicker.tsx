import React, { lazy, Suspense } from 'react';

// Heavy deps — only loaded when TeambuildingDetailView mounts
const DatePickerInner = lazy(async () => {
  const [{ default: DatePicker, registerLocale }, { az }] = await Promise.all([
    import('react-datepicker'),
    import('date-fns/locale/az'),
  ]);
  await import('react-datepicker/dist/react-datepicker.css');
  registerLocale('az', az);

  return {
    default: ({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) => (
      <DatePicker
        locale="az"
        dateFormat="dd.MM.yyyy"
        placeholderText="Tarix seçin..."
        selected={value ? new Date(value) : null}
        onChange={(d: Date | null) => onChange(d ? d.toISOString().split('T')[0] : '')}
        className={className}
        calendarClassName="er-calendar"
        minDate={new Date()}
        wrapperClassName="w-full"
        popperPlacement="top-start"
      />
    ),
  };
});

interface Props {
  value: string;
  onChange: (v: string) => void;
  className: string;
}

export default function LazyDatePicker(props: Props) {
  return (
    <Suspense fallback={
      <input
        type="date"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        className={props.className}
      />
    }>
      <DatePickerInner {...props} />
    </Suspense>
  );
}