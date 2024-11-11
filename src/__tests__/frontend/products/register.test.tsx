```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ProductRegister from '@/app/products/register/page';
import '@testing-library/jest-dom';

const mockResponse = {
  success: true,
  productId: '123'
};

const server = setupServer(
  rest.post('/api/products', (req, res, ctx) => {
    return res(ctx.json(mockResponse));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('商品登録画面', () => {
  beforeEach(() => {
    render(<ProductRegister />);
  });

  test('必須項目が入力されていない場合、エラーメッセージが表示される', async () => {
    const submitButton = screen.getByRole('button', { name: '登録する' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('商品名は必須です')).toBeInTheDocument();
    expect(await screen.findByText('価格は必須です')).toBeInTheDocument();
    expect(await screen.findByText('在庫数は必須です')).toBeInTheDocument();
  });

  test('商品情報を入力して登録が成功する', async () => {
    const nameInput = screen.getByLabelText('商品名');
    const priceInput = screen.getByLabelText('価格');
    const stockInput = screen.getByLabelText('在庫数');
    const descriptionInput = screen.getByLabelText('商品説明');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(nameInput, 'テスト商品');
    await userEvent.type(priceInput, '1000');
    await userEvent.type(stockInput, '100');
    await userEvent.type(descriptionInput, '商品の説明文');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('商品を登録しました')).toBeInTheDocument();
    });
  });

  test('画像アップロードが正常に動作する', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const imageUploader = screen.getByTestId('image-uploader');

    await userEvent.upload(imageUploader, file);

    expect(screen.getByAltText('プレビュー画像')).toBeInTheDocument();
  });

  test('入力値のバリデーションが正しく機能する', async () => {
    const priceInput = screen.getByLabelText('価格');
    const stockInput = screen.getByLabelText('在庫数');

    await userEvent.type(priceInput, '-100');
    await userEvent.type(stockInput, '-10');

    const submitButton = screen.getByRole('button', { name: '登録する' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('価格は0以上の数値を入力してください')).toBeInTheDocument();
    expect(await screen.findByText('在庫数は0以上の数値を入力してください')).toBeInTheDocument();
  });

  test('APIエラー時にエラーメッセージが表示される', async () => {
    server.use(
      rest.post('/api/products', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ message: 'サーバーエラーが発生しました' })
        );
      })
    );

    const nameInput = screen.getByLabelText('商品名');
    const priceInput = screen.getByLabelText('価格');
    const stockInput = screen.getByLabelText('在庫数');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(nameInput, 'テスト商品');
    await userEvent.type(priceInput, '1000');
    await userEvent.type(stockInput, '100');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました')).toBeInTheDocument();
    });
  });

  test('確認ダイアログが表示される', async () => {
    const nameInput = screen.getByLabelText('商品名');
    const priceInput = screen.getByLabelText('価格');
    const stockInput = screen.getByLabelText('在庫数');
    const submitButton = screen.getByRole('button', { name: '登録する' });

    await userEvent.type(nameInput, 'テスト商品');
    await userEvent.type(priceInput, '1000');
    await userEvent.type(stockInput, '100');

    fireEvent.click(submitButton);

    expect(screen.getByText('以下の内容で登録してよろしいですか？')).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: '確認' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('商品を登録しました')).toBeInTheDocument();
    });
  });
});
```