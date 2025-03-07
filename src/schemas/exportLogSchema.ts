import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     ExportLogInput:
 *       type: object
 *       required:
 *         - exportDate
 *         - exportType
 *         - status
 *       properties:
 *         exportDate:
 *           type: string
 *           format: date-time
 *           description: The date and time of the export
 *         exportType:
 *           type: string
 *           description: The type of export (e.g., 'INVOICE', 'CUSTOMER', 'APPOINTMENT')
 *         status:
 *           type: string
 *           enum: ['SUCCESS', 'FAILED', 'IN_PROGRESS']
 *           description: The status of the export
 *         errorMessage:
 *           type: string
 *           description: Error message if the export failed (optional)
 *         metadata:
 *           type: object
 *           description: Additional metadata about the export (optional)
 *     ExportLog:
 *       allOf:
 *         - $ref: '#/components/schemas/ExportLogInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The auto-generated ID of the export log
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */
export const exportLogSchema = z.object({
    exportDate: z.string().datetime('Export date must be a valid ISO datetime string'),
    exportType: z.string().min(1, 'Export type is required'),
    status: z.enum(['SUCCESS', 'FAILED', 'IN_PROGRESS']),
    errorMessage: z.string().optional(),
    metadata: z.record(z.any()).optional()
});

export type ExportLog = z.infer<typeof exportLogSchema>; 