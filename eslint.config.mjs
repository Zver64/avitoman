import globals from "globals";
import tseslint from "typescript-eslint";


export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: ["unused-imports"]
  }
];