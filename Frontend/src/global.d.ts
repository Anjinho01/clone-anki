/**
 * The module for importing CSS files.
 */
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

/**
 * The type definition for the Node.js process object with additional properties.
 */
type ProcessType = NodeJS.Process & {
  browser: boolean;
  env: {
    [key: string]: string | undefined;
  };
};

/**
 * The global process object.
 */
declare let process: ProcessType;

/**
 * The type definition for the Hot Module object.
 */
interface HotModule {
  hot?: {
    accept(arg0: string, arg1: () => void): unknown;
    status: () => string;
  };
}

declare const module: HotModule;
