import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     TravelTimeInput:
 *       type: object
 *       required:
 *         - date
 *         - startLocation
 *         - endLocation
 *         - duration
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: The date of travel
 *         startLocation:
 *           type: string
 *           description: Starting location address
 *         endLocation:
 *           type: string
 *           description: Ending location address
 *         duration:
 *           type: number
 *           description: Travel duration in minutes
 *         distance:
 *           type: number
 *           description: Travel distance in kilometers (optional)
 *         appointmentId:
 *           type: string
 *           description: Associated appointment ID (optional)
 *         notes:
 *           type: string
 *           description: Additional notes about the travel (optional)
 *     TravelTime:
 *       allOf:
 *         - $ref: '#/components/schemas/TravelTimeInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The auto-generated ID of the travel time record
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */
export const travelTimeSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startLocation: z.string().min(1, 'Start location is required'),
    endLocation: z.string().min(1, 'End location is required'),
    duration: z.number().positive('Duration must be positive'),
    distance: z.number().positive('Distance must be positive').optional(),
    appointmentId: z.string().optional(),
    notes: z.string().optional()
});

export type TravelTime = z.infer<typeof travelTimeSchema>; 