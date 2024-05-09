import fs from "fs";
import { COOKIES_FILE } from './constants';

console.log(fs.existsSync(COOKIES_FILE))
// console.log(fs.readFileSync(COOKIES_FILE, {}).toJSON())