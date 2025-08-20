import { z } from 'zod';
import { docxTool } from './docx';
import { xlsxTool } from './xlsx';
import { oaDocxTool } from './oa-docx';
import { OutputType } from './type';

export const InputType = z.object({
  format: z.enum(['xlsx', 'docx', 'oa.docx']),
  markdown: z.string()
});

export async function tool(params: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { format, markdown } = params;

  if (format === 'xlsx') {
    return xlsxTool({ markdown });
  }
  if (format === 'docx') {
    return docxTool({ markdown });
  }
  if (format === 'oa.docx') {
    return oaDocxTool({ markdown });
  }
  return Promise.reject('Invalid format');
}
