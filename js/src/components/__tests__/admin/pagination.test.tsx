import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import Pagination from '../../admin/Pagination';

test('Pagination, first page', async () => {

  const setPage = vi.fn();
  const setPageSize = vi.fn();

  render(<Pagination pageSize={10} setPageSize={setPageSize} setPage={setPage} page={1} total={200} />);

  const user = userEvent.setup();

  expect(screen.getAllByLabelText(/Go to page \d+/)).toHaveLength(5);
  expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 2')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 4')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 20')).toBeInTheDocument();

  await user.click(screen.getByLabelText('Go to page 4'));
  expect(setPage).toHaveBeenCalledWith(4);
});

test('Pagination: 11th element creates second page', async () => {

  const setPage = vi.fn();
  const setPageSize = vi.fn();

  render(<Pagination pageSize={10} setPageSize={setPageSize} setPage={setPage} page={1} total={11} />);

  const user = userEvent.setup();

  expect(screen.getAllByLabelText(/Go to page \d+/)).toHaveLength(2);
  expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 2')).toBeInTheDocument();
});

test('Pagination, page in the middle', async () => {
  const setPage = vi.fn();
  const setPageSize = vi.fn();

  render(<Pagination pageSize={10} setPageSize={setPageSize} setPage={setPage} page={10} total={200} />);

  expect(screen.getAllByLabelText(/Go to page \d+/)).toHaveLength(9);
  expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 7')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 8')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 9')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 10')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 11')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 12')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 13')).toBeInTheDocument();
  expect(screen.getByLabelText('Go to page 20')).toBeInTheDocument();
});

test('Pagination, set page size go back to first page', async () => {
  const setPage = vi.fn();
  const setPageSize = vi.fn();

  render(<Pagination pageSize={10} setPageSize={setPageSize} setPage={setPage} page={10} total={200} />);

  expect(screen.getAllByLabelText(/Go to page \d+/)).toHaveLength(9);

  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), '20');
  expect(setPageSize).toHaveBeenCalledWith(20);
  expect(setPage).toHaveBeenCalledWith(1);
});
