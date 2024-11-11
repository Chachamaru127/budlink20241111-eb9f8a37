```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Charts from "@/app/Charts/page";
import { Line, Bar, Pie } from "react-chartjs-2";

// Chartライブラリのモック
jest.mock('react-chartjs-2', () => ({
  Line: jest.fn(() => null),
  Bar: jest.fn(() => null), 
  Pie: jest.fn(() => null)
}));

const mockData = {
  labels: ["1月", "2月", "3月"],
  datasets: [
    {
      label: "売上",
      data: [100, 200, 300],
      borderColor: "#2C5282",
      backgroundColor: "rgba(44, 82, 130, 0.2)",
    }
  ]
};

const mockOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top" as const
    },
    title: {
      display: true,
      text: "データチャート"
    }
  }
};

describe("Charts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("折れ線グラフが正しくレンダリングされる", () => {
    render(<Charts data={mockData} type="line" options={mockOptions} />);
    expect(Line).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
        options: mockOptions
      }),
      {}
    );
  });

  it("棒グラフが正しくレンダリングされる", () => {
    render(<Charts data={mockData} type="bar" options={mockOptions} />);
    expect(Bar).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
        options: mockOptions
      }),
      {}
    );
  });

  it("円グラフが正しくレンダリングされる", () => {
    render(<Charts data={mockData} type="pie" options={mockOptions} />);
    expect(Pie).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
        options: mockOptions
      }),
      {}
    );
  });

  it("データが空の場合は適切なメッセージを表示", () => {
    render(<Charts data={{labels: [], datasets: []}} type="line" options={mockOptions} />);
    expect(screen.getByText("データがありません")).toBeInTheDocument();
  });

  it("異常系: 不正なチャートタイプが指定された場合エラーメッセージを表示", () => {
    // @ts-ignore
    render(<Charts data={mockData} type="invalid" options={mockOptions} />);
    expect(screen.getByText("不正なチャートタイプです")).toBeInTheDocument();
  });

  it("チャートのリサイズイベントが正しく処理される", async () => {
    const { container } = render(<Charts data={mockData} type="line" options={mockOptions} />);
    
    // リサイズイベントのシミュレート
    global.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      expect(Line).toHaveBeenCalledTimes(2); // 初期レンダリングと再レンダリング
    });
  });

  it("ツールチップが正しく表示される", async () => {
    render(<Charts data={mockData} type="line" options={mockOptions} />);
    
    const chart = screen.getByRole("img", { name: "データチャート" });
    await userEvent.hover(chart);
    
    // ツールチップの表示を確認
    await waitFor(() => {
      expect(screen.getByText("売上")).toBeInTheDocument();
    });
  });

  it("レジェンドのクリックイベントが正しく処理される", async () => {
    const { container } = render(<Charts data={mockData} type="line" options={mockOptions} />);
    
    const legend = container.querySelector(".chartjs-legend");
    fireEvent.click(legend!);
    
    await waitFor(() => {
      expect(Line).toHaveBeenCalledTimes(2);
    });
  });

  it("アニメーションが正しく実行される", async () => {
    const animationOptions = {
      ...mockOptions,
      animation: {
        duration: 1000
      }
    };
    
    render(<Charts data={mockData} type="line" options={animationOptions} />);
    
    await waitFor(() => {
      expect(Line).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            animation: expect.objectContaining({
              duration: 1000
            })
          })
        }),
        {}
      );
    });
  });
});
```