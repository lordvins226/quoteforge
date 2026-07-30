import pkg from "../package.json";

export const VERSION = (pkg as { version: string }).version;
