import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     DigiBTWInput:
 *       type: object
 *       required:
 *         - date
 *         - amount
 *         - description
 *         - category
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the expense
 *         amount:
 *           type: number
 *           description: The expense amount
 *         description:
 *           type: string
 *           description: Description of the expense
 *         category:
 *           type: string
 *           description: Category of the expense
 *         invoiceId:
 *           type: string
 *           description: Associated invoice ID (optional)
 *         notes:
 *           type: string
 *           description: Additional notes (optional)
 *     DigiBTW:
 *       allOf:
 *         - $ref: '#/components/schemas/DigiBTWInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The auto-generated ID of the DigiBTW record
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */
export const digiBTWSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    invoiceId: z.string().optional(),
    notes: z.string().optional()
});

export type DigiBTW = z.infer<typeof digiBTWSchema>; 