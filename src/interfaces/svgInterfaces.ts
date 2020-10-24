export interface Point {
  x: number;
  y: number;
}

export interface ViewBox extends Point {
  height: number;
  width: number;
}

export interface EditorElement {
  name: string;
  icon: JSX.Element;
  component: JSX.Element;
}
