declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface GeographyType {
    rsmKey: string;
    properties: {
      name?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string | ((width: number, height: number) => unknown);
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
      [key: string]: unknown;
    };
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown> | GeographyType[];
    parseGeographies?: (features: GeographyType[]) => GeographyType[];
    children: (data: {
      geographies: GeographyType[];
      outline?: string;
      borders?: string;
    }) => React.ReactNode;
  }

  export interface GeographyProps {
    geography: GeographyType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    className?: string;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseUp?: (event: React.MouseEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    [key: string]: unknown;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: () => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    className?: string;
    style?: React.CSSProperties;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    children?: React.ReactNode;
  }

  export interface LineProps {
    from?: [number, number];
    to?: [number, number];
    coordinates?: [number, number][];
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: string;
    strokeDasharray?: string;
    className?: string;
    style?: React.CSSProperties;
    fill?: string;
  }

  export interface SphereProps {
    id?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface GraticuleProps {
    stroke?: string;
    className?: string;
    style?: React.CSSProperties;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Line: React.FC<LineProps>;
  export const Sphere: React.FC<SphereProps>;
  export const Graticule: React.FC<GraticuleProps>;
  export const Annotation: React.FC<any>;
  export const MapProvider: React.FC<any>;
  export const ZoomPanProvider: React.FC<any>;
}

