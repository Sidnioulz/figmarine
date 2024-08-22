// TEMP FIXME: this is a debug file.

import { log } from '@figmarine/logger';
import { Client } from './client';

const client = await Client();

///////////////////////////////////////////////////////////////////////////////////////
// const fileKey = 'iVmBRdBxouWlkHx8a52CY2'; // Steve's debug file
const fileKey = 'k9steJchLj9AnVUYSBE7TS'; // Tanuki Web components

///////////////////////////////////////////////////////////////////////////////////////
log(`Getting file: ${fileKey}`);
export const file = await client.v1.getFile({ fileKey });
// console.log(JSON.stringify(file.data.document.children[0].children[1], null, 2))

///////////////////////////////////////////////////////////////////////////////////////
// log(`Getting published variables for: ${fileKey}`);
// const pub = await client.v1.getPublishedVariables(fileKey)
// console.log('\n\n\n\n\n\n\n\n\n\n\n\n')
// console.log(pub)

///////////////////////////////////////////////////////////////////////////////////////
log(`Getting local variables for: ${fileKey}`);
export const local = await client.v1.getLocalVariables(fileKey);
console.log('\n\n\n\n\n\n\n\n\n\n\n\n');
console.log(local.data.meta);
