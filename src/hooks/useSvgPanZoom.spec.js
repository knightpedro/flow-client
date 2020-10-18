import { renderHook } from '@testing-library/react-hooks';
import { useSvgPanZoom } from './useSvgPanZoom';

const PADDING = 5;
const BBOX = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};

describe('useSvgPanZoom', () => {
  let svgRef = {
    current: {
      getBBox: jest.fn().mockImplementation(() => BBOX)
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use svgPanZoom', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    expect(result.current).not.toBeNull();
  });

  it('calculates initial viewBox with padding', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    const { viewBox } = result.current;
    expect(viewBox).toEqual({
      x: -PADDING / 2,
      y: -PADDING / 2,
      width: BBOX.width + PADDING,
      height: BBOX.height + PADDING
    });
  });
});
