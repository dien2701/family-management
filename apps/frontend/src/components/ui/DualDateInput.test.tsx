import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { emptyDualDate, type DualDateOptions, type DualDateValue } from '@/utils/lunar'
import { DualDateInput } from './DualDateInput'

function Harness({
  initial = emptyDualDate(),
  ...options
}: { initial?: DualDateValue } & DualDateOptions) {
  const [value, setValue] = useState(initial)
  return <DualDateInput label="Ngày mất" value={value} onChange={setValue} {...options} />
}

const setup = (props: Parameters<typeof Harness>[0] = {}) => ({
  user: userEvent.setup(),
  ...render(<Harness {...props} />),
})

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  day: string,
  month: string,
  year: string,
) {
  await user.type(screen.getByLabelText('Ngày'), day)
  await user.type(screen.getByLabelText('Tháng'), month)
  await user.type(screen.getByLabelText('Năm'), year)
}

describe('DualDateInput', () => {
  it('nhập dương 17/02/2026 thì hiện 1/1 âm lịch', async () => {
    const { user } = setup()
    await fill(user, '17', '2', '2026')
    expect(screen.getByText('1/1 âm lịch năm 2026')).toBeInTheDocument()
    expect(screen.getByText('Âm lịch tương ứng')).toBeInTheDocument()
  })

  it('nhập âm 15/6 nhuận 2025 thì hiện ngày dương 08/08/2025', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: 'Âm lịch' }))
    await fill(user, '15', '6', '2025')
    await user.click(screen.getByRole('checkbox', { name: 'Tháng nhuận' }))
    expect(screen.getByText('Thứ sáu, 08/08/2025')).toBeInTheDocument()
    expect(
      screen.getByText('Năm 2025 âm lịch nhuận tháng 6.', { selector: 'p' }),
    ).toBeInTheDocument()
  })

  it('báo ngày không tồn tại khi nhập 30/12 âm của tháng thiếu', async () => {
    const { user } = setup({ initial: emptyDualDate('lunar') })
    await fill(user, '30', '12', '2025')
    expect(screen.getByRole('alert')).toHaveTextContent('chỉ có 29 ngày, không có ngày 30')
    expect(screen.getByLabelText('Ngày')).toHaveAttribute('aria-invalid', 'true')
  })

  it('đổi lịch thì chuyển ngày hợp lệ sang số của lịch kia', async () => {
    const { user } = setup({
      initial: { calendar: 'solar', day: '8', month: '8', year: '2025', leap: false },
    })
    await user.click(screen.getByRole('radio', { name: 'Âm lịch' }))
    expect(screen.getByLabelText('Ngày')).toHaveValue('15')
    expect(screen.getByLabelText('Tháng')).toHaveValue('6')
    expect(screen.getByRole('checkbox', { name: 'Tháng nhuận' })).toBeChecked()
  })

  it('chỉ nhận chữ số', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Năm'), '20a2b6')
    expect(screen.getByLabelText('Năm')).toHaveValue('2026')
  })

  it('cho phép chỉ nhập năm', async () => {
    const { user } = setup({ allowYearOnly: true })
    await user.type(screen.getByLabelText('Năm'), '1990')
    expect(screen.getByText(/Chỉ có năm 1990 dương lịch/)).toBeInTheDocument()
  })

  it('cho phép chỉ nhập ngày/tháng âm, hiện ngày cúng của năm tham chiếu', async () => {
    const { user } = setup({
      initial: emptyDualDate('lunar'),
      allowNoYear: true,
      referenceLunarYear: 2026,
    })
    await user.type(screen.getByLabelText('Ngày'), '15')
    await user.type(screen.getByLabelText('Tháng'), '6')
    expect(screen.getByText('Ngày 15/6 âm lịch')).toBeInTheDocument()
    expect(screen.getByText(/Năm 2026 âm lịch rơi vào Thứ ba, 28\/07\/2026/)).toBeInTheDocument()
  })

  it('có thể điều khiển bằng bàn phím: radio và ô nhập nhận focus', async () => {
    const { user } = setup()
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Dương lịch' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Âm lịch' })).toBeChecked()
    await user.tab()
    expect(screen.getByLabelText('Ngày')).toHaveFocus()
  })
})
