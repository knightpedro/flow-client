import { act, renderHook } from '@testing-library/react-hooks';
import { useSvgPanZoom } from './useSvgPanZoom';

const BBOX = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};
const POINT = {
  x: 20,
  y: 30
};

describe('useSvgPanZoom', () => {
  let svgRef;

  beforeEach(() => {
    svgRef = {
      current: {
        createSVGPoint: () => ({
          x: 0,
          y: 0,
          matrixTransform: () => POINT
        }),
        getBBox: () => BBOX,
        getScreenCTM: () => null
      }
    };
  });

  it('calculates initial viewBox', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    expect(result.current.viewBox).toEqual({
      x: -2.5,
      y: -2.5,
      width: 105,
      height: 105
    });
  });

  it('pans to a point', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));

    act(() => {
      result.current.panTo(POINT);
    });

    expect(result.current.viewBox).toEqual({
      x: -32.5,
      y: -22.5,
      width: 105,
      height: 105
    });
  });

  it('sets panning to true on mousedown', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    expect(result.current.panning).not.toBeTruthy();
    const event = new MouseEvent('mousedown');

    act(() => {
      result.current.handleMouseDown(event);
    });

    expect(result.current.panning).toBeTruthy();
  });

  it('sets panning to false on mouseup', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    const mouseDownEvent = new MouseEvent('mousedown');
    const mouseUpEvent = new MouseEvent('mouseup');

    expect(result.current.panning).not.toBeTruthy();

    act(() => {
      result.current.handleMouseDown(mouseDownEvent);
    });

    expect(result.current.panning).toBeTruthy();

    act(() => {
      result.current.handleMouseUp(mouseUpEvent);
    });

    expect(result.current.panning).not.toBeTruthy();
  });

  it('resets the viewBox', () => {
    const { result } = renderHook(() => useSvgPanZoom(svgRef));
    const initialViewBox = {
      x: -2.5,
      y: -2.5,
      width: 105,
      height: 105
    };

    // Calculate initial viewBox correctly
    expect(result.current.viewBox).toEqual(initialViewBox);

    // Pan away
    act(() => {
      result.current.panTo(POINT);
    });

    // ViewBox changes based on pan
    expect(result.current.viewBox).not.toEqual(initialViewBox);

    // Reset viewBox
    act(() => {
      result.current.reset();
    });

    // viewBox is reset to initial value
    expect(result.current.viewBox).toEqual(initialViewBox);
  });
});
