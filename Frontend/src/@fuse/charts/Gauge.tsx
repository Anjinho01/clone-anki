import * as React from 'react';

// global unique key for every gauge (needed for SVG filters to stay separated)
let uniqueId = 0;

export interface IGaugeProps {
  label: string;
  min: number;
  max: number;
  value: number;
  width: number;
  height: number;
  minMaxLabelsOffset: number;
  minTxt?: string;
  maxTxt?: string;
  color: string;
  backgroundColor: string;
  topLabelStyle: React.CSSProperties;
  valueLabelStyle: React.CSSProperties;
  minMaxLabelStyle: React.CSSProperties;
  valueFormatter: (value: number) => string;
}

interface IGaugeState {
  animatedValue: number;
}

export default class Gauge extends React.Component<IGaugeProps, IGaugeState> {
  state: IGaugeState = { animatedValue: this.props.value };

  static defaultProps: IGaugeProps = {
    label: 'React SVG Gauge',
    min: 0,
    max: 100,
    value: 40,
    width: 400,
    height: 320,
    minMaxLabelsOffset: 25,
    color: '#fe0400',
    backgroundColor: '#edebeb',
    topLabelStyle: {
      textAnchor: 'middle',
      fill: '#999999',
      fontWeight: 'bold',
      fillOpacity: 1,
    },
    valueLabelStyle: {
      textAnchor: 'middle',
      fill: '#010101',
      fontWeight: 'bold',
      fillOpacity: 1,
    },
    minMaxLabelStyle: {
      textAnchor: 'middle',
      fill: '#999999',
      fontSize: 20,
      fillOpacity: 1,
    },
    valueFormatter: (value: number) => `${value}`,
  };

  private uniqueFilterId?: string;
  private animationFrame?: number;

  componentDidUpdate(prevProps: IGaugeProps) {
    if (prevProps.value !== this.props.value) {
      this.startAnimation(prevProps.value, this.props.value);
    }
  }

  componentWillUnmount() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  private startAnimation = (from: number, to: number) => {
    const duration = 600;
    const start = performance.now();
    const animate = (time: number) => {
      const elapsed = time - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
      const current = from + (to - from) * eased;
      this.setState({ animatedValue: current });
      if (t < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(animate);
  };

  private _getPathValues = (value: number) => {
    const { min, max, width, height } = this.props;
    if (value < min) value = min;
    if (value > max) value = max;
    const alpha = (1 - (value - min) / (max - min)) * Math.PI;
    const Ro = width / 2 - width / 10;
    const Ri = Ro - width / 6.666666666666667;
    const Cx = width / 2;
    const Cy = height / 1.25;
    const Xo = Cx + Ro * Math.cos(alpha);
    const Yo = Cy - Ro * Math.sin(alpha);
    const Xi = Cx + Ri * Math.cos(alpha);
    const Yi = Cy - Ri * Math.sin(alpha);
    return { alpha, Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi };
  };

  private _getPath = (value: number) => {
    const { Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi } = this._getPathValues(value);
    return `M${Cx - Ri},${Cy} L${Cx - Ro},${Cy} A${Ro},${Ro} 0 0 1 ${Xo},${Yo} L${Xi},${Yi} A${Ri},${Ri} 0 0 0 ${Cx - Ri},${Cy} Z`;
  };

  render() {
    const {
      width,
      height,
      minMaxLabelsOffset,
      label,
      value,
      color,
      backgroundColor,
      topLabelStyle,
      valueLabelStyle,
      minMaxLabelStyle,
      minTxt,
      maxTxt,
      min,
      max,
      // valueFormatter,
    } = this.props;
    const { animatedValue } = this.state;

    const backgroundPath = this._getPath(max);
    const valuePath = this._getPath(animatedValue);

    const { Cx, Ro, Ri, Xo: maxXo, Cy, Xi: maxXi } = this._getPathValues(max);
    const {
      alpha,
      // Xo,
      // Yo,
      Cx: pivotX,
      Cy: pivotY,
      Ro: outerR,
      Ri: innerR,
    } = this._getPathValues(animatedValue);

    if (!this.uniqueFilterId) this.uniqueFilterId = `filter_${uniqueId++}`;
    const gradientId = `${this.uniqueFilterId}_needleGrad`;

    // pointer dimensions: increased size
    const pointerLength = (outerR - innerR) * 2.5; // 20% longer
    const pointerWidth = width / 20; // wider base

    // tip and base points
    const tipX = pivotX + pointerLength * Math.cos(alpha);
    const tipY = pivotY - pointerLength * Math.sin(alpha);
    const perpX = Math.sin(alpha);
    const perpY = Math.cos(alpha);
    const leftX = pivotX + perpX * pointerWidth;
    const leftY = pivotY + perpY * pointerWidth;
    const rightX = pivotX - perpX * pointerWidth;
    const rightY = pivotY - perpY * pointerWidth;
    const needlePoints = `${leftX},${leftY} ${rightX},${rightY} ${tipX},${tipY}`;

    const topStyle = topLabelStyle.fontSize
      ? topLabelStyle
      : { ...topLabelStyle, fontSize: width / 10 };
    const valStyle = valueLabelStyle.fontSize
      ? valueLabelStyle
      : { ...valueLabelStyle, fontSize: width / 8 };

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={this.uniqueFilterId}>
            <feOffset dx="0" dy="3" />
            <feGaussianBlur result="offset-blur" stdDeviation="5" />
            <feComposite
              operator="out"
              in="SourceGraphic"
              in2="offset-blur"
              result="inverse"
            />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite
              operator="in"
              in="color"
              in2="inverse"
              result="shadow"
            />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>

          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={pivotX}
            y1={pivotY}
            x2={tipX}
            y2={tipY}
          >
            {/* inferior transparente */}
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="transparent" />
            {/* superior preto */}
            <stop offset="50%" stopColor="#000" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>

        <path
          d={backgroundPath}
          fill={backgroundColor}
          stroke="none"
          filter={`url(#${this.uniqueFilterId})`}
        />
        <path
          d={valuePath}
          fill={color}
          stroke="none"
          filter={`url(#${this.uniqueFilterId})`}
        />

        {/* Agulha com metade transparente e metade preta */}
        <polygon points={needlePoints} fill={`url(#${gradientId})`} />

        <text x={width / 2} y={height / 8} style={topStyle}>
          {label}
        </text>
        <text x={width / 2} y={(height / 5) * 4} style={valStyle}>
          {value}
        </text>
        <text
          x={(Cx - Ro + (Cx - Ri)) / 2}
          y={Cy + minMaxLabelsOffset}
          style={minMaxLabelStyle}
        >
          {minTxt ?? min}
        </text>
        <text
          x={(maxXo + maxXi) / 2}
          y={Cy + minMaxLabelsOffset}
          style={minMaxLabelStyle}
        >
          {maxTxt ?? max}
        </text>
      </svg>
    );
  }
}
