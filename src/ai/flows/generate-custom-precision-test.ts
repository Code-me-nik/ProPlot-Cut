'use server';
/**
 * @fileOverview A Genkit flow for generating G-code for custom precision test patterns from natural language descriptions.
 *
 * - generateCustomPrecisionTest - A function that handles the G-code generation process.
 * - GenerateCustomPrecisionTestInput - The input type for the generateCustomPrecisionTest function.
 * - GenerateCustomPrecisionTestOutput - The return type for the generateCustomPrecisionTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomPrecisionTestInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A natural language description of the desired precision test pattern (e.g., a series of concentric circles with varying radii, a complex zigzag path).' 
    ),
});
export type GenerateCustomPrecisionTestInput = z.infer<
  typeof GenerateCustomPrecisionTestInputSchema
>;

const GenerateCustomPrecisionTestOutputSchema = z.object({
  gcode: z.string().describe('The generated G-code for the test pattern.'),
});
export type GenerateCustomPrecisionTestOutput = z.infer<
  typeof GenerateCustomPrecisionTestOutputSchema
>;

export async function generateCustomPrecisionTest(
  input: GenerateCustomPrecisionTestInput
): Promise<GenerateCustomPrecisionTestOutput> {
  return generateCustomPrecisionTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomPrecisionTestPrompt',
  input: {schema: GenerateCustomPrecisionTestInputSchema},
  output: {schema: GenerateCustomPrecisionTestOutputSchema},
  prompt: `You are an expert G-code generator for CNC and plotter machines. Your task is to convert a natural language description of a precision test pattern into valid G-code.

Ensure the generated G-code is safe and suitable for execution on a machine. Assume standard G-code conventions (e.g., G21 for millimeters, G90 for absolute positioning).

Here is the description of the desired test pattern:

Description: {{{description}}}

Output only the G-code, wrapped in a JSON object with a 'gcode' key as specified in the output schema.`, 
});

const generateCustomPrecisionTestFlow = ai.defineFlow(
  {
    name: 'generateCustomPrecisionTestFlow',
    inputSchema: GenerateCustomPrecisionTestInputSchema,
    outputSchema: GenerateCustomPrecisionTestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
